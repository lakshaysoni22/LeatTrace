"""Common/shared Pydantic schemas used across multiple domains."""

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    filename: str
    file_hash: str
    file_size: int
    uploaded_by: str
    upload_time: datetime
    description: Optional[str] = None


class AlertBase(BaseModel):
    chain: str
    address: str
    alias: Optional[str] = None
    type: str
    threshold: float
    severity: str = "medium"


class AlertCreate(AlertBase):
    pass


class AlertOut(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    created_at: datetime
    message: Optional[str] = None
    is_read: bool


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    username: str
    action: str
    ip_address: Optional[str] = None
    timestamp: datetime
    status: str
    actor: str
    decision_source: Optional[str] = None
    execution_result: Optional[str] = None
    validation_status: str


class AIChatRequest(BaseModel):
    message: str
    context_case_id: Optional[str] = None
    context_address: Optional[str] = None


class AIChatResponse(BaseModel):
    response: str


class FAIISTriggerRequest(BaseModel):
    target_address: str
    risk_score: int
    anomaly_details: str


class ChainOfCustodyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_id: str
    action: str
    performed_by: str
    recipient: Optional[str] = None
    timestamp: datetime
    notes: Optional[str] = None
    prev_hash: Optional[str] = None
    hash_signature: Optional[str] = None


class EvidenceSignatureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_id: str
    signer_name: str
    signature: str
    timestamp: datetime
    public_key_pem: str


class LedgerVerificationOut(BaseModel):
    is_valid: bool
    total_entries: int
    tampered_indices: List[int]
    message: str
