from fastapi import APIRouter, HTTPException, Query, Body, Depends
from typing import List, Dict, Any
from ..core.totp_service import totp_service
from ..core.policy_engine import policy_engine
from ..core.session_manager import session_manager
from ..core.security import create_access_token
from ..database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth", tags=["Identity & Security Operations"])

# Runtime storage for enrolled MFA secrets (per-user)
ENROLLED_SECRETS = {}  # username -> base32_secret

@router.post("/mfa/enroll")
def enroll_mfa(username: str = Body(..., embed=True)):
    enrollment = totp_service.generate_totp_secret()
    ENROLLED_SECRETS[username] = enrollment["secret"]
    backup_codes = totp_service.generate_backup_codes()
    
    return {
        "status": "enrolling",
        "secret": enrollment["secret"],
        "registration_uri": enrollment["registration_uri"],
        "backup_recovery_codes": backup_codes
    }

@router.post("/mfa/verify")
def verify_mfa(
    username: str = Body(...),
    code: str = Body(...)
):
    if policy_engine.is_account_locked(username):
        raise HTTPException(status_code=403, detail="Account locked due to brute force protection. Try again in 10 minutes.")
        
    secret = ENROLLED_SECRETS.get(username)
    if not secret:
        raise HTTPException(status_code=404, detail="MFA enrollment not found for user")
        
    is_valid = totp_service.verify_totp_token(secret, code)
    if is_valid:
        policy_engine.reset_failed_logins(username)
        token = create_access_token(data={"sub": username, "mfa_verified": True})
        return {"status": "verified", "token_type": "bearer", "access_token": token}
    else:
        policy_engine.record_failed_login(username)
        raise HTTPException(status_code=401, detail="Invalid verification code")

@router.post("/refresh")
def rotate_refresh_token(refresh_token: str = Body(..., embed=True)):
    from ..core.refresh_service import refresh_service
    try:
        new_ref, new_acc = refresh_service.rotate_token(refresh_token)
        return {
            "access_token": new_acc,
            "refresh_token": new_ref,
            "expires_in": 3600,
            "token_type": "Bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/sessions")
def get_active_sessions(user_id: str = Query(..., description="User ID to list sessions for")):
    sessions = session_manager.list_user_sessions(user_id)
    return {"sessions": sessions, "count": len(sessions)}

@router.post("/sessions/revoke")
def revoke_active_session(session_id: str = Body(..., embed=True)):
    success = session_manager.terminate_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session token not found")
    return {"status": "revoked", "session_id": session_id}
