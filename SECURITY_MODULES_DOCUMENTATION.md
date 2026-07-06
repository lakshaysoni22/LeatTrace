# LEAtTrace Security Modules Documentation

## Overview

This document provides comprehensive documentation for the enterprise-grade security modules added to LEAtTrace during Phase 1 implementation.

---

## 1. Multi-Factor Authentication Engine (`mfa_engine.py`)

### Purpose
Provides comprehensive multi-factor authentication with support for TOTP, WebAuthn/FIDO2, Backup Codes, and Device Fingerprinting.

### Key Features

#### 1.1 TOTP (Time-based One-Time Password)
```python
from app.mfa_engine import TOTPConfig, generate_totp_secret, verify_totp_code

# Generate TOTP secret
secret = generate_totp_secret()

# Get provisioning URI for QR code
uri = get_totp_provisioning_uri(secret, user_email, issuer="LEAtTrace")

# Generate QR code as base64
qr_code = generate_totp_qr_code(uri)

# Verify TOTP code
is_valid = verify_totp_code(secret, user_input_code)
```

#### 1.2 WebAuthn/FIDO2 Support
```python
from app.mfa_engine import create_webauthn_registration_challenge, WebAuthnCredential

# Create registration challenge for security key
challenge = create_webauthn_registration_challenge(
    user_id="user123",
    email="user@cybercrime.gov.in",
    display_name="Officer Name"
)

# Challenge data is sent to client for security key verification
```

#### 1.3 Backup Codes
```python
from app.mfa_engine import generate_backup_codes, hash_backup_code

# Generate backup codes
codes = generate_backup_codes(count=10)

# Store hashed versions in database
hashed_codes = [hash_backup_code(code) for code in codes]
```

#### 1.4 Device Fingerprinting
```python
from app.mfa_engine import calculate_device_fingerprint, DeviceFingerprint

# Calculate device fingerprint
fingerprint = calculate_device_fingerprint(
    user_agent="Mozilla/5.0...",
    ip_address="192.168.1.1",
    accept_language="en-US",
    screen_resolution="1920x1080",
    timezone="UTC+5:30"
)

# Check if device is trusted
is_trusted = is_device_trusted(device_fingerprint, current_time)
```

#### 1.5 MFA Policy Engine
```python
from app.mfa_engine import MFAPolicyEngine, DEFAULT_MFA_POLICIES

# Check if MFA is required
require_mfa, reason = MFAPolicyEngine.should_require_mfa(
    user_role="admin",
    operation="user_management",
    policies=DEFAULT_MFA_POLICIES,
    user_mfa_enabled=True,
    device_trusted=False
)

if require_mfa:
    # Challenge user with MFA
```

### Default MFA Policies
- **Admins**: Enforced MFA for all operations
- **Supervisors**: Enforced MFA for case management
- **Investigators**: Optional but recommended MFA
- **Analysts**: No MFA required
- **Auditors**: Optional MFA

---

## 2. Advanced Session Management (`advanced_session_manager.py`)

### Purpose
Manage user sessions with refresh token rotation, device tracking, and session revocation.

### Key Classes

#### 2.1 SessionPolicy
Defines session management policies per role:

```python
from app.advanced_session_manager import SessionPolicy

admin_policy = SessionPolicy(
    id="policy_admin",
    name="Admin Session Policy",
    access_token_lifetime_minutes=30,      # Token valid for 30 minutes
    refresh_token_lifetime_days=7,         # Refresh token valid for 7 days
    enable_refresh_token_rotation=True,    # Rotate on each refresh
    rotate_on_each_use=True,               # Maximum security
    max_sessions_per_user=3,               # Limit concurrent sessions
    session_timeout_minutes=15,            # Idle timeout
    absolute_session_timeout_hours=4,      # Max session duration
    device_binding_required=True,          # Require device binding
    require_mfa_on_new_device=True
)
```

#### 2.2 Advanced Session Manager
```python
from app.advanced_session_manager import AdvancedSessionManager

manager = AdvancedSessionManager(redis_client=redis_conn, db_session=db)

# Validate session for operation
is_valid, reason = manager.validate_session_for_operation(
    user_role="admin",
    operation="user_management",
    session_age_seconds=300,
    is_device_trusted=False
)

# Check if refresh token should be rotated
should_rotate = manager.should_rotate_refresh_token(
    user_role="admin",
    rotation_count=5,
    is_new_device=True
)
```

#### 2.3 Token Rotation Manager
```python
from app.advanced_session_manager import TokenRotationManager

# Create rotation metadata
metadata = TokenRotationManager.create_rotation_metadata(
    user_id="user123",
    parent_token_id="tok_old123"
)

# Validate token for rotation
is_valid, reason = TokenRotationManager.validate_token_for_rotation(
    token_age_seconds=1800,
    rotation_count=5,
    max_rotations=100,
    max_age_hours=24
)

# Compute token binding (prevent token theft)
binding = TokenRotationManager.compute_token_binding(
    token_value="token_value_here",
    device_fingerprint="fp_device",
    ip_address="192.168.1.1"
)
```

#### 2.4 Session Anomaly Detection
```python
from app.advanced_session_manager import SessionAnomalyDetector

# Detect impossible travel
is_impossible = SessionAnomalyDetector.detect_impossible_travel(
    previous_location={"latitude": 28.7041, "longitude": 77.1025},  # Delhi
    current_location={"latitude": -33.8688, "longitude": 151.2093},  # Sydney
    time_diff_seconds=3600,  # 1 hour
    max_speed_kmh=900  # Plane speed
)  # Returns: True (impossible travel)

# Calculate session risk score
risk_score = SessionAnomalyDetector.calculate_session_risk_score(
    is_device_trusted=False,
    session_age_seconds=60,
    token_rotation_count=20,
    last_activity_seconds=0.5
)  # Returns: 0.45 (medium risk)
```

---

## 3. RBAC/ABAC Engine (`rbac_abac_engine.py`)

### Purpose
Implement enterprise-grade role-based and attribute-based access control.

### 3.1 Permission System
```python
from app.rbac_abac_engine import Permission, RBACEngine

# 45+ permissions across all operations
permissions = [
    Permission.USER_CREATE,
    Permission.CASE_READ,
    Permission.EVIDENCE_DOWNLOAD,
    Permission.SYSTEM_CONFIG
]
```

### 3.2 Role-Based Access Control (RBAC)
```python
from app.rbac_abac_engine import RBACEngine

rbac = RBACEngine()

# Check if user has permission
has_permission = rbac.has_permission(
    user_roles=["investigator"],
    required_permission=Permission.CASE_CREATE
)  # Returns: True

# Get all user permissions
all_permissions = rbac.get_user_permissions(["investigator", "analyst"])

# Add custom role
from app.rbac_abac_engine import Role

custom_role = Role(
    id="role_custom",
    name="Custom Investigator",
    permissions={Permission.CASE_READ, Permission.EVIDENCE_UPLOAD},
    created_at=datetime.datetime.utcnow(),
    updated_at=datetime.datetime.utcnow()
)
rbac.add_role(custom_role)
```

### 3.3 Attribute-Based Access Control (ABAC)
```python
from app.rbac_abac_engine import (
    ABACEngine, AccessPolicy, UserAttributes, ResourceAttributes,
    EnvironmentAttributes, CaseClassification, Department
)

abac = ABACEngine()

# Create complex access policy
policy = AccessPolicy(
    id="policy_confidential",
    name="Confidential Case Access",
    conditions={
        "resource_classification": CaseClassification.CONFIDENTIAL,
        "requires_mfa": True,
        "min_clearance": 3
    },
    effect="allow",
    applies_to_roles=["investigator", "supervisor"],
    applies_to_resources=["case"],
    priority=150,
    active=True,
    created_at=datetime.datetime.utcnow()
)

abac.add_policy(policy)

# Evaluate access decision
user_attrs = UserAttributes(
    user_id="user123",
    username="officer",
    email="officer@cybercrime.gov.in",
    department=Department.I4C,
    clearance_level=4,
    roles=["investigator"],
    is_device_trusted=True,
    is_mfa_verified=True
)

resource_attrs = ResourceAttributes(
    resource_id="case_456",
    resource_type="case",
    owner_id="user789",
    classification=CaseClassification.CONFIDENTIAL,
    sensitivity_score=8
)

env_attrs = EnvironmentAttributes(
    current_time=datetime.datetime.utcnow(),
    day_of_week=2,
    is_business_hours=True,
    location="New Delhi",
    network_type="internal"
)

allow, reasons = abac.evaluate_policy(
    user_attrs, resource_attrs, env_attrs, "read"
)
```

### 3.4 Access Control Engine (Combined RBAC + ABAC)
```python
from app.rbac_abac_engine import AccessControlEngine

access_control = AccessControlEngine()

# Check comprehensive access
allow, reason = access_control.check_access(
    user_attrs, resource_attrs, env_attrs,
    operation="read",
    required_permission=Permission.CASE_READ
)

# Check case-specific access
allow, reason = access_control.check_case_access(
    user_id="user123",
    user_roles=["investigator"],
    user_department=Department.I4C,
    case_id="case_456",
    case_owner_id="user789",
    case_assigned_to=["user123", "user999"],
    case_department=Department.I4C
)  # Returns: True (user is assignee)
```

---

## 4. OAuth2 Authorization Server & OIDC (`oauth2_server.py`)

### Purpose
Implement full OAuth2 Authorization Server with OpenID Connect (OIDC) support.

### 4.1 OAuth2 Client Registration
```python
from app.oauth2_server import OAuth2Server, OAuth2Client, GrantType, ResponseType

server = OAuth2Server()

# Register OAuth2 client
client = OAuth2Client(
    client_id="client_LEAtTrace_web",
    client_name="LEAtTrace Web Client",
    client_secret="super_secret_key",
    allowed_grant_types=[GrantType.AUTHORIZATION_CODE, GrantType.REFRESH_TOKEN],
    allowed_response_types=[ResponseType.CODE, ResponseType.ID_TOKEN],
    redirect_uris=["https://app.leattrace.gov.in/callback"],
    token_endpoint_auth_method="client_secret_basic",
    require_pkce=True,
    id_token_signed_response_alg="RS256",
    created_at=datetime.datetime.utcnow(),
    updated_at=datetime.datetime.utcnow()
)

server.register_client(client)
```

### 4.2 Authorization Code Flow (with PKCE)
```python
# Step 1: Create authorization request
success, auth_request, error = server.create_authorization_request(
    client_id="client_LEAtTrace_web",
    response_type=ResponseType.CODE,
    redirect_uri="https://app.leattrace.gov.in/callback",
    state="random_state_value",
    scope="openid email profile",
    nonce="random_nonce",
    code_challenge="E9Mrozoa2owUzYrWsbWH86FzwOWUQqTSIcPo73xnqTE",  # PKCE
    code_challenge_method=CodeChallengeMethod.S256
)

# Step 2: User approves, create authorization code
auth_code = server.create_authorization_code(
    request=auth_request,
    user_id="user123"
)

# Step 3: Client exchanges code for tokens
success, tokens, error = server.exchange_authorization_code(
    code=auth_code.code,
    client_id="client_LEAtTrace_web",
    redirect_uri="https://app.leattrace.gov.in/callback",
    code_verifier="M25VvKRVJ61R61z27MC3qmYvMg8"  # PKCE verifier
)

# Returns:
# {
#     "access_token": "...",
#     "token_type": "Bearer",
#     "expires_in": 3600,
#     "refresh_token": "...",
#     "id_token": "..."  # OIDC
# }
```

### 4.3 Refresh Token Flow
```python
# Client uses refresh token to get new access token
success, tokens, error = server.refresh_access_token(
    refresh_token="refresh_token_value",
    client_id="client_LEAtTrace_web"
)

# Returns new tokens with rotated refresh token
```

### 4.4 OIDC Provider
```python
from app.oauth2_server import OIDCProvider

oidc = OIDCProvider(server)

# Get OIDC discovery configuration
config = oidc.get_discovery_config("https://leattrace.gov.in")

# Returns:
# {
#     "issuer": "https://leattrace.gov.in",
#     "authorization_endpoint": "https://leattrace.gov.in/oauth/authorize",
#     "token_endpoint": "https://leattrace.gov.in/oauth/token",
#     "userinfo_endpoint": "https://leattrace.gov.in/oauth/userinfo",
#     ...
# }

# Get user info with OIDC
userinfo = oidc.get_userinfo(
    user_id="user123",
    access_token="access_token_value"
)

# Returns:
# {
#     "sub": "user123",
#     "email": "user@cybercrime.gov.in",
#     "email_verified": True,
#     "name": "Officer Name",
#     "department": "i4c",
#     "clearance_level": 4,
#     "roles": ["investigator"]
# }
```

---

## 5. Encryption Infrastructure (`encryption_engine.py`)

### Purpose
Provide comprehensive encryption with AES-256-GCM, envelope encryption, and key rotation.

### 5.1 AES-256-GCM Encryption
```python
from app.encryption_engine import AES256GCMEncryptor

# Generate key
key = AES256GCMEncryptor.generate_key()  # 32 bytes

# Generate IV
iv = AES256GCMEncryptor.generate_iv()    # 12 bytes

# Encrypt data
plaintext = b"Sensitive case information"
ciphertext, iv, tag = AES256GCMEncryptor.encrypt(plaintext, key, iv=iv)

# Decrypt data
decrypted = AES256GCMEncryptor.decrypt(ciphertext, key, iv, tag)
```

### 5.2 Envelope Encryption
```python
from app.encryption_engine import EnvelopeEncryption

# Envelope encryption: DEK encrypted with KEK
kek = AES256GCMEncryptor.generate_key()  # Key Encryption Key

# Encrypt
encrypted_data = EnvelopeEncryption.encrypt_with_envelope(
    plaintext=b"Sensitive data",
    kek=kek,
    associated_data=b"case_123"
)

# Decrypt
plaintext = EnvelopeEncryption.decrypt_with_envelope(encrypted_data, kek, b"case_123")
```

### 5.3 Key Rotation
```python
from app.encryption_engine import EncryptionManager, EncryptionKey

manager = EncryptionManager()

# Add key
key = EncryptionKey(
    key_id="key_primary_2026",
    key_material=AES256GCMEncryptor.generate_key(),
    is_primary=True
)
manager.add_key(key)

# Rotate key (automatically generates new key, marks old as deprecated)
new_key = manager.rotate_key("key_primary_2026")

# Key rotation schedule: 90 days for data keys, 365 days for root keys
```

### 5.4 Sensitive Data Encryption
```python
# Encrypt sensitive field
encrypted = manager.encrypt_sensitive_data(
    data="sensitive@email.com",
    context="user_email"
)

# Decrypt sensitive field
decrypted = manager.decrypt_sensitive_data(encrypted, "user_email")
```

### 5.5 Database Field Encryption
```python
from app.encryption_engine import DatabaseFieldEncryption

# Encrypt before storing
encrypted_email = DatabaseFieldEncryption.encrypt_field(
    value="officer@cybercrime.gov.in",
    encryption_manager=manager,
    field_name="user_email"
)

# Decrypt when retrieving
email = DatabaseFieldEncryption.decrypt_field(
    encrypted_value=encrypted_email,
    encryption_manager=manager,
    field_name="user_email"
)
```

---

## 6. API Security (`api_security.py`)

### Purpose
Provide rate limiting, IP whitelist, API key management, and geo-blocking.

### 6.1 Rate Limiting
```python
from app.api_security import RateLimiter

limiter = RateLimiter()

# Check rate limit
allowed, info = limiter.check_rate_limit(
    identifier="user123",
    requests_allowed_per_minute=60,
    requests_allowed_per_hour=1000
)

if not allowed:
    # Returns:
    # {
    #     "remaining_requests_minute": 0,
    #     "reason": "Rate limit exceeded (per minute)",
    #     "reset_at_minute": 1719760500
    # }
```

### 6.2 API Key Management
```python
from app.api_security import APIKeyManager

api_key_manager = APIKeyManager()

# Create API key
api_key = api_key_manager.create_api_key(
    name="Integration Key",
    description="For third-party integration",
    allowed_endpoints=["/api/cases", "/api/wallets"],
    requests_per_minute=60,
    expires_in_days=365
)

# Validate API key
is_valid, reason, key_obj = api_key_manager.validate_api_key(
    api_key_value=api_key.key_value,
    endpoint="/api/cases",
    method="GET"
)

# Revoke API key
api_key_manager.revoke_api_key(api_key.key_id)

# Rotate API key
old_key, new_key = api_key_manager.rotate_api_key(api_key.key_id)
```

### 6.3 IP Whitelist
```python
from app.api_security import IPWhitelistManager

whitelist = IPWhitelistManager()

# Add to whitelist
entry = whitelist.add_to_whitelist(
    ip_address="192.168.1.0/24",
    description="Internal network",
    endpoints=["/api/admin"],
    expires_in_days=30
)

# Check if IP is whitelisted
is_whitelisted = whitelist.is_ip_whitelisted(
    ip_address="192.168.1.100",
    endpoint="/api/admin"
)
```

### 6.4 Geo-Blocking
```python
from app.api_security import GeoBlockingManager

geo_blocker = GeoBlockingManager()

# Add whitelist rule (only allow India)
rule = geo_blocker.add_rule(
    rule_type="whitelist",
    countries=["IN"],  # ISO 3166-1 alpha-2
    endpoints=["/api/sensitive"],
    operations=["download"]
)

# Check if access should be blocked
should_block, reason = geo_blocker.should_block(
    country_code="US",
    endpoint="/api/sensitive",
    operation="download"
)  # Returns: (True, "Access only allowed from whitelisted countries")
```

### 6.5 Security Headers
```python
from app.api_security import SecurityHeadersManager

headers = SecurityHeadersManager.get_security_headers()

# Add to all API responses:
# {
#     "X-Content-Type-Options": "nosniff",
#     "X-Frame-Options": "DENY",
#     "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
#     "Content-Security-Policy": "default-src 'self'",
#     ...
# }
```

---

## Integration Examples

### Complete Login Flow with MFA and Session Management
```python
from app.mfa_engine import MFAEngine
from app.advanced_session_manager import AdvancedSessionManager
from app.rbac_abac_engine import AccessControlEngine

# 1. User initiates login
@router.post("/login")
async def login(credentials):
    # Authenticate user
    user = authenticate_user(credentials.username, credentials.password)
    
    # Check MFA requirement
    engine = MFAEngine()
    mfa_setup = engine.setup_mfa_for_user(user.id, user.email, user.name)
    
    return {"requires_mfa": True, "mfa_setup": mfa_setup}

# 2. User verifies MFA
@router.post("/verify-mfa")
async def verify_mfa(mfa_code, temp_token):
    # Verify TOTP code
    is_valid, msg = MFAEngine.verify_mfa_code(user.mfa_secret, mfa_code)
    
    if is_valid:
        # Create session
        session_manager = AdvancedSessionManager()
        policy = session_manager.get_policy_for_role(user.role)
        
        # Generate tokens
        access_token = generate_jwt(user.id, policy.access_token_lifetime_minutes)
        refresh_token = generate_refresh_token(user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer"
        }

# 3. User accesses protected endpoint
@router.get("/api/cases/{case_id}")
async def get_case(case_id, current_user = Depends(get_current_user)):
    # Check access control
    access_engine = AccessControlEngine()
    
    can_access, reason = access_engine.check_case_access(
        user_id=current_user.id,
        user_roles=current_user.roles,
        user_department=current_user.department,
        case_id=case_id,
        case_owner_id=case.owner_id,
        case_assigned_to=case.assigned_to,
        case_department=case.department
    )
    
    if not can_access:
        raise HTTPException(status_code=403, detail=reason)
    
    return case
```

---

## Security Best Practices

### 1. Key Management
- Rotate encryption keys every 90 days
- Store KEKs (Key Encryption Keys) separately
- Use HSM for root key storage
- Implement key escrow for recovery

### 2. Token Management
- Rotate refresh tokens on each use
- Implement token binding to prevent theft
- Set reasonable token expiration (15-60 minutes for access tokens)
- Invalidate all tokens on logout

### 3. Session Management
- Limit concurrent sessions per user (3-5)
- Enforce device binding for sensitive operations
- Implement idle timeout (15-30 minutes)
- Detect and block impossible travel

### 4. Access Control
- Principle of least privilege
- Regular access review (monthly)
- Implement separation of duties
- Audit all access changes

### 5. MFA Policy
- Enforce MFA for admins (always)
- Enforce MFA for sensitive operations
- Enforce MFA on new devices
- Allow MFA bypass only in emergency with logging

---

## Monitoring & Alerting

### Critical Events to Monitor
1. Failed MFA attempts (>3 in 5 minutes)
2. Refresh token reuse
3. Session anomalies (impossible travel, concurrent access)
4. API key usage patterns
5. Encryption key rotation failures
6. Rate limit threshold breaches

### Recommended Metrics
```
- MFA enrollment rate (>90% for admins)
- Session anomaly detection rate
- Token rotation frequency
- Key rotation compliance (100%)
- API rate limit violations
- Unauthorized access attempts
```

---

## Deployment Checklist

- [ ] Install all required packages: `pip install -r requirements.txt`
- [ ] Configure Redis for session storage
- [ ] Set up HSM or key management service
- [ ] Configure encryption key rotation schedule
- [ ] Set up monitoring and alerting
- [ ] Configure API rate limiting policies
- [ ] Enable audit logging
- [ ] Test MFA flows
- [ ] Test token rotation
- [ ] Test access control policies
- [ ] Performance testing (<50ms overhead)
- [ ] Security audit
- [ ] Penetration testing
- [ ] Compliance validation

---

## References

- [NIST SP 800-63B - Authentication](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [FIDO2 Specifications](https://fidoalliance.org/fido2/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

