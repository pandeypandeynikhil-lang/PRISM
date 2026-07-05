from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from app.database import Base


class ChurnPrediction(Base):
    __tablename__ = "churn_predictions"

    id                 = Column(Integer, primary_key=True, index=True)
    customer_id        = Column(String, ForeignKey("customers.customer_id"), index=True)
    churn_probability  = Column(Float, nullable=False)
    churn_risk_score   = Column(Float, default=0.0)
    risk_tier          = Column(String, nullable=False)
    zone_number        = Column(Integer, default=1)
    zone_label         = Column(String, default="Very Low")
    cpi_score          = Column(Float, default=0.0)
    opportunity_score  = Column(Float, default=0.0)
    inclusion_score    = Column(Float, default=50.0)
    confidence_score   = Column(Float, default=0.0)
    top_risk_factors   = Column(JSON, default=[])
    feature_values     = Column(JSON, default={})
    action_taken       = Column(String, default="none")
    outcome            = Column(String, default="pending")
    retention_value    = Column(Float, default=0.0)
    prediction_date    = Column(DateTime(timezone=True), server_default=func.now())
    notes              = Column(Text, nullable=True)
