"""
PRISM Scoring Service
Computes LTV, engagement scores, and segment classifications.
"""
import math


def compute_ltv(customer) -> float:
    """
    Simplified LTV = (avg_monthly_revenue × tenure_months × retention_probability)
    """
    monthly_rev = (
        customer.account_balance * 0.002
        + customer.num_products * 150
        + (500 if customer.has_credit_card else 0)
        + customer.estimated_salary * 0.001
    )
    retention_prob = max(0.1, 1 - customer.churn_probability)
    expected_months = retention_prob / (1 - retention_prob + 1e-9)
    expected_months = min(expected_months, 120)
    ltv = monthly_rev * expected_months
    return round(ltv, 2)


def compute_engagement_score(customer) -> float:
    """
    Engagement 0–100 based on activity signals.
    """
    score = 50.0
    score += min(20, customer.digital_login_frequency * 0.8)
    score += min(15, customer.num_transactions_last_90d * 0.3)
    score += (customer.nps_score - 5) * 3
    score -= customer.complaints_last_year * 8
    score -= min(20, customer.days_since_last_contact * 0.05)
    score += (customer.num_products - 1) * 5
    if customer.is_active_member: score += 10
    return round(max(0.0, min(100.0, score)), 1)


def classify_segment(customer) -> str:
    if customer.account_balance > 500000 or customer.estimated_salary > 200000:
        return "wealth"
    if customer.account_balance > 100000 or customer.num_products >= 4:
        return "premium"
    if customer.estimated_salary > 80000 and customer.num_products >= 2:
        return "sme"
    return "retail"


def get_risk_color(risk_tier: str) -> str:
    return {"low": "#22c55e", "medium": "#f59e0b", "high": "#ef4444", "critical": "#7c3aed"}.get(risk_tier, "#6b7280")


def estimate_revenue_at_risk(customer) -> float:
    monthly_rev = (
        customer.account_balance * 0.002
        + customer.num_products * 150
        + (500 if customer.has_credit_card else 0)
    )
    return round(monthly_rev * 12 * customer.churn_probability, 2)
