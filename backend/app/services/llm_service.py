"""
PRISM LLM Service — Google Gemini Integration (Free API)
Generates personalized retention strategies grounded in RAG context.
"""
import os
import json
import logging
import httpx

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = "gemini-1.5-flash"          # free-tier model
GEMINI_URL     = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)

SYSTEM_INSTRUCTION = """You are PRISM — the AI retention strategist for a leading Indian bank.
Your role: generate personalized, actionable retention strategies for at-risk customers.

Rules:
- Base ALL recommendations strictly on the provided policy context.
- Give specific, measurable offers (exact %, Rs amounts, timelines).
- Tailor tone and channel to the customer profile.
- Quantify expected retention uplift and revenue saved.
- Output ONLY valid JSON — no prose, no markdown fences, no preamble.
- Never invent offers not in the policy documents.
- Never recommend contacting opted-out customers.
- Never make discriminatory offers.
"""


async def _call_gemini(prompt: str, max_tokens: int = 1500) -> str:
    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={api_key}"
    )
    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.3,
            "topP": 0.9,
        },
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def _strip_fences(text: str) -> str:
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    return text.strip()


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
  "personalized_message": "<actual message to send, fully personalized>",
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
  "rationale": "<why this strategy>"
}}
"""
    try:
        raw = await _call_gemini(prompt, max_tokens=1500)
        return json.loads(_strip_fences(raw))
    except Exception as e:
        logger.error(f"Gemini strategy generation failed: {e}")
        return _fallback_strategy(customer_profile, churn_prediction)


async def explain_churn_factors(customer_profile: dict, top_factors: list[dict]) -> str:
    prompt = f"""
Explain in 3-4 clear sentences why this bank customer is at churn risk.
Write from a relationship manager's perspective. Be specific about concerning signals.

Customer: {json.dumps(customer_profile)}
Top risk factors: {json.dumps(top_factors)}

Return ONLY the explanation paragraph.
"""
    try:
        return _strip_fences(await _call_gemini(prompt, max_tokens=300))
    except Exception as e:
        logger.error(f"Explanation generation failed: {e}")
        return "Customer shows elevated churn risk based on low engagement and satisfaction signals."


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
        return await _call_gemini(prompt, max_tokens=400)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return "Unable to retrieve that information right now. Please check the customer profile directly."


def _fallback_strategy(profile: dict, prediction: dict) -> dict:
    risk = prediction.get("risk_tier", "medium")
    name = profile.get("name", "Valued Customer")
    return {
        "strategy_type": "outreach",
        "channel": "phone" if risk in ("critical", "high") else "email",
        "priority": 1 if risk == "critical" else 2,
        "title": f"Proactive Retention Outreach — {risk.upper()} Risk",
        "description": "Senior RM to establish direct contact and present exclusive benefits.",
        "personalized_message": f"Dear {name}, we value your relationship with PRISM Bank and have an exclusive offer for you.",
        "offer_details": {"offer_type": "fee_waiver", "offer_value": "Rs 2,000", "validity_days": 30, "conditions": "Existing customers only."},
        "estimated_retention_probability": 0.45,
        "estimated_revenue_saved": 50000,
        "cost_to_execute": 500,
        "roi_score": 99.0,
        "rationale": "Standard retention protocol applied as fallback.",
    }
