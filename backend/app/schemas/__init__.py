"""
LEATrace Schemas Package.

Re-exports all Pydantic schemas for backward compatibility.
Import from app.schemas instead of app.schemas (single file).
"""

# Auth schemas
from .auth import (
    UserBase, UserCreate, UserLogin, UserOut, Token,
    TokenRefreshRequest, TokenRefreshResponse,
    MFASetupOut, MFAVerifyRequest, LoginMFAStatus,
    UserSessionOut,
)

# Case schemas
from .case import CaseBase, CaseCreate, CaseUpdate, CaseOut

# Wallet schemas
from .wallet import (
    WalletBase, WalletCreate, WalletOut,
    WatchlistBase, WatchlistCreate, WatchlistOut,
)

# Common schemas
from .common import (
    EvidenceOut, AlertBase, AlertCreate, AlertOut,
    AuditLogOut, AIChatRequest, AIChatResponse,
    FAIISTriggerRequest,
    ChainOfCustodyOut, EvidenceSignatureOut, LedgerVerificationOut,
)

__all__ = [
    # Auth
    "UserBase", "UserCreate", "UserLogin", "UserOut", "Token",
    "TokenRefreshRequest", "TokenRefreshResponse",
    "MFASetupOut", "MFAVerifyRequest", "LoginMFAStatus",
    "UserSessionOut",
    # Cases
    "CaseBase", "CaseCreate", "CaseUpdate", "CaseOut",
    # Wallets
    "WalletBase", "WalletCreate", "WalletOut",
    "WatchlistBase", "WatchlistCreate", "WatchlistOut",
    # Common
    "EvidenceOut", "AlertBase", "AlertCreate", "AlertOut",
    "AuditLogOut", "AIChatRequest", "AIChatResponse",
    "FAIISTriggerRequest",
    "ChainOfCustodyOut", "EvidenceSignatureOut", "LedgerVerificationOut",
]
