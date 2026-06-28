import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, security

router = APIRouter(prefix="/api/wallets", tags=["Wallet Intelligence"])

# Realistic Mock profile resolver
def resolve_wallet_profile(address: str, chain: str) -> dict:
    # Deterministic mock risk scoring based on address length/characters
    address_lower = address.lower()
    
    # Specific known profiles
    if "ransom" in address_lower or address == "1LbcPeel5s9zARansom993vX78cDf":
        return {
            "address": address,
            "chain": chain,
            "balance": 1842.115,
            "balanceUSD": 115203492.20,
            "totalTransactions": 14022,
            "incomingTxns": 8200,
            "outgoingTxns": 5822,
            "firstActivity": "2021-02-10T14:23:00Z",
            "lastActivity": datetime.datetime.utcnow().isoformat() + "Z",
            "totalVolumeIn": 94820.25,
            "totalVolumeOut": 92978.135,
            "riskScore": 98,
            "riskIndicators": [
                {"type": "ransomware_link", "severity": "critical", "description": "Associated with LockBit Ransomware extortion collection", "score": 40},
                {"type": "mixer_interaction", "severity": "high", "description": "Interaction with high-risk mixing pools (Tornado/Wasabi)", "score": 25},
                {"type": "large_outflow", "severity": "high", "description": "Rapid peeling chains distributing funds across 40+ change addresses", "score": 20},
                {"type": "sanctioned_entity", "severity": "critical", "description": "OFAC flagged illicit wallet addresses list", "score": 13}
            ],
            "tags": ["sanctioned", "ransomware", "critical-risk"],
            "isContract": False,
            "label": "LockBit Ransomware Receiver v4"
        }
    
    if address_lower.startswith("0x71c") or "tornado" in address_lower:
        return {
            "address": address,
            "chain": "ethereum",
            "balance": 450.84,
            "balanceUSD": 1623024.00,
            "totalTransactions": 482,
            "incomingTxns": 341,
            "outgoingTxns": 141,
            "firstActivity": "2024-06-18T18:54:44Z",
            "lastActivity": datetime.datetime.utcnow().isoformat() + "Z",
            "totalVolumeIn": 5420.0,
            "totalVolumeOut": 4969.16,
            "riskScore": 89,
            "riskIndicators": [
                {"type": "exploit_drainer", "severity": "critical", "description": "Identified as Tornado.Cash Exploit malicious drainage system", "score": 45},
                {"type": "sanctioned_entity", "severity": "critical", "description": "Tornado Cash smart contract links and direct routing", "score": 30},
                {"type": "high_velocity", "severity": "medium", "description": "Suspicious transaction frequency in short timeframe", "score": 14}
            ],
            "tags": ["sanctioned", "exploit-linked", "high-risk"],
            "isContract": True,
            "label": "Tornado.Cash Exploit Drainer"
        }

    # Deterministic default scoring
    score = abs(hash(address)) % 80 + 10 # 10 to 90
    balance = float(abs(hash(address)) % 150) / 2.3
    txs = abs(hash(address)) % 800 + 5
    
    indicators = []
    tags = []
    if score >= 75:
        indicators.append({"type": "mixer_interaction", "severity": "high", "description": "Interaction with known mixing services", "score": 25})
        indicators.append({"type": "fan_out", "severity": "high", "description": "Rapid multi-hop distribution structure", "score": 20})
        tags.extend(["suspect", "high-risk"])
    elif score >= 50:
        indicators.append({"type": "high_velocity", "severity": "medium", "description": "High tx velocity - suspicious behavior pattern", "score": 15})
        tags.append("monitored")
    else:
        indicators.append({"type": "standard_retail", "severity": "low", "description": "Retail interaction history, no sanctioned links", "score": 2})
        tags.append("retail")

    return {
        "address": address,
        "chain": chain,
        "balance": balance,
        "balanceUSD": balance * 3600.0 if chain == "ethereum" else balance * 67000.0,
        "totalTransactions": txs,
        "incomingTxns": txs // 2,
        "outgoingTxns": txs - (txs // 2),
        "firstActivity": "2023-01-12T09:00:00Z",
        "lastActivity": datetime.datetime.utcnow().isoformat() + "Z",
        "totalVolumeIn": balance * 5.2,
        "totalVolumeOut": balance * 4.2,
        "riskScore": score,
        "riskIndicators": indicators,
        "tags": tags,
        "isContract": False,
        "label": f"Analyzed Address ({chain.upper()})"
    }

@router.get("/search")
def search_wallet(address: str, chain: str = "ethereum", db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if len(address) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid wallet address format."
        )

    # Resolve profile info
    profile = resolve_wallet_profile(address, chain)

    # Log query
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Searched blockchain wallet: {chain}:{address} (Risk Score: {profile['riskScore']}%)",
        status="success"
    )
    db.add(audit_entry)
    db.commit()

    return profile

# --- Advanced Blockchain Intelligence Endpoints ---
from pydantic import BaseModel
from ..blockchain_service import BlockchainService

blockchain_svc = BlockchainService()

class LogDecodeRequest(BaseModel):
    topics: List[str]
    data: str

@router.get("/rpc-status")
def get_rpc_wiring_status(current_user: models.User = Depends(security.get_current_user)):
    return blockchain_svc.get_rpc_status()

@router.get("/cluster/{address}")
def get_wallet_cluster(address: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    cluster = blockchain_svc.get_address_cluster(address)
    
    # Audit log entry
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Executed wallet clustering heuristic analysis on {address} (Cluster size: {cluster['total_size']})",
        status="success"
    )
    db.add(audit_entry)
    db.commit()
    return cluster

@router.get("/mixer-check/{address}")
def get_mixer_exposure_audit(address: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    analysis = blockchain_svc.check_mixer_exposure(address)
    
    # Audit log entry
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Scanned address mixer exposure profile for {address} (Exposure: {analysis['exposure_percentage']}%)",
        status="success"
    )
    db.add(audit_entry)
    db.commit()
    return analysis

@router.get("/cross-chain-trace/{address}")
def get_cross_chain_trace(address: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    trace = blockchain_svc.trace_cross_chain_bridges(address)
    
    # Audit log entry
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Traced cross-chain bridge jumps for {address} (Total hops: {len(trace['hops'])})",
        status="success"
    )
    db.add(audit_entry)
    db.commit()
    return trace

@router.post("/decode-log")
def decode_event_log(req: LogDecodeRequest, current_user: models.User = Depends(security.get_current_user)):
    decoded = blockchain_svc.decode_token_transfer(req.topics, req.data)
    if not decoded:
        raise HTTPException(
            status_code=400,
            detail="Log signature mismatch. Not a standard ERC-20/721 Transfer event."
        )
    return decoded

@router.post("/simulate")
async def trigger_block_simulation(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Grab watchlist items to trigger simulated block event on
    watched = db.query(models.WatchlistEntry).all()
    if not watched:
        # Fallback to defaults
        watched = [
            models.WatchlistEntry(
                id="def-1",
                address="1LbcPeel5s9zARansom993vX78cDf",
                chain="BTC",
                alias="LockBit Ransomware Receiver",
                risk_score=98
            )
        ]

    triggered = False
    new_alerts = []
    
    # Simulate a transaction transfer
    import random
    from ..event_broker import broker
    for entry in watched:
        val = round(random.uniform(1.0, 50.0), 2)
        txid = f"tx_{uuid.uuid4().hex[:16]}"
        message = f"Alert triggered [{entry.alias or entry.address[:8]}]: Transaction detected transferring {val} {entry.chain} (Txid: {txid})."
        
        alert_entry = models.Alert(
            id=f"alr_{uuid.uuid4().hex[:7]}",
            chain=entry.chain,
            address=entry.address,
            alias=entry.alias,
            type="incoming" if random.choice([True, False]) else "outgoing",
            threshold=0.1,
            status="Triggered",
            severity="critical" if entry.risk_score >= 80 else "high",
            message=message,
            is_read=False
        )
        db.add(alert_entry)
        new_alerts.append(message)
        triggered = True

        # Publish transaction event to broker stream
        tx_event = {
            "hash": txid,
            "from": "0x71c20e241775e5332f143715df332f143789a71b" if random.choice([True, False]) else entry.address,
            "to": entry.address,
            "value": val,
            "chain": entry.chain,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
        await broker.publish("transaction_stream", tx_event)

        # Publish alert event to broker stream
        alert_event = {
            "id": alert_entry.id,
            "chain": alert_entry.chain,
            "address": alert_entry.address,
            "alias": alert_entry.alias,
            "type": alert_entry.type,
            "severity": alert_entry.severity,
            "message": alert_entry.message,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        }
        await broker.publish("alert_stream", alert_event)

    if triggered:
        db.commit()
        # Log to audit logs
        audit_entry = models.AuditLog(
            id=f"log_{uuid.uuid4().hex[:7]}",
            user_id=current_user.id,
            username=current_user.username,
            action=f"Simulated transaction block event for monitored watchlist rules. Triggered {len(new_alerts)} alarms.",
            status="warning"
        )
        db.add(audit_entry)
        db.commit()

    return {
        "triggered": triggered,
        "message": f"Successfully simulated block listener. Raised {len(new_alerts)} security notifications.",
        "alerts": new_alerts
    }

@router.post("/{case_id}", response_model=schemas.WalletOut)
def link_wallet_to_case(case_id: str, wallet: schemas.WalletCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not db_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case file not found"
        )

    # Avoid duplicate address links in the same case
    existing = db.query(models.Wallet).filter(
        models.Wallet.case_id == case_id,
        models.Wallet.address == wallet.address
    ).first()
    
    if existing:
        return existing

    new_wallet = models.Wallet(
        id=f"wlt-{uuid.uuid4().hex[:7]}",
        address=wallet.address,
        chain=wallet.chain,
        label=wallet.label,
        tags=wallet.tags,
        risk_score=wallet.risk_score,
        is_contract=wallet.is_contract,
        case_id=case_id
    )
    db.add(new_wallet)
    
    # Log audit trail
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Linked wallet address {wallet.address} to case {db_case.case_number}",
        status="success"
    )
    db.add(audit_entry)
    db.commit()
    
    db.refresh(new_wallet)
    return new_wallet

@router.get("/watchlist", response_model=List[schemas.WatchlistOut])
def get_watchlist(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.WatchlistEntry).order_by(models.WatchlistEntry.created_at.desc()).all()

@router.post("/watchlist", response_model=schemas.WatchlistOut)
def add_to_watchlist(entry: schemas.WatchlistCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Check if duplicate
    existing = db.query(models.WatchlistEntry).filter(
        models.WatchlistEntry.address == entry.address
    ).first()
    if existing:
        return existing

    new_entry = models.WatchlistEntry(
        id=f"wtl-{uuid.uuid4().hex[:7]}",
        address=entry.address,
        chain=entry.chain,
        alias=entry.alias,
        risk_score=entry.risk_score,
        status=entry.status
    )
    db.add(new_entry)

    # Log action
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Added address to system active watchlist: {entry.chain}:{entry.address}",
        status="success"
    )
    db.add(audit_entry)
    db.commit()

    db.refresh(new_entry)
    return new_entry

@router.delete("/watchlist/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    db_entry = db.query(models.WatchlistEntry).filter(models.WatchlistEntry.id == id).first()
    if not db_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist entry not found"
        )

    addr = db_entry.address
    db.delete(db_entry)
    db.commit()

    # Log action
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Removed address from watchlist: {addr}",
        status="warning"
    )
    db.add(audit_entry)
    db.commit()
    return None

@router.get("/alerts", response_model=List[schemas.AlertOut])
def get_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()

@router.post("/alerts/read")
def read_all_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    db.query(models.Alert).update({models.Alert.is_read: True})
    db.commit()
    return {"message": "All alerts marked read"}

@router.post("/alerts/read/{id}")
def read_alert(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    alert = db.query(models.Alert).filter(models.Alert.id == id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"message": "Alert marked read"}


