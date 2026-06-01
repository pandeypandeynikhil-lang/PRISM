# PRISM — Proactive Retention Intelligence System for Markets

> **AI-powered churn prediction & retention strategy engine built for banking**

---

## What is PRISM?

PRISM is an end-to-end intelligent customer retention platform designed for banks and financial institutions. It combines **Machine Learning**, **Retrieval-Augmented Generation (RAG)**, and **Generative AI** to predict which customers are likely to leave — and then automatically generates personalized, policy-compliant retention strategies to win them back.

Built for hackathon demonstration but architected for real-world production use.

---

## The Problem PRISM Solves

Banks lose billions annually to customer churn. The traditional approach is reactive — the customer has already left before anyone notices. PRISM flips this by:

- **Predicting** churn risk weeks before it happens using behavioral signals
- **Prioritizing** which customers need immediate attention
- **Automating** the creation of personalized retention offers
- **Empowering** relationship managers with AI-assisted decision support

---

## How the AI Works — Full Technical Walkthrough

### Layer 1: Machine Learning Churn Prediction

**Algorithm:** Gradient Boosted Decision Trees (scikit-learn `GradientBoostingClassifier`)

The ML model is trained on 14 behavioral and financial features extracted from customer banking data:

| Feature | What it captures |
|---|---|
| `credit_score` | Financial health indicator |
| `account_balance` | Wealth and engagement level |
| `num_products` | Depth of banking relationship |
| `has_credit_card` | Product stickiness |
| `is_active_member` | Current engagement status |
| `estimated_salary` | Customer value segment |
| `tenure_months` | Loyalty duration |
| `age` | Life-stage behavioral patterns |
| `num_transactions_last_90d` | Recent activity level |
| `avg_transaction_value` | Transaction behavior |
| `digital_login_frequency` | Digital engagement |
| `complaints_last_year` | Dissatisfaction signals |
| `nps_score` | Net Promoter Score — loyalty sentiment |
| `days_since_last_contact` | Recency of relationship touchpoint |

**How it trains:**
1. On first startup, `train_model.py` generates 5,000 synthetic banking customers with realistic churn patterns
2. Features are scaled using `StandardScaler` to normalize ranges
3. The model is trained with 200 estimators, depth 4, learning rate 0.05
4. Outputs a **churn probability (0–1)** and a **risk tier**: Low / Medium / High / Critical
5. Model and scaler are saved as `.pkl` files and reused on subsequent startups

**Risk Tier Thresholds:**
-  **Low** — < 25% churn probability
-  **Medium** — 25–50%
-  **High** — 50–75%
-  **Critical** — ≥ 75% (immediate action required)

**Additional computed scores:**
- **LTV Score** — Lifetime Value estimate based on balance, products, salary, and predicted retention duration
- **Engagement Score** — 0–100 composite score from login frequency, transactions, NPS, and complaints

---

### Layer 2: RAG — Retrieval-Augmented Generation

**Technology:** ChromaDB (vector database) + Sentence Transformers (`all-MiniLM-L6-v2`)

RAG ensures that AI-generated retention strategies are **grounded in real bank policies** rather than hallucinated advice.

**The knowledge base contains 3 documents:**

1. **`retention_policies.txt`** — Defines exactly what actions are mandated at each risk tier, SLA timelines, fee waiver approval limits, and compliance rules (RBI Fair Practices Code, DPDP Act 2023)

2. **`outreach_templates.txt`** — Pre-approved communication templates for each customer segment (young digital-first customers, senior wealth customers, SME business owners, etc.)

3. **`product_rules.txt`** — Product eligibility rules, offer constraints, channel selection logic, and prohibited actions

**How RAG works in PRISM:**
1. When a retention strategy is requested for a customer, a query is constructed: `"{risk_tier} risk {segment} customer churn retention strategy {top_factors}"`
2. This query is embedded into a vector using the MiniLM sentence transformer
3. ChromaDB performs cosine similarity search across all document chunks
4. The top 5 most relevant policy chunks are retrieved
5. These chunks are passed as context to the LLM along with the customer profile

This means the AI **cannot** recommend an offer that isn't in the bank's policy documents.

---

### Layer 3: Generative AI — Gemini 1.5 Flash

**Model:** Google Gemini 1.5 Flash (free tier)

With the customer profile + churn prediction + RAG context assembled, Gemini generates a **fully structured JSON retention strategy** containing:

- Strategy type (offer, outreach, product recommendation, fee waiver)
- Best channel to use (email, SMS, phone, in-app, branch)
- Priority level (1 = urgent, 2 = high, 3 = medium)
- A personalized message drafted for that specific customer
- Specific offer details with ₹ amounts and validity periods
- Estimated retention probability uplift
- Estimated annual revenue saved
- ROI score

The system prompt strictly instructs the model to only recommend offers present in the retrieved policy context, never invent offers, and output only valid JSON.

**RM Chatbot:** The same Gemini integration powers an interactive chat assistant on each customer's profile page. Relationship managers can ask natural language questions like *"What's the best offer for this customer?"* or *"Why is their NPS score concerning?"* and get instant policy-grounded answers.

---

### Layer 4: Scoring Engine

Beyond raw churn probability, PRISM computes two additional scores:

**LTV (Lifetime Value):**
```
monthly_revenue = (balance × 0.2%) + (products × ₹150) + (credit_card ? ₹500 : 0) + (salary × 0.1%)
retention_probability = 1 - churn_probability
expected_months = retention_prob / (1 - retention_prob)   [capped at 120]
LTV = monthly_revenue × expected_months
```

**Engagement Score (0–100):**
Composite of digital logins, transaction frequency, NPS, complaints, days since contact, and active member status. Used to identify disengaged customers before churn signals fully materialize.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                       │
│  Dashboard │ Customers │ Analytics │ Predict │ Chat      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST API
┌──────────────────────▼──────────────────────────────────┐
│                   FASTAPI BACKEND                        │
│                                                          │
│  /api/customers    →  Customer CRUD + Seeding            │
│  /api/predict      →  ML Churn Prediction                │
│  /api/retention    →  Strategy Generation & Management   │
│  /api/analytics    →  Portfolio Aggregations             │
│  /api/rag          →  Knowledge Search + RM Chatbot      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ML Service│  │RAG Service│  │LLM Service│  │Scoring  │ │
│  │GB Model  │  │ChromaDB  │  │Gemini API │  │LTV/Eng  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         PostgreSQL Database (SQLAlchemy async)      │ │
│  │   customers │ churn_predictions │ retention_strat.. │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### Dashboard
- Portfolio-level KPIs: total customers, average churn risk, revenue at risk, retention rate
- Risk distribution donut chart (Critical / High / Medium / Low)
- Live top-10 most at-risk customers with one-click navigation
- System health status indicators
- One-click demo data seeding (generates 60 synthetic customers)

### Customer Intelligence
- Full customer grid with real-time risk badges and churn probability bars
- Filter by risk tier, segment, or free-text search
- Customer cards showing balance, LTV, engagement score, tenure

### Customer Detail Page
- Full behavioral profile with color-coded risk signals
- Churn probability bar with visual risk indicator
- AI strategy generation (calls ML → RAG → Gemini pipeline)
- Strategy history with status tracking (pending → sent → accepted/rejected)
- Embedded RM chatbot powered by RAG + Gemini

### Analytics
- Segment breakdown (Retail / Premium / Wealth / SME) by churn risk
- Bar chart of average churn by segment
- Radar chart of segment risk profile
- Portfolio retention rate and LTV totals

### Manual Prediction
- Form-based predictor for any customer profile
- Instant churn probability with confidence score
- Top 5 risk factors with importance bars
- Gemini-generated plain-English explanation of why the customer is at risk

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Recharts |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Database | PostgreSQL + SQLAlchemy (async) + asyncpg |
| ML Model | scikit-learn GradientBoostingClassifier |
| Vector DB | ChromaDB + Sentence Transformers (MiniLM) |
| Generative AI | Google Gemini 1.5 Flash (free API) |
| HTTP Client | httpx (async Gemini calls) |
| Styling | Pure CSS with CSS variables (no UI framework) |

---

## Project Structure

```
prism-retention-system/
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, middleware, router registration
│   │   ├── database.py          # Async SQLAlchemy engine, session factory, init_db
│   │   │
│   │   ├── models/              # SQLAlchemy ORM table definitions
│   │   │   ├── customer.py      # Customer table with all 20+ fields
│   │   │   ├── churn.py         # ChurnPrediction table (prediction history)
│   │   │   └── strategy.py      # RetentionStrategy table (AI-generated plans)
│   │   │
│   │   ├── routes/              # FastAPI route handlers
│   │   │   ├── predict.py       # POST /predict — runs ML model
│   │   │   ├── customers.py     # GET/POST /customers — CRUD + seeding
│   │   │   ├── retention.py     # GET/POST /retention — strategy gen & management
│   │   │   ├── analytics.py     # GET /analytics — aggregated portfolio stats
│   │   │   └── rag.py           # POST /rag/chat and /rag/search
│   │   │
│   │   ├── services/            # Business logic layer
│   │   │   ├── ml_service.py    # Loads model, runs predictions, extracts feature importances
│   │   │   ├── scoring_service.py # LTV, engagement score, segment classification
│   │   │   ├── rag_service.py   # ChromaDB client, document ingestion, retrieval
│   │   │   └── llm_service.py   # Gemini API calls — strategy gen, explanations, chat
│   │   │
│   │   ├── ml/
│   │   │   └── train_model.py   # Synthetic data generation, model training, pkl saving
│   │   │
│   │   ├── rag/
│   │   │   ├── chroma_db/       # Persisted ChromaDB vector store (auto-populated)
│   │   │   └── documents/       # Source knowledge base text files
│   │   │       ├── retention_policies.txt
│   │   │       ├── outreach_templates.txt
│   │   │       └── product_rules.txt
│   │   │
│   │   └── utils/
│   │       └── helpers.py       # INR formatting, risk colors, utility functions
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # React Router setup, route definitions
│   │   ├── main.jsx             # React DOM root mount
│   │   ├── index.css            # Full design system: CSS variables, components, animations
│   │   │
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Layout.jsx       # Sidebar navigation, collapsible, active state
│   │   │   ├── StatCard.jsx     # KPI metric card with skeleton loading
│   │   │   ├── CustomerCard.jsx # Risk card with churn bar, metrics grid
│   │   │   ├── RiskChart.jsx    # Recharts donut with center label and legend
│   │   │   └── StrategyPanel.jsx # Collapsible strategy cards with action buttons
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Main overview page
│   │   │   ├── Customers.jsx    # Filterable customer grid
│   │   │   ├── CustomerDetail.jsx # Full profile + RAG chat + strategy panel
│   │   │   ├── Analytics.jsx    # Charts and segment breakdown
│   │   │   └── Predict.jsx      # Manual prediction form with live results
│   │   │
│   │   └── services/
│   │       └── api.js           # All axios API calls in one place
│   │
│   ├── index.html
│   ├── vite.config.js           # Vite + proxy config (forwards /api to :8000)
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── COMMANDS.md                  # PowerShell setup guide
```

---

## Setup & Running Locally

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+ (running locally)
- Free Gemini API key → https://aistudio.google.com/app/apikey

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env — add Gemini key and PostgreSQL URL
uvicorn app.main:app --reload --port 8000
```

**.env file:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@127.0.0.1:5432/your_db_name
```

> ⚠️ If your password contains `@`, encode it as `%40` in the URL.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open: **http://localhost:3000**

### First Run

1. Click **"Seed Demo Data"** on the Dashboard — creates 60 synthetic customers
2. Browse the **Customers** page — filter by risk tier
3. Click any customer → click **"Generate AI Strategy"** to run the full ML + RAG + Gemini pipeline
4. Use the **chat box** on the customer page to ask the AI questions
5. Try **Predict** page to manually test any customer profile

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | List customers with filters |
| GET | `/api/customers/{id}` | Get single customer |
| POST | `/api/customers/seed` | Seed N demo customers |
| POST | `/api/predict` | Run churn prediction on raw features |
| POST | `/api/predict/batch` | Batch predictions |
| GET | `/api/retention/strategies/{id}` | Get strategies for a customer |
| POST | `/api/retention/generate/{id}` | Generate AI strategy for a customer |
| PATCH | `/api/retention/strategies/{id}/status` | Update strategy status |
| GET | `/api/analytics/summary` | Portfolio-level KPIs |
| GET | `/api/analytics/segments` | Churn by segment |
| GET | `/api/analytics/top-at-risk` | Top N riskiest customers |
| POST | `/api/rag/chat` | RM chatbot query |
| POST | `/api/rag/search` | Search knowledge base |

Interactive Swagger docs: **http://localhost:8000/docs**

---

## Key Design Decisions

**Why Gradient Boosting?** It handles tabular banking data extremely well, is interpretable via feature importances, and produces well-calibrated probability scores — important for risk tier classification.

**Why RAG instead of fine-tuning?** Bank policies change frequently. RAG lets you update the knowledge base (just edit the `.txt` files) without retraining any model. It also prevents hallucination of non-existent offers.

**Why Gemini Flash (free tier)?** Fast inference, generous free quota, strong JSON instruction-following, and zero API cost — ideal for a hackathon product that needs to demonstrate AI capabilities without billing concerns.

**Why async throughout?** FastAPI + SQLAlchemy async + asyncpg + httpx async = all I/O is non-blocking. The server can handle concurrent prediction requests without threads blocking each other.

---

## Compliance & Ethics

- All retention offers are constrained to the policy knowledge base — no arbitrary offer generation
- Customer data used for ML must be covered under onboarding consent (DPDP Act 2023)
- No differential pricing based on religion, caste, or gender (RBI Fair Practices Code)
- Offers above ₹10,000 in value flagged for manager approval
- DNC (Do Not Contact) list respect built into channel selection rules
- ML model trained on synthetic data for demo — production deployment requires real historical data with proper governance

---

## Roadmap / Future Enhancements

- [ ] Real-time streaming predictions via WebSocket
- [ ] A/B testing framework for retention offer effectiveness
- [ ] Automated email/SMS dispatch integration
- [ ] Model retraining pipeline with new outcome data (retained/churned feedback loop)
- [ ] Multi-bank white-label support
- [ ] Explainability dashboard with SHAP values
- [ ] Alert system for newly critical customers

---

*Built by Nikhil Pandey — PRISM: Predict. Retain. Grow.*