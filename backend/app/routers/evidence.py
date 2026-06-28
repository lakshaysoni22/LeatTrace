import os
import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, security

router = APIRouter(prefix="/api/evidence", tags=["Evidence Locker"])

# Setup local evidence storage directory
STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "evidence")
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.post("/upload/{case_id}", response_model=schemas.EvidenceOut, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Verify case exists
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Read file and calculate SHA-256 hash on-the-fly
    file_bytes = await file.read()
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    file_size = len(file_bytes)

    # Save to local directory structure (mocking MinIO object storage)
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid.uuid4().hex}{file_extension}"
    storage_path = os.path.join(STORAGE_DIR, safe_filename)

    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    new_evidence = models.Evidence(
        id=f"evd-{uuid.uuid4().hex[:7]}",
        case_id=case_id,
        filename=file.filename,
        file_hash=sha256_hash,
        file_size=file_size,
        uploaded_by=current_user.username,
        description=description,
        storage_path=storage_path
    )
    db.add(new_evidence)
    db.commit()

    # Log action to system audit log
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Uploaded evidence file: '{file.filename}' (Hash: {sha256_hash[:10]}...) to case {db_case.case_number}",
        status="success"
    )
    db.add(audit_entry)
    db.commit()

    db.refresh(new_evidence)
    return new_evidence

@router.get("/case/{case_id}", response_model=List[schemas.EvidenceOut])
def get_case_evidence(case_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.Evidence).filter(models.Evidence.case_id == case_id).all()

@router.post("/verify/{evidence_id}")
def verify_evidence_integrity(evidence_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Retrieve evidence metadata from database
    db_evidence = db.query(models.Evidence).filter(models.Evidence.id == evidence_id).first()
    if not db_evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found")

    # Verify physical file existence in store
    if not os.path.exists(db_evidence.storage_path):
        # File is missing
        audit_entry = models.AuditLog(
            id=f"log_{uuid.uuid4().hex[:7]}",
            user_id=current_user.id,
            username=current_user.username,
            action=f"Integrity check failed: File '{db_evidence.filename}' not found in storage locker.",
            status="failure"
        )
        db.add(audit_entry)
        db.commit()
        return {
            "id": evidence_id,
            "filename": db_evidence.filename,
            "status": "MISSING",
            "message": "The physical file is missing from the secure vault."
        }

    # Recalculate hash of physical file
    with open(db_evidence.storage_path, "rb") as f:
        current_bytes = f.read()
    current_hash = hashlib.sha256(current_bytes).hexdigest()

    # Integrity verification
    match = current_hash == db_evidence.file_hash
    status_str = "VERIFIED" if match else "TAMPERED"

    # Log verification check in immutable audit log
    audit_entry = models.AuditLog(
        id=f"log_{uuid.uuid4().hex[:7]}",
        user_id=current_user.id,
        username=current_user.username,
        action=f"Evidence Integrity Check for '{db_evidence.filename}': Status {status_str} (Registered: {db_evidence.file_hash[:8]}, Computed: {current_hash[:8]})",
        status="success" if match else "failure"
    )
    db.add(audit_entry)
    db.commit()

    return {
        "id": evidence_id,
        "filename": db_evidence.filename,
        "status": status_str,
        "registered_hash": db_evidence.file_hash,
        "computed_hash": current_hash,
        "tamper_detected": not match
    }
