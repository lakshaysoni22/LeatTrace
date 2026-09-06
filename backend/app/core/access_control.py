"""
LEATrace Access Control Engine — RBAC + ABAC Combined.

Role-Based Access Control (RBAC) with hierarchical role inheritance
and Attribute-Based Access Control (ABAC) for fine-grained policy evaluation.

RBAC: Role hierarchy with inherited permissions.
ABAC: Context-aware policy evaluation (clearance, department, geo, time).
"""
from typing import Dict, Set, Any


# ═══════════════════════════════════════════════════════════════════════════════
# RBAC — Role-Based Access Control
# ═══════════════════════════════════════════════════════════════════════════════

# Role hierarchies: child -> parent (inherits permissions)
ROLE_HIERARCHY = {
    "super_admin": {"admin", "auditor"},
    "admin": {"senior_investigator", "soc_manager"},
    "soc_manager": {"soc_analyst"},
    "senior_investigator": {"investigator"},
    "investigator": {"read_only"},
    "soc_analyst": {"read_only"},
    "auditor": {"read_only"},
    "read_only": set()
}

# Permissions mappings
ROLE_PERMISSIONS = {
    "read_only": {"case:view", "blockchain:view", "reports:view"},
    "investigator": {"case:create", "case:edit", "blockchain:scan", "evidence:view"},
    "senior_investigator": {"evidence:upload", "evidence:delete", "incident:write"},
    "soc_analyst": {"siem:view", "incident:view"},
    "soc_manager": {"siem:admin", "incident:resolve"},
    "auditor": {"audit:view"},
    "admin": {"user:invite", "settings:edit"},
    "super_admin": {"system:admin", "secret:rotate"}
}

class RBACEngine:
    def get_all_roles_in_hierarchy(self, role: str) -> Set[str]:
        """Traverses the role hierarchy recursively to extract all inherited roles."""
        roles = {role}
        queue = [role]
        
        while queue:
            current = queue.pop(0)
            inherited = ROLE_HIERARCHY.get(current, set())
            for child in inherited:
                if child not in roles:
                    roles.add(child)
                    queue.append(child)
        return roles

    def has_permission(self, role: str, permission: str) -> bool:
        """Checks if a role has a specific permission directly or via inheritance."""
        active_roles = self.get_all_roles_in_hierarchy(role)
        
        for active_role in active_roles:
            permissions = ROLE_PERMISSIONS.get(active_role, set())
            if permission in permissions:
                return True
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# ABAC — Attribute-Based Access Control
# ═══════════════════════════════════════════════════════════════════════════════

class ABACEngine:
    def evaluate_policy(self, user_attributes: Dict[str, Any], resource_attributes: Dict[str, Any], environment_attributes: Dict[str, Any]) -> bool:
        """Evaluates whether an investigator has access based on user, resource, and environmental contexts."""
        # 1. Security Clearance Check
        user_clearance = user_attributes.get("clearance_level", 1)
        resource_clearance = resource_attributes.get("clearance_required", 1)
        if user_clearance < resource_clearance:
            return False
            
        # 2. Department Lock check (e.g. Cybercrime vs Forensic unit isolation)
        user_dept = user_attributes.get("department")
        resource_dept = resource_attributes.get("department_restriction")
        if resource_dept and user_dept != resource_dept:
            # Exception: Super Admin can bypass department isolation
            if user_attributes.get("role") != "super_admin":
                return False
                
        # 3. Geo-location restriction (e.g. access restricted to office region)
        user_region = user_attributes.get("region", "IN")
        allowed_regions = resource_attributes.get("allowed_regions")
        if allowed_regions and user_region not in allowed_regions:
            return False
            
        # 4. Safe Working Hours (e.g. 06:00 to 22:00)
        access_hour = environment_attributes.get("current_hour", 12)
        is_restricted_resource = resource_attributes.get("restricted_hours_only", False)
        if is_restricted_resource:
            if not (6 <= access_hour <= 22):
                return False
                
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# Singleton Instances
# ═══════════════════════════════════════════════════════════════════════════════

rbac_engine = RBACEngine()
abac_engine = ABACEngine()
