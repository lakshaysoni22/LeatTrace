"""
BACKWARD COMPATIBILITY SHIM.
This file re-exports from the new location: app.core.event_broker
All new code should import from app.core.event_broker instead.
"""
from .core.event_broker import *  # noqa: F401,F403
