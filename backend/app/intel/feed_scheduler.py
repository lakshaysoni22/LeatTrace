"""
BACKWARD COMPATIBILITY SHIM.
Re-exports feed scheduler and test utilities from canonical location: app.services.intel.feed_scheduler
"""

from ..services.intel.feed_scheduler import (
    ThreatFeedScheduler,
    NOT_CONFIGURED,
    _parse_ofac_sdn,
    _parse_sources,
    _sha256,
    feed_scheduler,
)

__all__ = [
    "ThreatFeedScheduler",
    "NOT_CONFIGURED",
    "_parse_ofac_sdn",
    "_parse_sources",
    "_sha256",
    "feed_scheduler",
]
