from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from pydantic import BaseModel
from app.database import get_db
from app.models.customer import Customer
from app.services import ml_service, scoring_service
import random, string

router = APIRouter()


def _random_id():
    return "CUST" + "".join(random.choices(string.digits, k=6))


@router.get("/")
async def list_customers(
    skip: int = 0,
    limit: int = 50,
    risk_tier: str = None,
    segment: str = None,
    search: str = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Customer)
    if risk_tier:   q = q.where(Customer.risk_tier == risk_tier)
    if segment:     q = q.where(Customer.segment == segment)
    if search:
        q = q.where(or_(Customer.name.ilike(f"%{search}%"), Customer.customer_id.ilike(f"%{search}%")))
    q = q.order_by(Customer.churn_probability.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    customers = result.scalars().all()
    return [_to_dict(c) for c in customers]


@router.get("/{customer_id}")
async def get_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.customer_id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _to_dict(c)


@router.post("/seed")
async def seed_customers(count: int = Query(default=50, le=200), db: AsyncSession = Depends(get_db)):
    """Seed demo customers with varied risk profiles."""
    import random, numpy as np
    rng = np.random.default_rng()
    names = ["Aarav Sharma","Priya Patel","Rohit Verma","Ananya Singh","Kiran Mehta",
             "Deepa Nair","Arjun Reddy","Sunita Joshi","Vijay Kumar","Meena Iyer",
             "Rajesh Gupta","Lakshmi Rao","Suresh Pillai","Kavita Agarwal","Amit Bose",
             "Neha Chandra","Sanjay Mishra","Pooja Desai","Ravi Krishnan","Divya Menon"]
    segments = ["retail","retail","retail","premium","premium","wealth","sme","sme"]
    tiers = ["low","low","medium","high","critical"]

    created = 0
    for i in range(count):
        name = random.choice(names) + f" #{i+1}"
        cid  = _random_id()
        seg  = random.choice(segments)
        target_tier = random.choice(tiers)

        bal   = {"low":rng.uniform(100000,500000),"medium":rng.uniform(50000,200000),
                 "high":rng.uniform(10000,100000),"critical":rng.uniform(0,50000),
                 "wealth":rng.uniform(500000,5000000)}.get(seg if seg=="wealth" else target_tier, 50000)
        nps   = {"low":rng.uniform(7,10),"medium":rng.uniform(5,8),
                 "high":rng.uniform(3,6),"critical":rng.uniform(0,4)}.get(target_tier, 6)
        comp  = {"low":0,"medium":rng.integers(0,2),"high":rng.integers(1,3),
                 "critical":rng.integers(2,5)}.get(target_tier, 0)

        c = Customer(
            customer_id=cid, name=name, email=f"{cid.lower()}@example.com",
            segment=seg,
            credit_score=int(rng.integers(550,820)),
            account_balance=float(bal),
            num_products=int(rng.integers(1,5)),
            has_credit_card=bool(rng.integers(0,2)),
            is_active_member=target_tier in ("low","medium"),
            estimated_salary=float(rng.uniform(300000,2000000)),
            tenure_months=int(rng.integers(1,120)),
            age=int(rng.integers(22,65)),
            geography=random.choice(["Urban","Semi-Urban","Rural"]),
            gender=random.choice(["Male","Female","Other"]),
            num_transactions_last_90d=int(rng.integers(0,60)),
            avg_transaction_value=float(rng.uniform(500,50000)),
            digital_login_frequency=int(rng.integers(0,30)),
            complaints_last_year=int(comp),
            nps_score=float(nps),
            days_since_last_contact=int(rng.integers(0,180)),
        )
        features = c.to_ml_features()
        pred = ml_service.predict_churn(features)
        c.churn_probability = pred["churn_probability"]
        c.risk_tier = pred["risk_tier"]
        c.ltv_score = scoring_service.compute_ltv(c)
        c.engagement_score = scoring_service.compute_engagement_score(c)
        c.segment = scoring_service.classify_segment(c)
        db.add(c)
        created += 1

    await db.commit()
    return {"seeded": created, "message": f"Created {created} demo customers"}


def _to_dict(c: Customer) -> dict:
    return {
        "id": c.id, "customer_id": c.customer_id, "name": c.name,
        "email": c.email, "segment": c.segment,
        "credit_score": c.credit_score, "account_balance": c.account_balance,
        "num_products": c.num_products, "has_credit_card": c.has_credit_card,
        "is_active_member": c.is_active_member, "estimated_salary": c.estimated_salary,
        "tenure_months": c.tenure_months, "age": c.age,
        "geography": c.geography, "gender": c.gender,
        "num_transactions_last_90d": c.num_transactions_last_90d,
        "avg_transaction_value": c.avg_transaction_value,
        "digital_login_frequency": c.digital_login_frequency,
        "complaints_last_year": c.complaints_last_year,
        "nps_score": c.nps_score, "days_since_last_contact": c.days_since_last_contact,
        "churn_probability": c.churn_probability, "risk_tier": c.risk_tier,
        "ltv_score": c.ltv_score, "engagement_score": c.engagement_score,
        "created_at": c.created_at,
    }
