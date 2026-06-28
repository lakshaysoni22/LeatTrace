from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: str
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserOut(UserBase):
    id: str
    is_active: bool
    mfa_enabled: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Case Schemas
class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "open"
    notes: Optional[str] = None

class CaseCreate(CaseBase):
    case_number: Optional[str] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    closed_at: Optional[datetime] = None

class WalletBase(BaseModel):
    address: str
    chain: str
    label: Optional[str] = None
    tags: Optional[str] = None
    risk_score: int = 0
    is_contract: bool = False

class WalletCreate(WalletBase):
    pass

class WalletOut(WalletBase):
    id: str
    case_id: str

    class Config:
        from_attributes = True

class EvidenceOut(BaseModel):
    id: str
    case_id: str
    filename: str
    file_hash: str
    file_size: int
    uploaded_by: str
    upload_time: datetime
    description: Optional[str] = None

    class Config:
        from_attributes = True

class CaseOut(CaseBase):
    id: str
    case_number: str
    investigator_id: str
    investigator_name: Optional[str] = None
    department: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    wallets: List[WalletOut] = []
    evidence: List[EvidenceOut] = []

    class Config:
        from_attributes = True

# Watchlist Schemas
class WatchlistBase(BaseModel):
    address: str
    chain: str
    alias: Optional[str] = None
    risk_score: int = 0
    status: str = "Monitored"

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistOut(WatchlistBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Alert Schemas
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
    id: str
    status: str
    created_at: datetime
    message: Optional[str] = None
    is_read: bool

    class Config:
        from_attributes = True

# AuditLog Schema
class AuditLogOut(BaseModel):
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

    class Config:
        from_attributes = True

# AI Chat Schemas
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
