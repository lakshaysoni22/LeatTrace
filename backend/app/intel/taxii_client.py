"""
BACKWARD COMPATIBILITY SHIM.
Re-exports from app.services.intel.taxii_client including internal HTTP helpers for testing.
"""
import sys
from ..services.intel.taxii_client import *  # noqa: F401,F403
from ..services.intel.taxii_client import _http_get, _build_headers
from ..services.intel import taxii_client as _target

sys.modules[__name__] = _target
