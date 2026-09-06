"""
BACKWARD COMPATIBILITY SHIM.
This file re-exports from the new location: app.db.session
All new code should import from app.db instead.
"""
from .db.session import (
    Base, engine, SessionLocal, get_db, check_db_health,
    get_mongo_db, get_redis_client, redis_client,
)
