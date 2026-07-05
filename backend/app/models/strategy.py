from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class RetentionStrategy(Base):
    __tablename__ = "retention_strategies"

    id             = Column(Integer, primary_key=True, index=True)
    customer_id    = Column(String, ForeignKey("customers.customer_id"), index=True)
    strategy_type  = Column(String)
    channel        = Column(String)
    priority       = Column(Integer, default=2)
    title          = Column(String)
    description    = Column(Text)
    personalized_message = Column(Text)
    offer_details        = Column(JSON, default={})
    estimated_retention_probability = Column(Float, default=0.0)
    estimated_revenue_saved         = Column(Float, default=0.0)
    cost_to_execute = Column(Float, default=0.0)
    roi_score       = Column(Float, default=0.0)
    rag_sources     = Column(JSON, default=[])
    llm_generated   = Column(Boolean, default=True)
    status          = Column(String, default="pending")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    executed_at     = Column(DateTime(timezone=True), nullable=True)
