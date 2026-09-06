"""Wallet-related database models."""

import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, index=True)
    address = Column(String, index=True, nullable=False)
    chain = Column(String, nullable=False)  # bitcoin, ethereum, solana
    label = Column(String, nullable=True)
    tags = Column(String, nullable=True)  # Comma-separated list
    risk_score = Column(Integer, default=0)
    is_contract = Column(Boolean, default=False)
    case_id = Column(String, ForeignKey("cases.id"))

    # Relationships
    case = relationship("Case", back_populates="wallets")


class WatchlistEntry(Base):
    __tablename__ = "watchlist"

    id = Column(String, primary_key=True, index=True)
    address = Column(String, nullable=False)
    chain = Column(String, nullable=False)
    alias = Column(String, nullable=True)
    risk_score = Column(Integer, default=0)
    status = Column(String, default="Monitored")  # Monitored, Suspended
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WalletProfile(Base):
    __tablename__ = "wallet_profiles"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    address = Column(String, unique=True, index=True, nullable=False)
    chain = Column(String, default="ethereum")
    wallet_type = Column(String, default="eoa")  # eoa, contract, multisig, proxy
    entity_name = Column(String, nullable=True)
    entity_category = Column(String, nullable=True)  # exchange, defi, mixer, unknown
    cluster_id = Column(String, nullable=True, index=True)
    risk_score = Column(Integer, default=0)
    trust_score = Column(Integer, default=50)
    total_tx_count = Column(Integer, default=0)
    total_volume_eth = Column(Float, default=0.0)
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    is_contract = Column(Boolean, default=False)
    is_sanctioned = Column(Boolean, default=False)
    mixer_exposure_pct = Column(Float, default=0.0)
    tags = Column(Text, nullable=True)  # JSON array
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class WalletCluster(Base):
    __tablename__ = "wallet_clusters"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_id = Column(String, unique=True, index=True, nullable=False)
    cluster_name = Column(String, nullable=True)
    entity_name = Column(String, nullable=True)
    heuristic_type = Column(String, default="co_spending")  # co_spending, behavioral, graph, exchange
    confidence = Column(Float, default=0.5)
    member_count = Column(Integer, default=0)
    total_volume_eth = Column(Float, default=0.0)
    risk_score = Column(Integer, default=0)
    addresses_json = Column(Text, nullable=True)  # JSON array of addresses
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class WalletRelationship(Base):
    __tablename__ = "wallet_relationships"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_address = Column(String, index=True, nullable=False)
    target_address = Column(String, index=True, nullable=False)
    relationship_type = Column(String, default="transfer")  # transfer, co_spend, bridge, funding
    tx_count = Column(Integer, default=1)
    total_value_eth = Column(Float, default=0.0)
    first_interaction = Column(DateTime, nullable=True)
    last_interaction = Column(DateTime, nullable=True)
    relationship_score = Column(Float, default=0.0)
    chain = Column(String, default="ethereum")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
