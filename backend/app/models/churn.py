from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from app.database import Base


class ChurnPrediction(Base):
    __tablename__ = "churn_predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), index=True)
    churn_probability = Column(Float, nullable=False)
    risk_tier = Column(String, nullable=False)
    confidence_score = Column(Float, default=0.0)

    # Feature importances snapshot
    top_risk_factors = Column(JSON, default=[])
    feature_values = Column(JSON, default={})

    # Outcome tracking
    action_taken = Column(String, default="none")
    outcome = Column(String, default="pending")       # retained, churned, pending
    retention_value = Column(Float, default=0.0)

    prediction_date = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
