from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    segment = Column(String, default="retail")        # retail, premium, wealth, sme

    # Core banking features
    credit_score = Column(Integer, default=650)
    account_balance = Column(Float, default=0.0)
    num_products = Column(Integer, default=1)
    has_credit_card = Column(Boolean, default=False)
    is_active_member = Column(Boolean, default=True)
    estimated_salary = Column(Float, default=50000.0)
    tenure_months = Column(Integer, default=12)
    age = Column(Integer, default=35)
    geography = Column(String, default="Urban")
    gender = Column(String, default="Unknown")

    # Engagement signals
    num_transactions_last_90d = Column(Integer, default=0)
    avg_transaction_value = Column(Float, default=0.0)
    digital_login_frequency = Column(Integer, default=0)
    complaints_last_year = Column(Integer, default=0)
    nps_score = Column(Float, default=7.0)
    days_since_last_contact = Column(Integer, default=30)

    # Computed / ML fields
    churn_probability = Column(Float, default=0.0)
    risk_tier = Column(String, default="low")         # low, medium, high, critical
    ltv_score = Column(Float, default=0.0)
    engagement_score = Column(Float, default=50.0)

    # Meta
    extra_data = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_ml_features(self):
        return [
            self.credit_score,
            self.account_balance,
            self.num_products,
            int(self.has_credit_card),
            int(self.is_active_member),
            self.estimated_salary,
            self.tenure_months,
            self.age,
            self.num_transactions_last_90d,
            self.avg_transaction_value,
            self.digital_login_frequency,
            self.complaints_last_year,
            self.nps_score,
            self.days_since_last_contact,
        ]
