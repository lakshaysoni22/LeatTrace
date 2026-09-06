"""
BACKWARD COMPATIBILITY SHIM.
Re-exports elasticsearch client from app.infra.elasticsearch.
"""

from .elasticsearch import *  # noqa: F401,F403
