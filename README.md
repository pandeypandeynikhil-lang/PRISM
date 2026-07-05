# PRISM v2 — Predictive Retention Intelligence & Strategic Management Platform

> **AI-powered, fairness-aware churn prediction and retention engine for banking**
> Built for IDEA 2.0 Hackathon · Organized by Somaiya Vidyavihar University · Sponsored by Union Bank of India & Department of Financial Services

---

## What is PRISM?

PRISM is an end-to-end intelligent customer retention platform for banks. It predicts which customers are likely to churn, prioritizes outreach using a fairness-aware mathematical model, and automatically generates personalized, policy-compliant retention strategies — all powered by AI.

The core innovation is the **Customer Priority Index (CPI)**:

```
CPI = α·CRS + β·OS + γ·IS
```

Where:
- **CRS** (Churn Risk Score) — probability of a customer leaving, predicted by the Random Forest model
- **OS** (Opportunity Score) — business value / profitability of retaining the customer
- **IS** (Inclusion Score) — fairness factor ensuring economically underserved customers are not marginalised
- **α, β, γ** — customizable weights (default: 0.5, 0.3, 0.2)

This means PRISM doesn't just chase the most profitable customers — it balances urgency, business value, and financial inclusion simultaneously.

---

## The Problem PRISM Solves

Banks lose billions annually to customer churn. Traditional approaches are reactive — the customer has already left before anyone notices. PRISM is proactive:

- **Predicts** churn risk before it materializes using behavioral and financial signals
- **Prioritizes** customers using CPI — not just raw churn probability
- **Segments** risk into 5 seismic zones with zone-specific action plans
- **Automates** personalized retention strategy generation via Gemini AI + Groq
- **Ensures fairness** — underserved customers get equitable attention, not just high-value ones

---

## How the AI Works — Full Technical Walkthrough

### Layer 1: Random Forest Churn Prediction (CRS)

**Algorithm:** Random Forest Classifier (scikit-learn, 400 estimators)

Trained on 16 behavioral, financial and RFM features:

| Feature Group | Features |
|---|---|
| Financial | credit_score, account_balance, estimated_salary, avg_transaction_value |
| Products | num_products, has_credit_card, is_active_member |
| RFM Signals | num_transactions_last_90d, days_since_last_transaction, total_annual_txn_value |
| Engagement | digital_login_frequency, tenure_months, days_since_last_contact |
| Satisfaction | complaints_last_year, nps_score |
| Demographics | age |

**Why Random Forest over Deep Learning:**
- Seamlessly integrates with SHAP for transparent, explainable decisions
- Outperforms neural networks on tabular banking data
- Lower computational cost, faster training
- `class_weight="balanced"` handles the ~30% churn rate imbalance natively

**Output:** Churn probability (0–1) → fed into the 5-zone seismic classification system

---

### Layer 2: Seismic Risk Zone Classification

Customers are mapped to one of 5 zones based on their CRS:

| Zone | CRS Range | Risk Level | Objective | Recommended Action |
|---|---|---|---|---|
| Zone 5 | 0.81 – 1.00 | Critical | Immediate Retention | RM Intervention + Personalized Offers |
| Zone 4 | 0.61 – 0.80 | High | Prevent Churn | Targeted Outreach + Service Improvement |
| Zone 3 | 0.41 – 0.60 | Moderate | Re-engagement | Campaigns + Product Suggestions |
| Zone 2 | 0.21 – 0.40 | Low | Strengthen Engagement | Loyalty Programs |
| Zone 1 | 0.00 – 0.20 | Very Low | Maintain Satisfaction | Passive Communication |

---

### Layer 3: CPI Score — Fairness-Aware Prioritization

```
CPI = α·CRS + β·OS + γ·IS
```

**Opportunity Score (OS):** Measures the business value of retaining the customer based on account balance, salary, number of products, tenure, and transaction value. Range: 0–100.

**Inclusion Score (IS):** Measures financial vulnerability — higher score means more underserved. Driven by low account balance, low salary, low credit score, and low digital engagement. Range: 0–100. High IS customers receive special treatment: zero minimum balance penalties, free basic services, financial literacy access.

**Why CPI matters:** A high-value customer with low churn risk might have a lower CPI than a low-income customer with high churn risk and high inclusion score — ensuring equitable, fair retention outreach.

---

### Layer 4: RAG — Retrieval-Augmented Generation

**Technology:** ChromaDB (persistent vector database) + Sentence Transformers (all-MiniLM-L6-v2)

RAG ensures all AI-generated retention strategies are grounded in real bank policies — not hallucinated advice.

**Knowledge base (3 documents):**
- `retention_policies.txt` — Zone-specific response mandates, SLA timelines, fee waiver limits, RBI compliance rules, DPDP Act 2023
- `outreach_templates.txt` — Pre-approved communication templates per segment (Zone 5 critical, SME, wealth, digital-first, underserved)
- `product_rules.txt` — Product eligibility rules, CPI-based automated offer selection rules, channel selection logic

**How it works:**
1. Query constructed: `"{risk_tier} risk {segment} customer churn retention {top_factors}"`
2. Query embedded into a vector via MiniLM sentence transformer
3. ChromaDB performs cosine similarity search across all document chunks
4. Top 5 most relevant policy chunks retrieved
5. Chunks passed as grounding context to the LLM

The AI **cannot** recommend an offer that isn't in the bank's policy documents.

---

### Layer 5: Generative AI — Gemini 2.0 Flash + Groq Fallback

**Primary:** Google Gemini 2.0 Flash (free tier)
**Fallback:** Groq llama-3.3-70b-versatile (free tier, auto-switches on 429 rate limit)

With customer profile + CPI scores + zone + RAG policy context assembled, the LLM generates a fully structured JSON retention strategy containing:
- Strategy type and recommended channel
- Priority level (1 = urgent)
- Personalized message drafted for that specific customer
- Exact offer details with ₹ amounts and validity
- Estimated retention probability uplift
- Estimated annual revenue saved and ROI score
- Rationale referencing the customer's CPI and zone

**RM Chatbot:** The same dual-LLM stack powers an interactive chat assistant on each customer's profile page. Relationship managers ask natural language questions and get instant policy-grounded answers.

---

### Layer 6: SHAP Explainability

When `shap` is installed, the system uses `TreeExplainer` to compute SHAP values for each prediction — showing exactly which features drove the churn risk for that specific customer. Falls back to RF feature importances if SHAP is unavailable. All explanations are then narrated in plain English by the LLM.

---

## PRISM Processing Pipeline

```
Data Ingestion → Churn Prediction → Zone Classification → CPI Score Computation → RAG Retrieval → Strategy Generation → RM Outreach
     ↓                  ↓                   ↓                      ↓                    ↓                  ↓
  16 features     Random Forest        5 Seismic Zones      α·CRS + β·OS + γ·IS    ChromaDB         Gemini / Groq
  RFM + signals   400 estimators       Z1 → Z5              Fairness-aware          Policy docs      Personalized JSON
```

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND (Vite)                    │
│  Dashboard │ Customers │ Analytics │ Predict │ RM Chat        │
│  Zone badges │ CPI Gauge │ 5-Zone donut │ SHAP factors        │
└─────────────────────────┬────────────────────────────────────┘
                          │ REST API (/api/*)
┌─────────────────────────▼────────────────────────────────────┐
│                     FASTAPI BACKEND                           │
│                                                               │
│  /api/predict    → Random Forest + SHAP + CPI                 │
│  /api/customers  → CRUD + seeding + CPI-sorted               │
│  /api/retention  → Strategy gen + status tracking            │
│  /api/analytics  → Zone/segment aggregations                 │
│  /api/rag        → ChromaDB search + RM chatbot              │
│                                                               │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ RF Model  │ │ ChromaDB │ │  Gemini  │ │  CPI Engine   │  │
│  │ + SHAP   │ │ + MiniLM │ │ + Groq   │ │  OS + IS + CRS│  │
│  └───────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │          PostgreSQL (async SQLAlchemy + asyncpg)       │   │
│  │   customers │ churn_predictions │ retention_strategies │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Recharts |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Database | PostgreSQL + SQLAlchemy (async) + asyncpg |
| ML Model | Random Forest (scikit-learn, 400 estimators) |
| Explainability | SHAP TreeExplainer |
| Vector DB | ChromaDB + Sentence Transformers (all-MiniLM-L6-v2) |
| Primary LLM | Google Gemini 2.0 Flash (free API) |
| Fallback LLM | Groq llama-3.3-70b-versatile (free API, auto-fallback) |
| HTTP Client | httpx (async) |

---

## Features

### Dashboard
- Portfolio KPIs: total customers, avg CPI, avg churn risk, revenue at risk, retention rate
- 5-Zone seismic distribution pills — click any zone to filter customers
- Top-priority customers sorted by CPI score (not just churn probability)
- Live system status: RF Model, ChromaDB, Gemini + Groq, PostgreSQL, SHAP

### Customer Intelligence
- CPI-sorted customer grid with zone badges, churn bars, OS/IS scores
- Filter by zone (Z1–Z5), segment, or free-text search
- Each card shows: CPI score, Opportunity Score, Inclusion Score, balance, LTV, engagement

### Customer Detail Page
- Full behavioral profile with color-coded risk signals
- Zone bar with seismic classification and recommended action
- CPI Gauge showing α·CRS + β·OS + γ·IS breakdown
- AI strategy generation (RF → RAG → Gemini/Groq pipeline)
- Strategy history with status tracking (pending → sent → accepted/rejected)
- Embedded RM chatbot powered by RAG + dual-LLM

### Analytics
- Seismic Zone breakdown table with objectives and adaptive strategy mapping
- Avg churn by segment bar chart
- Zone distribution donut chart
- Segment radar chart
- Full segment intelligence table with CPI, OS, IS per segment

### Manual Prediction
- All 16 features across 6 grouped sections (Financial, Products, RFM, Engagement, Satisfaction)
- Instant churn probability + zone classification + confidence score
- SHAP/RF top-5 risk factors with importance bars
- CPI gauge with OS and IS breakdown
- Zone action card with specific recommended next step
- Gemini/Groq plain-English explanation of why the customer is at risk

---

## Project Structure

```
prism-retention-system/
│
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI entry, lifespan, routers
│   │   ├── database.py                  # Async SQLAlchemy engine + session
│   │   │
│   │   ├── models/
│   │   │   ├── customer.py              # Customer table — 30+ fields incl. CPI/zone
│   │   │   ├── churn.py                 # ChurnPrediction history table
│   │   │   └── strategy.py              # RetentionStrategy table
│   │   │
│   │   ├── routes/
│   │   │   ├── predict.py               # POST /predict — RF + SHAP + CPI
│   │   │   ├── customers.py             # GET/POST /customers — CRUD + seeding
│   │   │   ├── retention.py             # GET/POST /retention — strategy gen
│   │   │   ├── analytics.py             # GET /analytics — zones + segments
│   │   │   └── rag.py                   # POST /rag/chat + /rag/search
│   │   │
│   │   ├── services/
│   │   │   ├── ml_service.py            # RF inference, SHAP/fallback, batch predict
│   │   │   ├── scoring_service.py       # CPI, LTV, OS, IS, engagement scoring
│   │   │   ├── rag_service.py           # ChromaDB client, ingestion, retrieval
│   │   │   └── llm_service.py           # Gemini + Groq fallback, strategy + chat
│   │   │
│   │   ├── ml/
│   │   │   └── train_model.py           # RF training, zone classifier, CPI functions
│   │   │
│   │   ├── rag/
│   │   │   ├── chroma_db/               # Persisted vector store (auto-populated)
│   │   │   └── documents/
│   │   │       ├── retention_policies.txt
│   │   │       ├── outreach_templates.txt
│   │   │       └── product_rules.txt
│   │   │
│   │   └── utils/
│   │       └── helpers.py               # INR formatting, zone helpers, CPI labels
│   │
│   ├── requirements.txt
│   ├── .env.example                     # Template — no real keys
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # React Router setup
│   │   ├── main.jsx                     # React DOM mount
│   │   ├── index.css                    # Full design system + CSS variables
│   │   │
│   │   ├── components/
│   │   │   ├── Layout.jsx               # Sidebar + CPI formula display
│   │   │   ├── ZoneBadge.jsx            # ZoneBadge, ZoneBar, CpiGauge components
│   │   │   ├── CustomerCard.jsx         # Risk card with CPI, OS, IS, zone
│   │   │   ├── RiskChart.jsx            # 5-zone donut chart
│   │   │   ├── StatCard.jsx             # KPI metric card
│   │   │   └── StrategyPanel.jsx        # Collapsible AI strategy cards
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Main overview + zone pills
│   │   │   ├── Customers.jsx            # Zone-filtered customer grid
│   │   │   ├── CustomerDetail.jsx       # Full profile + CPI gauge + RM chat
│   │   │   ├── Analytics.jsx            # Zone table + segment charts
│   │   │   └── Predict.jsx              # Manual prediction + zone result
│   │   │
│   │   └── services/
│   │       └── api.js                   # All axios API calls
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Setup & Running Locally

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ (running locally)
- Free Gemini API key → https://aistudio.google.com/app/apikey
- Free Groq API key → https://console.groq.com

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env — add your real API keys and DB URL
python -m app.ml.train_model
uvicorn app.main:app --reload --port 8000
```

### `.env` file

```env
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@127.0.0.1:5432/prism
APP_ENV=development
DEBUG=true
CPI_ALPHA=0.5
CPI_BETA=0.3
CPI_GAMMA=0.2
```

> If your password contains `@`, encode it as `%40` — e.g. `Pass@123` → `Pass%40123`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** → click **Seed Demo Data** on the Dashboard.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers/` | List customers, filtered + sorted by CPI |
| GET | `/api/customers/{id}` | Get single customer with all scores |
| POST | `/api/customers/seed` | Seed N demo customers across all 5 zones |
| POST | `/api/predict/` | Run RF prediction + CPI + SHAP on raw features |
| POST | `/api/predict/batch` | Batch predictions |
| GET | `/api/retention/strategies/{id}` | Get AI strategies for a customer |
| POST | `/api/retention/generate/{id}` | Run full ML → RAG → LLM pipeline |
| PATCH | `/api/retention/strategies/{id}/status` | Update strategy status |
| GET | `/api/analytics/summary` | Portfolio KPIs incl. CPI, OS, IS averages |
| GET | `/api/analytics/segments` | Churn + CPI by segment |
| GET | `/api/analytics/zones` | Zone distribution with avg CPI |
| GET | `/api/analytics/top-at-risk` | Top N customers by CPI score |
| POST | `/api/rag/chat` | RM chatbot — policy-grounded Q&A |
| POST | `/api/rag/search` | Search the ChromaDB knowledge base |

Swagger UI: **http://localhost:8000/docs**

---

## Key Design Decisions

**Why Random Forest over Gradient Boosting?** Random Forest integrates seamlessly with SHAP TreeExplainer for transparent, feature-level explainability — critical for a regulated banking product where decisions must be auditable.

**Why CPI instead of raw churn probability?** Raw churn probability alone creates a bias toward high-value customers. CPI balances urgency (CRS), profitability (OS), and fairness (IS) — banks can serve all customers equitably while managing business outcomes.

**Why 5 seismic zones?** Finer granularity than a 4-tier system allows more precise action mapping. Zone 3 (Moderate) gets re-engagement campaigns while Zone 4 (High) gets targeted outreach — two very different interventions that a single "medium" tier would blur.

**Why RAG instead of fine-tuning?** Bank policies change frequently. RAG lets you update the knowledge base by editing `.txt` files without retraining any model. It also grounds the AI strictly in approved offers — preventing hallucinated or non-compliant recommendations.

**Why Gemini + Groq dual-LLM?** Both are free-tier APIs. Gemini 2.0 Flash handles most calls; when rate-limited (429), Groq llama-3.3-70b takes over automatically via exponential backoff. The system never goes offline due to a single LLM's rate limit.

**Why async throughout?** FastAPI + SQLAlchemy async + asyncpg + httpx = all I/O is non-blocking. The server handles concurrent prediction requests without threads blocking each other — essential for a real-time banking dashboard.

---

## Compliance & Ethics

- All retention offers constrained to the RAG knowledge base — no arbitrary AI generation
- Inclusion Score ensures underserved customers receive fair prioritization
- No differential pricing based on religion, caste, or gender (RBI Fair Practices Code)
- Offers above ₹10,000 flagged for manager approval
- DNC list respect built into channel selection rules
- DPDP Act 2023 compliance framework embedded in policy documents
- SHAP explainability ensures every prediction can be audited and explained

---

## Security Notes

- Never commit `.env` — it is in `.gitignore`
- Only `.env.example` (with placeholders) should be committed
- API keys in `.env.example` must always be placeholder text like `your_key_here`
- Rotate any key that was accidentally committed immediately

---

*PRISM v2 — Predict. Retain. Grow. Fairly.*