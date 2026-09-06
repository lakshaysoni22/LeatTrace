"""
BACKWARD COMPATIBILITY SHIM.
Re-exports from app.services.intel.stix_models
"""
import sys
from ..services.intel.stix_models import *  # noqa: F401,F403
from ..services.intel import stix_models as _target

sys.modules[__name__] = _target
