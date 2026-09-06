"""
BACKWARD COMPATIBILITY SHIM.
This file re-exports from the new location: app.core.dependencies
All new code should import from app.core.dependencies instead.
"""
from .core.dependencies import *  # noqa: F401,F403
