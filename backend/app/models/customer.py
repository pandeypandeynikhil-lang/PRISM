from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id            = Column(Integer, primary_key=True, index=True)
    customer_id   = Column(String, unique=True, index=True, nullable=False)
    name          = Column(String, nullable=False)
    email         = Column(String)
    phone         = Column(String)
    segment       = Column(String, default="retail")

    # Financial
    credit_score      = Column(Integer, default=650)
    account_balance   = Column(Float,   default=0.0)
    estimated_salary  = Column(Float,   default=500000.0)
    avg_transaction_value = Column(Float, default=0.0)

    # Products
    num_products    = Column(Integer, default=1)
    has_credit_card = Column(Boolean, default=False)
    is_active_member = Column(Boolean, default=True)

    # RFM signals
    num_transactions_last_90d    = Column(Integer, default=0)
    days_since_last_transaction  = Column(Integer, default=30)
    total_annual_txn_value       = Column(Float,   default=0.0)

    # Engagement
    digital_login_frequency   = Column(Integer, default=0)
    tenure_months             = Column(Integer, default=12)
    days_since_last_contact   = Column(Integer, default=30)

    # Satisfaction
    complaints_last_year = Column(Integer, default=0)
    nps_score            = Column(Float,   default=7.0)

    # Demographics
    age       = Column(Integer, default=35)
    geography = Column(String,  default="Urban")
    gender    = Column(String,  default="Unknown")

    # ML outputs
    churn_probability  = Column(Float, default=0.0)
    churn_risk_score   = Column(Float, default=0.0)
    risk_tier          = Column(String, default="low")
    zone_number        = Column(Integer, default=1)
    zone_label         = Column(String,  default="Very Low")

    # CPI components
    opportunity_score = Column(Float, default=0.0)
    inclusion_score   = Column(Float, default=50.0)
    cpi_score         = Column(Float, default=0.0)

    # Other scores
    ltv_score         = Column(Float, default=0.0)
    engagement_score  = Column(Float, default=50.0)

    extra_data  = Column(JSON, default={})
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    def to_ml_features(self) -> list:
        return [
            self.credit_score, self.account_balance, self.estimated_salary,
            self.avg_transaction_value, self.num_products,
            int(self.has_credit_card), int(self.is_active_member),
            self.num_transactions_last_90d, self.days_since_last_transaction,
            self.total_annual_txn_value, self.digital_login_frequency,
            self.tenure_months, self.days_since_last_contact,
            self.complaints_last_year, self.nps_score, self.age,
        ]
