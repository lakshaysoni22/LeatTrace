"""
BACKWARD COMPATIBILITY SHIM.
Re-exports sanctions package from canonical location: app.services.sanctions
"""

from ..services.sanctions import *  # noqa: F401,F403
