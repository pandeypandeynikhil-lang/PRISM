from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.database import get_db
from app.models.customer import Customer
from app.services import ml_service, scoring_service
import random, string

router = APIRouter()


def _random_id():
    return "CUST" + "".join(random.choices(string.digits, k=6))


@router.get("/")
async def list_customers(
    skip: int = 0, limit: int = 50,
    risk_tier: str = None, segment: str = None,
    zone: int = None, search: str = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Customer)
    if risk_tier: q = q.where(Customer.risk_tier == risk_tier)
    if segment:   q = q.where(Customer.segment == segment)
    if zone:      q = q.where(Customer.zone_number == zone)
    if search:
        q = q.where(or_(Customer.name.ilike(f"%{search}%"),
                        Customer.customer_id.ilike(f"%{search}%")))
    q = q.order_by(Customer.cpi_score.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return [_to_dict(c) for c in result.scalars().all()]


@router.get("/{customer_id}")
async def get_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.customer_id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _to_dict(c)


@router.post("/seed")
async def seed_customers(count: int = Query(default=60, le=200), db: AsyncSession = Depends(get_db)):
    import numpy as np
    rng = np.random.default_rng()
    names = [
        "Aarav Sharma","Priya Patel","Rohit Verma","Ananya Singh","Kiran Mehta",
        "Deepa Nair","Arjun Reddy","Sunita Joshi","Vijay Kumar","Meena Iyer",
        "Rajesh Gupta","Lakshmi Rao","Suresh Pillai","Kavita Agarwal","Amit Bose",
        "Neha Chandra","Sanjay Mishra","Pooja Desai","Ravi Krishnan","Divya Menon",
        "Harish Tiwari","Sneha Kulkarni","Manoj Yadav","Rekha Jain","Vikram Nair",
    ]
    segments = ["retail","retail","retail","premium","premium","wealth","sme","sme"]
    created  = 0

    for i in range(count):
        cid  = _random_id()
        name = random.choice(names) + f" #{i+1}"
        seg  = random.choice(segments)

        # Varied profiles across zones
        zone_target = random.choices([1,2,3,4,5], weights=[15,20,30,20,15])[0]
        base_churn  = {1:0.1, 2:0.3, 3:0.5, 4:0.7, 5:0.9}[zone_target]

        complaints  = {1:0, 2:0, 3:rng.integers(1,2), 4:rng.integers(2,4), 5:rng.integers(3,7)}[zone_target]
        nps         = {1:rng.uniform(8,10), 2:rng.uniform(6,9), 3:rng.uniform(4,7),
                       4:rng.uniform(2,5),  5:rng.uniform(0,3)}[zone_target]
        logins      = {1:rng.integers(15,30), 2:rng.integers(8,20), 3:rng.integers(3,12),
                       4:rng.integers(1,6),   5:rng.integers(0,3)}[zone_target]
        txns_90     = {1:rng.integers(30,60), 2:rng.integers(15,40), 3:rng.integers(5,25),
                       4:rng.integers(1,10),  5:rng.integers(0,5)}[zone_target]
        days_contact= {1:rng.integers(0,20),  2:rng.integers(10,45), 3:rng.integers(30,90),
                       4:rng.integers(60,150), 5:rng.integers(120,365)}[zone_target]
        active      = zone_target <= 2

        bal = {"wealth": rng.uniform(500000,5000000), "premium": rng.uniform(100000,500000),
               "sme": rng.uniform(80000,300000), "retail": rng.uniform(5000,150000)}[seg]
        sal = {"wealth": rng.uniform(1500000,5000000), "premium": rng.uniform(800000,2000000),
               "sme": rng.uniform(600000,1500000), "retail": rng.uniform(120000,700000)}[seg]

        c = Customer(
            customer_id=cid, name=name, email=f"{cid.lower()}@example.com",
            segment=seg, credit_score=int(rng.integers(450, 820)),
            account_balance=float(bal), estimated_salary=float(sal),
            avg_transaction_value=float(rng.uniform(500, 50000)),
            num_products=int(rng.integers(1, 5)),
            has_credit_card=bool(rng.integers(0, 2)),
            is_active_member=bool(active),
            num_transactions_last_90d=int(txns_90),
            days_since_last_transaction=int(rng.integers(0, 90)),
            total_annual_txn_value=float(rng.uniform(10000, 1000000)),
            digital_login_frequency=int(logins),
            tenure_months=int(rng.integers(1, 144)),
            days_since_last_contact=int(days_contact),
            complaints_last_year=int(complaints),
            nps_score=float(nps),
            age=int(rng.integers(22, 68)),
            geography=random.choice(["Urban","Semi-Urban","Rural"]),
            gender=random.choice(["Male","Female","Other"]),
        )

        features = c.to_ml_features()
        pred      = ml_service.predict_churn(features)
        scores    = scoring_service.compute_all_scores(c, pred["churn_probability"])

        c.churn_probability = pred["churn_probability"]
        c.churn_risk_score  = pred["churn_risk_score"]
        c.risk_tier         = pred["risk_tier"]
        c.zone_number       = pred["zone"]["zone_number"]
        c.zone_label        = pred["zone"]["risk_level"]
        c.opportunity_score = scores["opportunity_score"]
        c.inclusion_score   = scores["inclusion_score"]
        c.cpi_score         = scores["cpi_score"]
        c.ltv_score         = scores["ltv_score"]
        c.engagement_score  = scores["engagement_score"]
        c.segment           = scoring_service.classify_segment(c)
        db.add(c)
        created += 1

    await db.commit()
    return {"seeded": created}


def _to_dict(c: Customer) -> dict:
    return {
        "id": c.id, "customer_id": c.customer_id, "name": c.name,
        "email": c.email, "segment": c.segment,
        "credit_score": c.credit_score, "account_balance": c.account_balance,
        "estimated_salary": c.estimated_salary,
        "avg_transaction_value": c.avg_transaction_value,
        "num_products": c.num_products, "has_credit_card": c.has_credit_card,
        "is_active_member": c.is_active_member,
        "num_transactions_last_90d": c.num_transactions_last_90d,
        "days_since_last_transaction": c.days_since_last_transaction,
        "total_annual_txn_value": c.total_annual_txn_value,
        "digital_login_frequency": c.digital_login_frequency,
        "tenure_months": c.tenure_months,
        "days_since_last_contact": c.days_since_last_contact,
        "complaints_last_year": c.complaints_last_year,
        "nps_score": c.nps_score, "age": c.age,
        "geography": c.geography, "gender": c.gender,
        "churn_probability": c.churn_probability,
        "churn_risk_score": c.churn_risk_score,
        "risk_tier": c.risk_tier,
        "zone_number": c.zone_number,
        "zone_label": c.zone_label,
        "opportunity_score": c.opportunity_score,
        "inclusion_score": c.inclusion_score,
        "cpi_score": c.cpi_score,
        "ltv_score": c.ltv_score,
        "engagement_score": c.engagement_score,
        "created_at": c.created_at,
    }
