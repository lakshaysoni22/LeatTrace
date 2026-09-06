"""Case and investigation Pydantic schemas."""

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from .wallet import WalletOut
from .common import EvidenceOut


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


class CaseOut(CaseBase):
    model_config = ConfigDict(from_attributes=True)

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
