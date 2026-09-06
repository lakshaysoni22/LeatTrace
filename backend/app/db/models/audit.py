"""Audit log and governance database models with cryptographic chaining."""

import datetime
import uuid
import hashlib
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, event, text
from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    username = Column(String, nullable=False)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="success")  # success, warning, failure
    actor = Column(String, default="Human")  # Human, AI, System
    decision_source = Column(String, nullable=True)  # e.g., "HITL Override", "SOIS Loop", "User Login"
    execution_result = Column(Text, nullable=True)
    validation_status = Column(String, default="Verified")  # Verified, Pending, Bypassed
    hash = Column(String, nullable=True)
    prev_hash = Column(String, nullable=True)


class Decision(Base):
    __tablename__ = "decisions"

    decision_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    input = Column(Text, nullable=True)
    output = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class GovernanceLog(Base):
    __tablename__ = "governance_logs"

    log_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action = Column(Text, nullable=True)
    allowed = Column(Boolean, default=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SystemState(Base):
    __tablename__ = "system_state"

    state_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    module = Column(String, nullable=True)
    status = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


# --- Cryptographical Log Ledger Chaining ---

@event.listens_for(AuditLog, 'before_insert')
def chain_audit_log(mapper, connection, target):
    # Fetch last hash
    try:
        # Execute query using the connection
        row = connection.execute(
            text("SELECT hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1")
        ).fetchone()
        prev_hash = row[0] if row and row[0] else "0"
    except Exception as e:
        prev_hash = "0"

    if not target.id:
        target.id = f"log_{uuid.uuid4().hex[:7]}"

    if not target.timestamp:
        target.timestamp = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    timestamp_str = target.timestamp.isoformat()
    raw_str = f"{prev_hash}_{target.id}_{target.action}_{timestamp_str}_{target.status}"
    
    target.prev_hash = prev_hash
    target.hash = hashlib.sha256(raw_str.encode('utf-8')).hexdigest()
