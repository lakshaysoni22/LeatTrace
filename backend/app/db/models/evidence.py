"""Evidence and chain-of-custody database models."""

import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)  # SHA-256 integrity signature
    file_size = Column(Integer, nullable=False)
    uploaded_by = Column(String, nullable=False)
    upload_time = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(Text, nullable=True)
    storage_path = Column(String, nullable=False)

    # Relationships
    case = relationship("Case", back_populates="evidence")


class ChainOfCustody(Base):
    __tablename__ = "chain_of_custody"

    id = Column(String, primary_key=True, index=True)
    evidence_id = Column(String, ForeignKey("evidence.id"), nullable=False)
    action = Column(String, nullable=False)  # UPLOADED, TRANSFERRED, SEALED, EXPORTED
    performed_by = Column(String, nullable=False)
    recipient = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)
    prev_hash = Column(String, nullable=True)
    hash_signature = Column(String, nullable=True)


class EvidenceSignature(Base):
    __tablename__ = "evidence_signatures"

    id = Column(String, primary_key=True, index=True)
    evidence_id = Column(String, ForeignKey("evidence.id"), nullable=False)
    signer_name = Column(String, nullable=False)
    signature = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    public_key_pem = Column(Text, nullable=False)
