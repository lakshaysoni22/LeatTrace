"""Authentication and user Pydantic schemas."""

from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


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
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool
    mfa_enabled: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user: UserOut


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MFASetupOut(BaseModel):
    secret: str
    qr_code_uri: str


class MFAVerifyRequest(BaseModel):
    code: str


class LoginMFAStatus(BaseModel):
    requires_mfa: bool
    temp_token: Optional[str] = None
    user: Optional[UserOut] = None


class UserSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    created_at: datetime
    expires_at: datetime
