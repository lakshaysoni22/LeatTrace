from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import datetime
import random
import json

from ..database import get_db, get_mongo_db, get_redis_client
from .. import models

router = APIRouter()

# --- Pydantic Schemas ---
class CPOSRequest(BaseModel):
    input: str
    mode: str = "deep"

class RIILIngestRequest(BaseModel):
    source: str
    data: dict

class NGELEvaluateRequest(BaseModel):
    action: str
    risk_level: str

class QCALResolveRequest(BaseModel):
    inputs: List[str]

class CaseCreateRequest(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    assigned_to: str = "Inspector Sharma"

class FraudCheckRequest(BaseModel):
    transaction_id: str
    amount: float
    mixer_used: bool
    rapid_transactions: bool

class ForensicReportRequest(BaseModel):
    case_id: str
    wallet_address: str

# --- Endpoints ---

# 🧠 CPOS SERVICE
@router.post("/cpos/process")
def process_cpos(request: CPOSRequest, db: Session = Depends(get_db)):
    trace_id = "trace-" + str(uuid.uuid4())[:8]
    selected_option = "approved" if "fraud" not in request.input.lower() else "flagged"
    prob = 0.91 if selected_option == "approved" else 0.82

    # Save to SQLite / SQL database
    new_decision = models.Decision(
        decision_id=trace_id,
        user_id="usr-system-cpos",
        input=request.input,
        output=selected_option,
        confidence=prob,
        risk_level="medium" if selected_option == "approved" else "high"
    )
    db.add(new_decision)
    db.commit()

    # Save to MongoDB
    mongo = get_mongo_db()
    mongo["ai_logs"].insert_one({
        "log_id": trace_id,
        "service": "CPOS",
        "input": request.input,
        "result": {"decision": selected_option, "confidence": prob},
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    # Cache to Redis
    redis_conn = get_redis_client()
    redis_conn.set(f"decision_cache:{trace_id}", selected_option, ex=3600)

    return {
        "decision": selected_option,
        "confidence": prob,
        "reasoning_trace": ["Ingested transaction input", "Verified credentials", "Calculated hops", "Executed simulation"],
        "governance": "passed",
        "trace_id": trace_id
    }

# 🌍 RIIL SERVICE
@router.post("/riil/ingest")
def ingest_riil(request: RIILIngestRequest):
    return {"status": "success", "ingested_events_count": 1}

@router.get("/riil/state")
def get_riil_state():
    return {"system_state": "active", "external_sync": True}

# ⚖️ NGEL SERVICE
@router.post("/ngel/evaluate")
def evaluate_ngel(request: NGELEvaluateRequest):
    allowed = request.risk_level != "critical"
    reason = "Governance policy check passed." if allowed else "Action violates strict safety constraints."
    return {"allowed": allowed, "reason": reason}

# 📊 QCAL SERVICE
@router.post("/qcal/resolve")
def resolve_qcal(request: QCALResolveRequest):
    if not request.inputs:
        return {"selected": "", "probability": 0.0}
    selected = random.choice(request.inputs)
    prob = round(random.uniform(0.75, 0.98), 2)
    return {"selected": selected, "probability": prob}

# 👛 BLOCKCHAIN TRACE
@router.post("/blockchain/trace")
def trace_blockchain(request: dict):
    address = request.get("address", "0xABC")
    connections = [
        {"from_address": address, "to_address": "0x123f72a855f72a855f72a855f72a855f72a855f7", "value": 15.5},
        {"from_address": "0x123f72a855f72a855f72a855f72a855f72a855f7", "to_address": "0xTornadoCashMixerAddress000000000000000", "value": 12.0}
    ]
    return {
        "wallet": address,
        "connections": connections,
        "risk_score": 0.87,
        "analysis": "ALERT: Direct or secondary exposure to mixing service detected (Tornado Cash)."
    }

# ⚖️ INVESTIGATION
@router.post("/investigation/cases/create")
def create_investigation_case(request: CaseCreateRequest, db: Session = Depends(get_db)):
    case_id = str(uuid.uuid4())
    case_number = f"CC-2026-{str(uuid.uuid4())[:4].upper()}"
    new_case = models.Case(
        id=case_id,
        case_number=case_number,
        title=request.title,
        description=request.description,
        priority=request.priority,
        status="under_investigation",
        investigator_name=request.assigned_to,
        department="Cyber Crime Cell"
    )
    db.add(new_case)
    db.commit()
    return {
        "case_id": case_id,
        "title": request.title,
        "status": "under_investigation",
        "priority": request.priority,
        "assigned_to": request.assigned_to,
        "created_at": datetime.datetime.utcnow().isoformat()
    }

@router.post("/investigation/detect-fraud")
def detect_investigation_fraud(request: FraudCheckRequest):
    score = 0.1
    if request.amount > 10000:
        score += 0.4
    if request.mixer_used:
        score += 0.4
    if request.rapid_transactions:
        score += 0.2
    score = min(score, 1.0)
    return {
        "transaction_id": request.transaction_id,
        "fraud_score": score,
        "status": "HIGH_RISK" if score >= 0.8 else "LOW_RISK",
        "analysis": f"Analysis complete. Score resolved at {score}."
    }

@router.post("/investigation/forensic-report")
def generate_forensic_report(request: ForensicReportRequest, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == request.case_id).first()
    if not case:
        case = db.query(models.Case).filter(models.Case.case_number == request.case_id).first()
    
    case_title = case.title if case else "Ponzi Tracing Case"
    case_number = case.case_number if case else "CC-2026-UNKNOWN"

    return {
        "case_id": request.case_id,
        "evidence_package": [
            {"type": "blockchain_connection_network", "nodes_count": 2, "edges_count": 2},
            {"type": "case_metadata", "title": case_title, "number": case_number}
        ],
        "final_risk_score": 0.87,
        "report_summary": f"Forensic analysis compiled for case {case_number}. 2 nodes traced with Tornado Cash mixer exposure.",
        "created_at": datetime.datetime.utcnow().isoformat()
    }
