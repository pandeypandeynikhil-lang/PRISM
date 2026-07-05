from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.customer import Customer
from app.models.strategy import RetentionStrategy

router = APIRouter()


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    total    = (await db.execute(select(func.count(Customer.id)))).scalar() or 0
    avg_cpi  = (await db.execute(select(func.avg(Customer.cpi_score)))).scalar() or 0
    avg_churn= (await db.execute(select(func.avg(Customer.churn_probability)))).scalar() or 0
    avg_os   = (await db.execute(select(func.avg(Customer.opportunity_score)))).scalar() or 0
    avg_is   = (await db.execute(select(func.avg(Customer.inclusion_score)))).scalar() or 0
    total_ltv= (await db.execute(select(func.sum(Customer.ltv_score)))).scalar() or 0
    avg_eng  = (await db.execute(select(func.avg(Customer.engagement_score)))).scalar() or 0

    # Zone distribution
    zone_dist = {}
    for z in range(1, 6):
        cnt = (await db.execute(
            select(func.count(Customer.id)).where(Customer.zone_number == z)
        )).scalar() or 0
        zone_dist[f"zone_{z}"] = cnt

    # Risk tier distribution (for backward compat)
    risk_dist = {}
    for tier in ["low", "medium", "moderate", "high", "critical"]:
        cnt = (await db.execute(
            select(func.count(Customer.id)).where(Customer.risk_tier == tier)
        )).scalar() or 0
        risk_dist[tier] = cnt

    pending = (await db.execute(
        select(func.count(RetentionStrategy.id)).where(RetentionStrategy.status == "pending")
    )).scalar() or 0

    rev_at_risk = (await db.execute(
        select(func.sum(Customer.account_balance * Customer.churn_probability * 0.002 * 12))
    )).scalar() or 0

    return {
        "total_customers":        total,
        "avg_cpi_score":          round(float(avg_cpi), 4),
        "avg_churn_probability":  round(float(avg_churn), 4),
        "avg_opportunity_score":  round(float(avg_os), 1),
        "avg_inclusion_score":    round(float(avg_is), 1),
        "total_portfolio_ltv":    round(float(total_ltv), 2),
        "avg_engagement_score":   round(float(avg_eng), 1),
        "zone_distribution":      zone_dist,
        "risk_distribution":      risk_dist,
        "pending_strategies":     pending,
        "revenue_at_risk":        round(float(rev_at_risk), 2),
        "retention_rate_estimate": round((1 - float(avg_churn)) * 100, 1),
    }


@router.get("/segments")
async def get_segments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer.segment,
               func.count(Customer.id),
               func.avg(Customer.churn_probability),
               func.avg(Customer.cpi_score),
               func.avg(Customer.opportunity_score),
               func.avg(Customer.inclusion_score))
        .group_by(Customer.segment)
    )
    return [
        {"segment": r[0], "count": r[1],
         "avg_churn": round(float(r[2] or 0), 3),
         "avg_cpi":   round(float(r[3] or 0), 4),
         "avg_os":    round(float(r[4] or 0), 1),
         "avg_is":    round(float(r[5] or 0), 1)}
        for r in result.all()
    ]


@router.get("/zones")
async def get_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer.zone_number, Customer.zone_label,
               func.count(Customer.id),
               func.avg(Customer.cpi_score),
               func.avg(Customer.churn_probability))
        .group_by(Customer.zone_number, Customer.zone_label)
        .order_by(Customer.zone_number)
    )
    return [
        {"zone": r[0], "label": r[1], "count": r[2],
         "avg_cpi": round(float(r[3] or 0), 4),
         "avg_churn": round(float(r[4] or 0), 3)}
        for r in result.all()
    ]


@router.get("/top-at-risk")
async def top_at_risk(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Customer).order_by(Customer.cpi_score.desc()).limit(limit)
    )
    return [
        {"customer_id": c.customer_id, "name": c.name, "segment": c.segment,
         "churn_probability": c.churn_probability, "risk_tier": c.risk_tier,
         "zone_number": c.zone_number, "zone_label": c.zone_label,
         "cpi_score": c.cpi_score, "opportunity_score": c.opportunity_score,
         "inclusion_score": c.inclusion_score, "ltv_score": c.ltv_score,
         "account_balance": c.account_balance}
        for c in result.scalars().all()
    ]
