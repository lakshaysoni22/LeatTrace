"""Investigation case database models."""

import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high, critical
    status = Column(String, default="open")  # open, active, suspended, closed
    investigator_id = Column(String, ForeignKey("users.id"))
    investigator_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    wallets = relationship("Wallet", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
