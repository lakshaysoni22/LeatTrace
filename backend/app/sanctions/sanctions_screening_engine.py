"""
BACKWARD COMPATIBILITY SHIM.
Re-exports sanctions screening engine from canonical location: app.services.sanctions.screening_engine
"""

from ..services.sanctions.screening_engine import *  # noqa: F401,F403
