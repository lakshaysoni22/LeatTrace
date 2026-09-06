"""
BACKWARD COMPATIBILITY SHIM.
Re-exports from app.services.intel.threat_database
"""
import sys
from ..services.intel.threat_database import *  # noqa: F401,F403
from ..services.intel import threat_database as _target

sys.modules[__name__] = _target
