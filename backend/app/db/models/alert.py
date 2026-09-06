"""Alert and notification database models."""

import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from app.db.session import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    chain = Column(String, nullable=False)
    address = Column(String, nullable=False)
    alias = Column(String, nullable=True)
    type = Column(String, nullable=False)  # balance, incoming, outgoing
    threshold = Column(Float, nullable=False)
    status = Column(String, default="Active")  # Active, Triggered, Suspended
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    message = Column(Text, nullable=True)
    severity = Column(String, default="medium")  # low, medium, high, critical
    is_read = Column(Boolean, default=False)
