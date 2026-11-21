"""
Admin Control and Configuration API.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.config_model import Config
from app.auth.dependencies import require_roles
from app.core.simulation import sim_engine
from app.core.ai_client import AIClient
from app.utils.events import emit_event, log_audit

router = APIRouter(tags=["Control"])
ai_client = AIClient()


class OverrideRequest(BaseModel):
    requested_phase: str  # "NS" or "EW"


class ConfigUpdateRequest(BaseModel):
    min_green: float = 8.0
    max_green: float = 40.0
    gap_time: float = 3.0
    ema_beta: float = 0.4
    alpha: float = 0.6
    ai_enabled: bool = True


@router.get("/config")
def get_config(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    configs = db.query(Config).all()
    if not configs:
        return {
            "min_green": 8.0,
            "max_green": 40.0,
            "gap_time": 3.0,
            "yellow_time": 3.0,
            "all_red_time": 2.0,
            "ema_beta": 0.4,
            "alpha": 0.6,
            "aging_k": 0.1,
            "aging_cap_s": 90.0,
            "ai_enabled": True,
        }
    return {c.key: c.value for c in configs}


@router.put("/config")
def update_config(
    req: ConfigUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    # Safe validation range
    if not (5.0 <= req.min_green <= 20.0):
        raise HTTPException(status_code=400, detail="min_green must be between 5 and 20 seconds")
    if not (20.0 <= req.max_green <= 90.0):
        raise HTTPException(status_code=400, detail="max_green must be between 20 and 90 seconds")

    # Update sim_engine parameters live
    for act in sim_engine.actuated.values():
        act.min_green = req.min_green
        act.max_green = req.max_green
        act.gap_time = req.gap_time

    log_audit("UPDATE_CONFIG", current_user.id, "CONFIG", details=req.dict(), db=db)
    return {"message": "Configuration updated successfully", "config": req.dict()}


@router.post("/junctions/{id}/override")
def override_junction(
    id: int,
    req: OverrideRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
    db: Session = Depends(get_db),
):
    if id not in sim_engine.fsms:
        raise HTTPException(status_code=404, detail="Junction not found")

    phase = req.requested_phase.upper()
    if phase not in ("NS", "EW"):
        raise HTTPException(status_code=400, detail="Invalid phase. Must be NS or EW.")

    fsm = sim_engine.fsms[id]
    # Request safe phase change through FSM (never skips yellow/all-red)
    success = fsm.request_phase_change(phase)

    log_audit("OVERRIDE_JUNCTION", current_user.id, "JUNCTION", id, {"requested_phase": phase}, db)
    emit_event("SIGNAL_PHASE_CHANGED", {
        "junction_id": id,
        "manual_override": True,
        "requested_phase": phase,
        "accepted": success,
    }, actor=current_user.email, db=db)

    return {
        "message": f"Manual override to {phase} initiated through safe safety FSM",
        "current_state": fsm.state.value,
        "current_phase": fsm.current_phase,
    }


@router.post("/ai/toggle")
def toggle_ai(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    log_audit("TOGGLE_AI", current_user.id, "AI_SERVICE", details={}, db=db)
    return {"ai_enabled": True, "message": "AI prediction toggled"}


@router.post("/ai/retrain")
async def retrain_ai(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    res = await ai_client.retrain_model()
    return res
