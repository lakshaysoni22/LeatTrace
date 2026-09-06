"""Blockchain intelligence database models (indexing, cross-chain, bridges, risk scoring)."""

import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class BlockIndexCheckpoint(Base):
    __tablename__ = "block_index_checkpoints"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chain = Column(String, index=True, nullable=False)
    block_number = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class EntityLabel(Base):
    __tablename__ = "entity_labels"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    address = Column(String, index=True, unique=True, nullable=False)
    label = Column(String, nullable=False)
    category = Column(String, nullable=False)  # exchange, sanctioned, scam, retail
    source = Column(String, default="Local Compliance")
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CrossChainEvent(Base):
    __tablename__ = "cross_chain_events"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_chain = Column(String, nullable=False)
    destination_chain = Column(String, nullable=False)
    source_tx_hash = Column(String, index=True, nullable=True)
    destination_tx_hash = Column(String, nullable=True)
    bridge_protocol = Column(String, nullable=True)
    sender_address = Column(String, index=True, nullable=False)
    receiver_address = Column(String, nullable=True)
    token_symbol = Column(String, default="ETH")
    amount = Column(Float, default=0.0)
    bridge_fee = Column(Float, default=0.0)
    status = Column(String, default="detected")  # detected, confirmed, failed
    risk_score = Column(Integer, default=0)
    timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BridgeEvent(Base):
    __tablename__ = "bridge_events"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bridge_name = Column(String, nullable=False)
    bridge_address = Column(String, index=True, nullable=False)
    source_chain = Column(String, nullable=False)
    destination_chain = Column(String, nullable=False)
    tx_hash = Column(String, index=True, nullable=False)
    user_address = Column(String, index=True, nullable=False)
    token_in = Column(String, default="ETH")
    token_out = Column(String, default="WETH")
    amount_in = Column(Float, default=0.0)
    amount_out = Column(Float, default=0.0)
    timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DecodedContract(Base):
    __tablename__ = "decoded_contracts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    address = Column(String, index=True, nullable=False)
    chain = Column(String, default="ethereum")
    contract_name = Column(String, nullable=True)
    contract_type = Column(String, default="unknown")  # erc20, erc721, erc1155, defi, bridge, proxy
    is_proxy = Column(Boolean, default=False)
    implementation_address = Column(String, nullable=True)
    abi_json = Column(Text, nullable=True)
    protocol_name = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    risk_level = Column(String, default="unknown")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    target_type = Column(String, nullable=False)  # wallet, transaction, token, bridge, contract, entity
    target_id = Column(String, index=True, nullable=False)  # address or tx_hash
    chain = Column(String, default="ethereum")
    overall_score = Column(Integer, default=0)
    mixer_score = Column(Integer, default=0)
    sanctions_score = Column(Integer, default=0)
    counterparty_score = Column(Integer, default=0)
    behavioral_score = Column(Integer, default=0)
    bridge_score = Column(Integer, default=0)
    fraud_probability = Column(Float, default=0.0)
    aml_risk = Column(Float, default=0.0)
    confidence = Column(Float, default=0.5)
    explanation = Column(Text, nullable=True)
    evidence_json = Column(Text, nullable=True)  # JSON array of supporting evidence
    scored_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BlockchainTimeline(Base):
    __tablename__ = "blockchain_timelines"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String, index=True, nullable=True)
    address = Column(String, index=True, nullable=False)
    event_type = Column(String, nullable=False)  # transfer, bridge, mixer, defi, contract_call
    event_description = Column(String, nullable=True)
    tx_hash = Column(String, nullable=True)
    chain = Column(String, default="ethereum")
    value_eth = Column(Float, default=0.0)
    counterparty = Column(String, nullable=True)
    risk_flag = Column(Boolean, default=False)
    timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Report(Base):
    """Investigation report metadata. Content stored as text; future: binary PDF attachment."""
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    conclusions = Column(Text, nullable=True)
    generated_by = Column(String, nullable=True)      # username of investigator
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationship
    case = relationship("Case", foreign_keys=[case_id])


# ─── TAXII / STIX Models ──────────────────────────────────────────────────────

class TaxiiSyncState(Base):
    """Tracks incremental sync state per TAXII collection."""
    __tablename__ = "taxii_sync_states"

    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    collection_id  = Column(String, unique=True, nullable=False, index=True)
    last_synced_at = Column(DateTime, nullable=True)
    objects_synced = Column(Integer, default=0)
    error_count    = Column(Integer, default=0)
    api_root_url   = Column(String, nullable=True)
    created_at     = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class StixIndicator(Base):
    """Persisted STIX 2.1 Indicator objects from TAXII sync."""
    __tablename__ = "stix_indicators"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    stix_id      = Column(String, unique=True, nullable=False, index=True)  # indicator--UUID
    name         = Column(String, nullable=True)
    pattern      = Column(Text, nullable=True)
    pattern_type = Column(String, default="stix")
    valid_from   = Column(DateTime, nullable=True)
    valid_until  = Column(DateTime, nullable=True)
    collection_id = Column(String, nullable=True, index=True)
    confidence   = Column(Integer, nullable=True)
    raw_json     = Column(Text, nullable=True)
    created_at   = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


# ─── Sanctions Models ─────────────────────────────────────────────────────────

class SanctionsEntry(Base):
    """A single sanctioned entity (address/entity) from a real sanctions provider."""
    __tablename__ = "sanctions_entries"

    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    address       = Column(String, nullable=True, index=True)     # crypto address if applicable
    entity_name   = Column(String, nullable=True)                 # individual/entity name
    program       = Column(String, nullable=True)                 # e.g. "IRAN", "RUSSIA"
    list_type     = Column(String, nullable=False)                # "OFAC_SDN", "EU_CONSOLIDATED"
    source_id     = Column(String, nullable=True)                 # UID from the source list
    entry_type    = Column(String, nullable=True)                 # "individual", "entity", "vessel"
    raw_data      = Column(Text, nullable=True)                   # original XML/JSON
    hash_key      = Column(String, nullable=True, index=True)     # for deduplication
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SanctionsSyncLog(Base):
    """Audit log of each sanctions sync run."""
    __tablename__ = "sanctions_sync_logs"

    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider        = Column(String, nullable=False)   # "OFAC_SDN", "EU_CONSOLIDATED"
    status          = Column(String, nullable=False)   # "success", "error", "skipped"
    entries_added   = Column(Integer, default=0)
    entries_updated = Column(Integer, default=0)
    file_hash       = Column(String, nullable=True)    # SHA-256 of downloaded file
    error_message   = Column(Text, nullable=True)
    synced_at       = Column(DateTime, default=datetime.datetime.utcnow)


# ─── SIEM Models ──────────────────────────────────────────────────────────────

class SecurityIncident(Base):
    """A SIEM security incident record — DB-persisted, never hardcoded."""
    __tablename__ = "security_incidents"

    id               = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    severity         = Column(String, nullable=False, default="medium")  # critical/high/medium/low
    category         = Column(String, nullable=True)
    mitre_technique  = Column(String, nullable=True)
    message          = Column(Text, nullable=False)
    source           = Column(String, nullable=True)
    analyst_assigned = Column(String, nullable=True)
    status           = Column(String, nullable=False, default="open")  # open/acknowledged/closed
    source_ip        = Column(String, nullable=True)
    related_address  = Column(String, nullable=True)
    raw_event        = Column(Text, nullable=True)
    created_at       = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    closed_at        = Column(DateTime, nullable=True)


# ─── AI/ML Models ─────────────────────────────────────────────────────────────

class MLModel(Base):
    __tablename__ = "ml_models"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String, index=True, nullable=False)
    model_version = Column(String, nullable=False)
    model_type = Column(String, nullable=False)  # classification, regression, clustering, anomaly
    framework = Column(String, default="sklearn")  # sklearn, xgboost, lightgbm, pytorch
    file_path = Column(String, nullable=True)
    feature_dim = Column(Integer, default=0)
    status = Column(String, default="trained")  # trained, deployed, champion, challenger, archived
    accuracy = Column(Float, nullable=True)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    training_samples = Column(Integer, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON blob for extra metrics
    trained_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class VectorDocument(Base):
    __tablename__ = "vector_documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_type = Column(String, index=True, nullable=False)  # wallet, transaction, case, evidence, threat, alert
    source_id = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    embedding_model = Column(String, default="all-MiniLM-L6-v2")
    embedding_version = Column(Integer, default=1)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AIExperiment(Base):
    __tablename__ = "ai_experiments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_name = Column(String, index=True, nullable=False)
    run_id = Column(String, unique=True, nullable=False)
    run_name = Column(String, nullable=True)
    status = Column(String, default="RUNNING")  # RUNNING, COMPLETED, FAILED
    params_json = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)


class TrainingJob(Base):
    __tablename__ = "training_jobs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String, nullable=False)
    job_type = Column(String, default="full")  # full, incremental, evaluation
    status = Column(String, default="pending")  # pending, running, completed, failed
    trigger = Column(String, default="manual")  # manual, scheduled, drift
    samples_count = Column(Integer, nullable=True)
    metrics_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
