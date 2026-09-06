"""
BACKWARD COMPATIBILITY SHIM.
This file re-exports all schemas from the new location: app.schemas
All new code should import from app.schemas instead.
"""
from .schemas import *  # noqa: F401,F403
