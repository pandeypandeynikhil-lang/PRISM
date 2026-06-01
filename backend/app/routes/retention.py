from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.customer import Customer
from app.models.strategy import RetentionStrategy
from app.services import ml_service, scoring_service
from app.services.rag_service import get_retention_context
from app.services.llm_service import generate_retention_strategy
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/strategies/{customer_id}")
async def get_strategies(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RetentionStrategy)
        .where(RetentionStrategy.customer_id == customer_id)
        .order_by(RetentionStrategy.created_at.desc())
    )
    strategies = result.scalars().all()
    return [
        {
            "id": s.id,
            "strategy_type": s.strategy_type,
            "channel": s.channel,
            "priority": s.priority,
            "title": s.title,
            "description": s.description,
            "personalized_message": s.personalized_message,
            "offer_details": s.offer_details,
            "estimated_retention_probability": s.estimated_retention_probability,
            "estimated_revenue_saved": s.estimated_revenue_saved,
            "cost_to_execute": s.cost_to_execute,
            "roi_score": s.roi_score,
            "status": s.status,
            "created_at": s.created_at,
        }
        for s in strategies
    ]


@router.post("/generate/{customer_id}")
async def generate_strategy(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.customer_id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    features = customer.to_ml_features()
    prediction = ml_service.predict_churn(features)

    # Update customer churn fields
    customer.churn_probability = prediction["churn_probability"]
    customer.risk_tier = prediction["risk_tier"]
    customer.ltv_score = scoring_service.compute_ltv(customer)
    customer.engagement_score = scoring_service.compute_engagement_score(customer)
    await db.commit()

    rag_context = get_retention_context(
        prediction["risk_tier"], customer.segment, prediction["top_risk_factors"]
    )
    customer_profile = {
        "name": customer.name, "segment": customer.segment,
        "tenure_months": customer.tenure_months, "age": customer.age,
        "account_balance": customer.account_balance, "num_products": customer.num_products,
        "nps_score": customer.nps_score, "complaints_last_year": customer.complaints_last_year,
    }
    strategy_data = await generate_retention_strategy(customer_profile, prediction, rag_context)

    strategy = RetentionStrategy(
        customer_id=customer_id,
        strategy_type=strategy_data.get("strategy_type", "outreach"),
        channel=strategy_data.get("channel", "email"),
        priority=strategy_data.get("priority", 2),
        title=strategy_data.get("title", "Retention Outreach"),
        description=strategy_data.get("description", ""),
        personalized_message=strategy_data.get("personalized_message", ""),
        offer_details=strategy_data.get("offer_details", {}),
        estimated_retention_probability=strategy_data.get("estimated_retention_probability", 0.5),
        estimated_revenue_saved=strategy_data.get("estimated_revenue_saved", 0),
        cost_to_execute=strategy_data.get("cost_to_execute", 0),
        roi_score=strategy_data.get("roi_score", 0),
        rag_sources=[c.get("source", "") for c in rag_context.split("---") if rag_context],
        llm_generated=True,
        status="pending",
    )
    db.add(strategy)
    await db.commit()
    await db.refresh(strategy)
    return {"strategy": strategy_data, "strategy_id": strategy.id, "prediction": prediction}


class StatusUpdate(BaseModel):
    status: str


@router.patch("/strategies/{strategy_id}/status")
async def update_strategy_status(
    strategy_id: int, update: StatusUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(RetentionStrategy).where(RetentionStrategy.id == strategy_id))
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    strategy.status = update.status
    await db.commit()
    return {"success": True, "status": update.status}
