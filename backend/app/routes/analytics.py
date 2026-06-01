from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.customer import Customer
from app.models.strategy import RetentionStrategy

router = APIRouter()


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    total   = (await db.execute(select(func.count(Customer.id)))).scalar() or 0
    critical = (await db.execute(select(func.count(Customer.id)).where(Customer.risk_tier == "critical"))).scalar() or 0
    high     = (await db.execute(select(func.count(Customer.id)).where(Customer.risk_tier == "high"))).scalar() or 0
    medium   = (await db.execute(select(func.count(Customer.id)).where(Customer.risk_tier == "medium"))).scalar() or 0
    low      = (await db.execute(select(func.count(Customer.id)).where(Customer.risk_tier == "low"))).scalar() or 0

    avg_churn = (await db.execute(select(func.avg(Customer.churn_probability)))).scalar() or 0
    total_ltv = (await db.execute(select(func.sum(Customer.ltv_score)))).scalar() or 0
    avg_eng   = (await db.execute(select(func.avg(Customer.engagement_score)))).scalar() or 0

    strategies_pending = (await db.execute(
        select(func.count(RetentionStrategy.id)).where(RetentionStrategy.status == "pending")
    )).scalar() or 0
    revenue_at_risk = (await db.execute(
        select(func.sum(Customer.account_balance * Customer.churn_probability * 0.002 * 12))
    )).scalar() or 0

    return {
        "total_customers": total,
        "risk_distribution": {"critical": critical, "high": high, "medium": medium, "low": low},
        "avg_churn_probability": round(float(avg_churn), 4),
        "total_portfolio_ltv": round(float(total_ltv), 2),
        "avg_engagement_score": round(float(avg_eng), 1),
        "pending_strategies": strategies_pending,
        "revenue_at_risk": round(float(revenue_at_risk), 2),
        "retention_rate_estimate": round((1 - float(avg_churn)) * 100, 1),
    }


@router.get("/segments")
async def get_segments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer.segment, func.count(Customer.id), func.avg(Customer.churn_probability))
        .group_by(Customer.segment)
    )
    rows = result.all()
    return [{"segment": r[0], "count": r[1], "avg_churn": round(float(r[2] or 0), 3)} for r in rows]


@router.get("/top-at-risk")
async def top_at_risk(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).order_by(Customer.churn_probability.desc()).limit(limit)
    )
    customers = result.scalars().all()
    return [
        {
            "customer_id": c.customer_id, "name": c.name, "segment": c.segment,
            "churn_probability": c.churn_probability, "risk_tier": c.risk_tier,
            "ltv_score": c.ltv_score, "account_balance": c.account_balance,
        }
        for c in customers
    ]
