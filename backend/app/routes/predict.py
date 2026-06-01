from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.services import ml_service, scoring_service
from app.services.llm_service import explain_churn_factors
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class PredictRequest(BaseModel):
    customer_id: str
    credit_score: int = 650
    account_balance: float = 0.0
    num_products: int = 1
    has_credit_card: bool = False
    is_active_member: bool = True
    estimated_salary: float = 50000.0
    tenure_months: int = 12
    age: int = 35
    num_transactions_last_90d: int = 0
    avg_transaction_value: float = 0.0
    digital_login_frequency: int = 0
    complaints_last_year: int = 0
    nps_score: float = 7.0
    days_since_last_contact: int = 30


@router.post("/")
async def predict_churn(req: PredictRequest, db: AsyncSession = Depends(get_db)):
    features = [
        req.credit_score, req.account_balance, req.num_products,
        int(req.has_credit_card), int(req.is_active_member),
        req.estimated_salary, req.tenure_months, req.age,
        req.num_transactions_last_90d, req.avg_transaction_value,
        req.digital_login_frequency, req.complaints_last_year,
        req.nps_score, req.days_since_last_contact,
    ]
    try:
        prediction = ml_service.predict_churn(features)
        explanation = await explain_churn_factors(req.model_dump(), prediction["top_risk_factors"])
        return {
            "customer_id": req.customer_id,
            **prediction,
            "explanation": explanation,
        }
    except Exception as e:
        logger.error(f"Prediction error for {req.customer_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def batch_predict(requests: list[PredictRequest]):
    feature_matrix = [
        [r.credit_score, r.account_balance, r.num_products,
         int(r.has_credit_card), int(r.is_active_member),
         r.estimated_salary, r.tenure_months, r.age,
         r.num_transactions_last_90d, r.avg_transaction_value,
         r.digital_login_frequency, r.complaints_last_year,
         r.nps_score, r.days_since_last_contact]
        for r in requests
    ]
    predictions = ml_service.batch_predict(feature_matrix)
    return [
        {"customer_id": r.customer_id, **p}
        for r, p in zip(requests, predictions)
    ]
