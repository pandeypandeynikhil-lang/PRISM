"""
PRISM Scoring Service v2
- CPI = α·CRS + β·OS + γ·IS
- LTV computation
- RFM scoring
- Segment classification
"""
from app.ml.train_model import (
    compute_opportunity_score, compute_inclusion_score, compute_cpi, classify_zone
)
import pandas as pd


def compute_all_scores(customer, churn_prob: float) -> dict:
    """Compute all scores for a customer given predicted churn probability."""
    row = pd.Series({
        "account_balance":       customer.account_balance,
        "estimated_salary":      customer.estimated_salary,
        "num_products":          customer.num_products,
        "has_credit_card":       int(customer.has_credit_card),
        "tenure_months":         customer.tenure_months,
        "credit_score":          customer.credit_score,
        "digital_login_frequency": customer.digital_login_frequency,
        "avg_transaction_value": customer.avg_transaction_value,
    })
    os_score  = compute_opportunity_score(row)
    is_score  = compute_inclusion_score(row)
    cpi_score = compute_cpi(churn_prob, os_score, is_score)
    ltv       = compute_ltv(customer, churn_prob)
    eng       = compute_engagement_score(customer)
    zone      = classify_zone(churn_prob)
    return {
        "opportunity_score": os_score,
        "inclusion_score":   is_score,
        "cpi_score":         cpi_score,
        "ltv_score":         ltv,
        "engagement_score":  eng,
        "zone":              zone,
    }


def compute_ltv(customer, churn_prob: float) -> float:
    monthly_rev = (
        customer.account_balance * 0.002
        + customer.num_products * 180
        + (600 if customer.has_credit_card else 0)
        + customer.estimated_salary * 0.001
    )
    retention   = max(0.05, 1 - churn_prob)
    exp_months  = min(retention / (1 - retention + 1e-9), 120)
    return round(monthly_rev * exp_months, 2)


def compute_engagement_score(customer) -> float:
    score = 50.0
    score += min(20, customer.digital_login_frequency * 0.8)
    score += min(15, customer.num_transactions_last_90d * 0.3)
    score += (customer.nps_score - 5) * 3
    score -= customer.complaints_last_year * 8
    score -= min(20, customer.days_since_last_contact * 0.06)
    score += (customer.num_products - 1) * 5
    if customer.is_active_member: score += 10
    return round(max(0.0, min(100.0, score)), 1)


def classify_segment(customer) -> str:
    if customer.account_balance > 500000 or customer.estimated_salary > 2000000:
        return "wealth"
    if customer.account_balance > 100000 or customer.num_products >= 4:
        return "premium"
    if customer.estimated_salary > 800000 and customer.num_products >= 2:
        return "sme"
    return "retail"


def estimate_revenue_at_risk(customer) -> float:
    monthly = (
        customer.account_balance * 0.002
        + customer.num_products * 180
        + (600 if customer.has_credit_card else 0)
    )
    return round(monthly * 12 * customer.churn_probability, 2)
