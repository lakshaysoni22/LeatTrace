from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from ...infra.ml_engine import ml_engine
from ...infra.vector_service import vector_service
from ...infra.model_server import model_server

router = APIRouter(prefix="/api/ai", tags=["AI/ML Forensics Intelligence"])

@router.post("/predict")
def predict_wallet_risk(features: List[float] = Body(..., description="[tx_count, total_value, is_mixer_connected, is_sanctioned]")):
    if len(features) != 4:
        raise HTTPException(status_code=400, detail="Feature vector must contain exactly 4 float metrics")
    return ml_engine.predict_risk(features)

@router.post("/train")
def train_classification_model(
    X: List[List[float]] = Body(...),
    y: List[int] = Body(...)
):
    try:
        path = ml_engine.train_wallet_risk_model(X, y)
        return {"status": "trained", "saved_path": path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/vector-search")
def search_semantic_documents(
    query: str = Body(..., embed=True),
    limit: int = Query(5)
):
    return vector_service.search_similarity(query, limit)

@router.post("/copilot/explain")
def get_ai_copilot_explain(
    topic: str = Body(...),
    context: str = Body(...)
):
    raise HTTPException(
        status_code=501,
        detail="AI Copilot explain endpoint requires a configured LLM provider. Set GEMINI_API_KEY in environment."
    )

@router.post("/models/promote")
def promote_registry_model(model_id: str = Query(...)):
    return model_server.promote_challenger_to_champion(model_id)

@router.post("/models/rollback")
def rollback_registry_model(
    model_id: str = Query(...),
    version: str = Query(...)
):
    return model_server.rollback_model_version(model_id, version)
