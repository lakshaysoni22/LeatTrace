"""
BACKWARD COMPATIBILITY SHIM.
This file re-exports all models from the new location: app.db.models
All new code should import from app.db.models instead.
"""
from .db.models import *  # noqa: F401,F403
