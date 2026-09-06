from fastapi import APIRouter, HTTPException, Query, Header, Depends, Body
from typing import List, Dict, Any, Optional
from ...core.oauth_server import oauth_server
from ...core.oidc_provider import oidc_provider
from ...core.refresh_service import refresh_service
from ...infra.device_manager import device_manager
from ...core.session_manager import session_manager
from ...core.access_control import rbac_engine, abac_engine
from ...core.security import create_access_token
from ...core.jwks_service import jwks_service
from ...db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter(tags=["IAM & Authentication Services"])


@router.get("/.well-known/openid-configuration")
def get_oidc_config():
    return oidc_provider.get_discovery_document()

@router.get("/jwks.json")
def get_jwks():
    return jwks_service.get_jwks()

@router.post("/oauth/token")
def issue_oauth_token(
    grant_type: str = Body(...),
    code: Optional[str] = Body(None),
    client_id: str = Body(...),
    client_secret: Optional[str] = Body(None),
    code_verifier: Optional[str] = Body(None),
    refresh_token: Optional[str] = Body(None)
):
    if grant_type == "authorization_code":
        if not code:
            raise HTTPException(status_code=400, detail="Missing authorization code")
        # Validate auth code and PKCE verifier
        is_valid = oauth_server.validate_auth_code(code, client_id, code_verifier)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid authorization code or PKCE verification failed")
            
        # Issue initial tokens
        family_id, new_refresh = refresh_service.create_family()
        access_token = create_access_token(data={"sub": client_id, "grant": "authorization_code"})
        id_token = oidc_provider.generate_id_token(client_id, "", "", "")
        return {
            "access_token": access_token,
            "id_token": id_token,
            "refresh_token": new_refresh,
            "expires_in": 3600,
            "token_type": "Bearer"
        }
        
    elif grant_type == "refresh_token":
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Missing refresh token")
        try:
            new_ref, new_acc = refresh_service.rotate_token(refresh_token)
            return {
                "access_token": new_acc,
                "refresh_token": new_ref,
                "expires_in": 3600,
                "token_type": "Bearer"
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
            
    elif grant_type == "client_credentials":
        access_token = create_access_token(data={"sub": client_id, "grant": "client_credentials"})
        return {
            "access_token": access_token,
            "expires_in": 3600,
            "token_type": "Bearer"
        }
        
    raise HTTPException(status_code=400, detail="Unsupported grant type")

@router.get("/userinfo")
def get_userinfo(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    # In production, decode the token to get user info
    # For now return structured response indicating token required
    return {"status": "requires_valid_token", "message": "Decode bearer token to retrieve user info"}

@router.get("/auth/device")
def get_device_history(user_agent: Optional[str] = Header(None)):
    ua = user_agent or "Unknown"
    device_details = device_manager.parse_user_agent(ua)
    risk_score = device_manager.evaluate_device_risk(None, ua, False)
    
    return {
        "device_details": device_details,
        "risk_score": risk_score,
    }

@router.post("/auth/session/revoke")
def revoke_session(session_id: str = Body(..., embed=True)):
    success = session_manager.terminate_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "revoked", "session_id": session_id}

@router.post("/auth/policies/evaluate")
def evaluate_abac_policy(
    user_clearance: int = Body(...),
    resource_clearance: int = Body(...),
    department: str = Body(...),
    restriction: Optional[str] = Body(None)
):
    user_attrs = {"clearance_level": user_clearance, "department": department, "role": "investigator"}
    res_attrs = {"clearance_required": resource_clearance, "department_restriction": restriction}
    env_attrs = {"current_hour": 14}
    
    allowed = abac_engine.evaluate_policy(user_attrs, res_attrs, env_attrs)
    return {"allowed": allowed}
