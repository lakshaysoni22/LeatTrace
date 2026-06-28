import uuid
import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from . import models, security
from .routers import auth, cases, wallets, graph, evidence, audit, ai, real_ecosystem, streaming, incident

# Setup database tables on startup (no migrations needed for simple SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LEATrace API",
    description="Law Enforcement Advanced Trace Intelligence Platform REST Backend",
    version="1.0.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(wallets.router)
app.include_router(graph.router)
app.include_router(evidence.router)
app.include_router(audit.router)
app.include_router(ai.router)
app.include_router(real_ecosystem.router)
app.include_router(streaming.router)
app.include_router(incident.router)

# Seed mock database values if empty
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(models.User).count() == 0:
            # Seed users
            users = [
                models.User(
                    id="usr-1",
                    email="inspector.verma@cybercrime.gov.in",
                    username="Inspector Verma",
                    hashed_password=security.get_password_hash("SecurePass@2026"),
                    role="investigator",
                    is_active=True,
                    mfa_enabled=True,
                    department="Cyber Crime Cell"
                ),
                models.User(
                    id="usr-2",
                    email="supervisor.sinha@cybercrime.gov.in",
                    username="Supervisor Sinha",
                    hashed_password=security.get_password_hash("SecurePass@2026"),
                    role="supervisor",
                    is_active=True,
                    mfa_enabled=True,
                    department="Cyber Investigation Command"
                ),
                models.User(
                    id="usr-3",
                    email="auditor.gupta@cybercrime.gov.in",
                    username="Auditor Gupta",
                    hashed_password=security.get_password_hash("SecurePass@2026"),
                    role="auditor",
                    is_active=True,
                    mfa_enabled=False,
                    department="AML Oversight Committee"
                )
            ]
            db.add_all(users)
            db.commit()

            # Seed Cases
            cases = [
                models.Case(
                    id="case-1",
                    case_number="CC-2026-0847",
                    title="Crypto Ponzi Scheme — GainChain Network",
                    description="Investigation into GainChain, a suspected Ponzi scheme operating through Ethereum smart contracts. Multiple victims reported losses exceeding ₹50 Crore.",
                    priority="critical",
                    status="active",
                    investigator_id="usr-1",
                    investigator_name="Inspector Verma",
                    department="Cyber Crime Cell",
                    notes="Primary suspect wallet identified. Multi-hop tracing in progress."
                ),
                models.Case(
                    id="case-2",
                    case_number="CC-2026-0912",
                    title="Ransomware Payment Tracing — MedLock Attack",
                    description="Tracing ransom payments from MedLock ransomware attack targeting healthcare institutions. Bitcoin converted to ETH via DEX.",
                    priority="high",
                    status="active",
                    investigator_id="usr-1",
                    investigator_name="Inspector Verma",
                    department="Cyber Crime Cell",
                    notes="DEX swap transactions identified on Uniswap."
                )
            ]
            db.add_all(cases)
            db.commit()

            # Seed Wallets
            wallets = [
                models.Wallet(
                    id="wlt-1",
                    address="1LbcPeel5s9zARansom993vX78cDf",
                    chain="BTC",
                    label="LockBit Ransomware Receiver",
                    tags="sanctioned,ransomware,critical-risk",
                    risk_score=98,
                    is_contract=False,
                    case_id="case-2"
                ),
                models.Wallet(
                    id="wlt-2",
                    address="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28",
                    chain="ethereum",
                    label="Suspected Layering Wallet",
                    tags="suspect,ponzi-linked",
                    risk_score=78,
                    is_contract=False,
                    case_id="case-1"
                )
            ]
            db.add_all(wallets)
            db.commit()

            # Seed Watchlist items
            watchlist = [
                models.WatchlistEntry(
                    id="wtl-1",
                    address="1LbcPeel5s9zARansom993vX78cDf",
                    chain="BTC",
                    alias="LockBit Ransomware Receiver",
                    risk_score=98,
                    status="Monitored"
                ),
                models.WatchlistEntry(
                    id="wtl-2",
                    address="0x71c20e241775e5332f143715df332f143789a71b",
                    chain="ethereum",
                    alias="Tornado.Cash Exploit Drainer",
                    risk_score=89,
                    status="Monitored"
                )
            ]
            db.add_all(watchlist)
            db.commit()

            # Seed Audit Logs
            audit_logs = [
                models.AuditLog(
                    id="log_init",
                    user_id=None,
                    username="SYSTEM",
                    action="Database initial setup completed successfully. Seeded demo environment values.",
                    status="success",
                    actor="System",
                    decision_source="Database Setup",
                    validation_status="Verified"
                )
            ]
            db.add_all(audit_logs)
            db.commit()
            
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "sqlite/local"
    }
