"""
PRISM LLM Service
Primary  : Google Gemini 2.0 Flash
Fallback : Groq (llama-3.3-70b-versatile) — fast, free, reliable
"""
import os, json, logging, asyncio
import httpx

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")

GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
]
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_INSTRUCTION = """You are PRISM — the AI retention strategist for a leading Indian bank.
Your role: generate personalized, actionable retention strategies for at-risk customers.

Rules:
- Base ALL recommendations strictly on the provided policy context.
- Give specific, measurable offers (exact %, Rs amounts, timelines).
- Tailor tone and channel to the customer profile.
- Output ONLY valid JSON — no prose, no markdown fences, no preamble.
- Never invent offers not in the policy documents.
- Never recommend contacting opted-out customers.
"""


def _strip_fences(text: str) -> str:
    if "```" in text:
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    return text.strip()


# ── Gemini call ────────────────────────────────────────────
async def _call_gemini(prompt: str, max_tokens: int = 1500) -> str:
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.3, "topP": 0.9},
    }
    key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    for model in GEMINI_MODELS:
        url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
               f"{model}:generateContent?key={key}")
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    r = await client.post(url, headers={"Content-Type": "application/json"}, json=payload)
                    if r.status_code == 429:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    if r.status_code == 404:
                        break   # try next model
                    r.raise_for_status()
                    return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            except httpx.TimeoutException:
                await asyncio.sleep(1)
            except Exception as e:
                logger.warning(f"Gemini {model} error: {e}")
                break
    raise RuntimeError("Gemini unavailable")


# ── Groq call (OpenAI-compatible) ──────────────────────────
async def _call_groq(prompt: str, max_tokens: int = 1500) -> str:
    key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if not key:
        raise RuntimeError("GROQ_API_KEY not set")
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user",   "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=payload,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


# ── Unified call: Gemini first, Groq fallback ──────────────
async def _call_llm(prompt: str, max_tokens: int = 1500) -> str:
    try:
        result = await _call_gemini(prompt, max_tokens)
        logger.info("LLM: Gemini responded")
        return result
    except Exception as e:
        logger.warning(f"Gemini failed ({e}), falling back to Groq...")
    try:
        result = await _call_groq(prompt, max_tokens)
        logger.info("LLM: Groq fallback responded")
        return result
    except Exception as e:
        logger.error(f"Groq also failed: {e}")
        raise RuntimeError("Both Gemini and Groq unavailable")


# ── Public functions ───────────────────────────────────────

async def generate_retention_strategy(
    customer_profile: dict,
    churn_prediction: dict,
    rag_context: str,
) -> dict:
    prompt = f"""
CUSTOMER PROFILE:
{json.dumps(customer_profile, indent=2)}

CHURN PREDICTION:
- Probability: {churn_prediction['churn_probability']:.1%}
- Risk Tier: {churn_prediction['risk_tier'].upper()}
- Top Risk Factors: {json.dumps(churn_prediction['top_risk_factors'])}

RELEVANT POLICY CONTEXT:
{rag_context}

Generate a retention strategy as JSON with EXACTLY this structure:
{{
  "strategy_type": "<offer|outreach|product_recommendation|fee_waiver>",
  "channel": "<email|sms|phone|in_app|branch>",
  "priority": <1|2|3>,
  "title": "<concise strategy title>",
  "description": "<2-3 sentences>",
  "personalized_message": "<actual message to send, fully personalized with customer name>",
  "offer_details": {{
    "offer_type": "<category>",
    "offer_value": "<Rs amount or % rate>",
    "validity_days": <number>,
    "conditions": "<eligibility>"
  }},
  "estimated_retention_probability": <0.0-1.0>,
  "estimated_revenue_saved": <annual INR integer>,
  "cost_to_execute": <INR integer>,
  "roi_score": <float>,
  "rationale": "<why this strategy for this customer>"
}}
"""
    try:
        raw = await _call_llm(prompt, max_tokens=1500)
        return json.loads(_strip_fences(raw))
    except Exception as e:
        logger.error(f"Strategy generation failed: {e}")
        return _fallback_strategy(customer_profile, churn_prediction)


async def explain_churn_factors(customer_profile: dict, top_factors: list[dict]) -> str:
    prompt = f"""
Explain in 3-4 clear sentences why this bank customer is at churn risk.
Write as a relationship manager briefing. Be specific about the most concerning signals.

Customer: {json.dumps(customer_profile)}
Top risk factors: {json.dumps(top_factors)}

Return ONLY the explanation paragraph, nothing else.
"""
    try:
        return _strip_fences(await _call_llm(prompt, max_tokens=300))
    except Exception as e:
        logger.warning(f"Explanation fell back to rule-based: {e}")
        return _rule_based_explanation(customer_profile, top_factors)


async def chat_with_customer_context(
    question: str,
    customer_profile: dict,
    prediction: dict,
    rag_context: str,
) -> str:
    prompt = f"""
You are a helpful AI assistant for a bank relationship manager.
Answer concisely (2-4 sentences) using the data and policy context provided.

CUSTOMER: {json.dumps(customer_profile)}
PREDICTION: {json.dumps(prediction)}
POLICY CONTEXT: {rag_context[:2000]}

QUESTION: {question}

Answer:"""
    try:
        return await _call_llm(prompt, max_tokens=400)
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return "AI assistant is temporarily unavailable. Please try again in a moment."


def _rule_based_explanation(profile: dict, factors: list[dict]) -> str:
    factor_names = [f["factor"].replace("_", " ") for f in factors[:3]]
    name         = profile.get("name", "This customer")
    nps          = profile.get("nps_score", 7)
    complaints   = profile.get("complaints_last_year", 0)
    logins       = profile.get("digital_login_frequency", 5)
    days         = profile.get("days_since_last_contact", 30)
    parts = [f"{name} is showing elevated churn risk driven primarily by {', '.join(factor_names)}."]
    if complaints >= 2:
        parts.append(f"With {int(complaints)} complaint(s) in the past year, satisfaction appears significantly compromised.")
    if nps < 5:
        parts.append(f"An NPS score of {nps}/10 indicates low loyalty and a high likelihood of switching banks.")
    if logins < 3:
        parts.append(f"Very low digital engagement ({int(logins)} logins/month) suggests a declining relationship.")
    if days > 90:
        parts.append(f"No contact for {int(days)} days means concerns have gone unaddressed.")
    return " ".join(parts)


def _fallback_strategy(profile: dict, prediction: dict) -> dict:
    risk = prediction.get("risk_tier", "medium")
    name = profile.get("name", "Valued Customer")
    return {
        "strategy_type": "outreach",
        "channel": "phone" if risk in ("critical", "high") else "email",
        "priority": 1 if risk == "critical" else 2,
        "title": f"Proactive Retention Outreach — {risk.upper()} Risk",
        "description": "Senior RM to establish direct contact and present exclusive benefits tailored to customer profile.",
        "personalized_message": (f"Dear {name}, we value your relationship with PRISM Bank "
                                  "and have an exclusive offer prepared for you."),
        "offer_details": {"offer_type": "fee_waiver", "offer_value": "Rs 2,000",
                          "validity_days": 30, "conditions": "Existing customers only."},
        "estimated_retention_probability": 0.45,
        "estimated_revenue_saved": 50000,
        "cost_to_execute": 500,
        "roi_score": 99.0,
        "rationale": "Standard retention protocol applied as AI generation is temporarily unavailable.",
    }