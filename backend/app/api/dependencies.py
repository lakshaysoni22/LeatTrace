"""
LEATrace API Layer Dependencies.

Consolidates standard dependencies for API routes:
- Database sessions
- Authentication and User context
- RBAC / Permission requirements
"""

from ..db.session import get_db
from ..core.security import get_current_user, get_current_active_user
from ..core.rbac import require_roles, require_permissions

__all__ = [
    "get_db",
    "get_current_user",
    "get_current_active_user",
    "require_roles",
    "require_permissions",
]
