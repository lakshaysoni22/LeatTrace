from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, security

router = APIRouter(prefix="/api/audit", tags=["Compliance Audit"])

@router.get("/logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.RoleChecker(["admin", "supervisor", "auditor"]))
):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
