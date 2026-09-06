"""Transaction and blockchain indexer database models."""

import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from app.db.session import Base


class IndexedTransaction(Base):
    __tablename__ = "indexed_transactions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chain = Column(String, index=True, nullable=False)
    tx_hash = Column(String, index=True, unique=True, nullable=False)
    block_number = Column(Integer, index=True, nullable=False)
    from_address = Column(String, index=True, nullable=False)
    to_address = Column(String, index=True, nullable=False)
    value = Column(Float, nullable=False)
    gas_used = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)


class IndexedTokenTransfer(Base):
    __tablename__ = "indexed_token_transfers"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chain = Column(String, index=True, nullable=False)
    tx_hash = Column(String, index=True, nullable=False)
    contract_address = Column(String, index=True, nullable=False)
    from_address = Column(String, index=True, nullable=False)
    to_address = Column(String, index=True, nullable=False)
    value = Column(Float, nullable=False)
    token_type = Column(String, nullable=False)  # ERC-20, ERC-721, ERC-1155
    symbol = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=False)
