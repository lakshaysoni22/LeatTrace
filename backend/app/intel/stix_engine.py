"""
BACKWARD COMPATIBILITY SHIM.
Re-exports from app.services.intel.stix_engine
"""
import sys
from ..services.intel.stix_engine import *  # noqa: F401,F403
from ..services.intel import stix_engine as _target

sys.modules[__name__] = _target
