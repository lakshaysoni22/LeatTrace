"""
BACKWARD COMPATIBILITY SHIM.
This file re-exports configuration from the canonical location: app.config.settings
All new code should import from app.config instead.
"""

from .config.settings import Settings, settings

__all__ = ["Settings", "settings"]
