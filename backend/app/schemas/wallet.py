"""Wallet and watchlist Pydantic schemas."""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


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
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str


class WatchlistBase(BaseModel):
    address: str
    chain: str
    alias: Optional[str] = None
    risk_score: int = 0
    status: str = "Monitored"


class WatchlistCreate(WatchlistBase):
    pass


class WatchlistOut(WatchlistBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
