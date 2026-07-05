from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.customer import Customer
from app.services.rag_service import retrieve, get_retention_context
from app.services.llm_service import chat_with_customer_context
from app.services import ml_service

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    customer_id: str


class SearchRequest(BaseModel):
    query: str
    n_results: int = 5


@router.post("/search")
async def search_knowledge(req: SearchRequest):
    results = retrieve(req.query, req.n_results)
    return {"query": req.query, "results": results}


@router.post("/chat")
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    result   = await db.execute(select(Customer).where(Customer.customer_id == req.customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        return {"answer": "Customer not found."}

    features    = customer.to_ml_features()
    prediction  = ml_service.predict_churn(features)
    rag_context = get_retention_context(
        prediction["risk_tier"], customer.segment, prediction["top_risk_factors"]
    )
    profile = {
        "name": customer.name, "segment": customer.segment,
        "tenure_months": customer.tenure_months, "nps_score": customer.nps_score,
        "account_balance": customer.account_balance, "num_products": customer.num_products,
        "complaints_last_year": customer.complaints_last_year,
        "churn_probability": customer.churn_probability,
        "cpi_score": customer.cpi_score,
        "zone": customer.zone_label,
    }
    answer = await chat_with_customer_context(req.question, profile, prediction, rag_context)
    return {"answer": answer, "rag_chunks_used": 5}
