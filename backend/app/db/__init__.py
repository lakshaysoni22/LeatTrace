"""
LEATrace Database Package.

Re-exports core database components for backward compatibility.
Import from app.db instead of app.database.
"""

from .session import (
    Base,
    engine,
    SessionLocal,
    get_db,
    check_db_health,
    get_mongo_db,
    get_redis_client,
    redis_client,
)
from . import models
from .. import schemas

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "check_db_health",
    "get_mongo_db",
    "get_redis_client",
    "redis_client",
    "models",
    "schemas",
]
