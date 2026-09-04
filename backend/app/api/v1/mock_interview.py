"""API Router for AI Voice Mock Interviewer
Part of the Student Success Agent subsystem in CampusOS AI.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user_optional
from app.models import User
from app.services.ai_agents.student_success_agent.interview_brain import (
    get_all_roles,
    start_mock_interview_session,
    process_interview_turn,
    evaluate_interview_session,
    INTERVIEW_SESSIONS
)
from app.services.speech.audio_service import get_available_voices, transcribe_audio_payload

router = APIRouter(prefix="/mock-interview", tags=["AI Voice Mock Interviewer"])


class StartInterviewRequest(BaseModel):
    role: str = "fullstack"
    seniority: str = "Junior (1-2 YoE)"
    focus_areas: Optional[List[str]] = None
    student_notes: Optional[str] = None
    total_rounds: int = 5
    model: Optional[str] = "auto"


class InterviewTurnRequest(BaseModel):
    session_id: str
    student_transcript: str


class EvaluateInterviewRequest(BaseModel):
    session_id: str


class TranscribeAudioRequest(BaseModel):
    audio_base64: str
    format: Optional[str] = "webm"


@router.get("/roles")
def list_interview_roles():
    """Returns list of supported technical and behavioral interview roles with topics."""
    return {"roles": get_all_roles()}


@router.get("/voices")
def list_supported_voices():
    """Returns list of natural voice models for text-to-speech synthesis."""
    return get_available_voices()


@router.post("/start")
async def start_interview_endpoint(
    payload: StartInterviewRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Initializes a new real-time AI Voice Mock Interview session
    powered by the Student Success Agent with dynamic questions generated
    by Google Model or Kimi-K3 (Featherless AI) based on candidate role.
    """
    student_id = current_user.id if current_user else "student_guest"
    result = await start_mock_interview_session(
        student_id=student_id,
        role=payload.role,
        seniority=payload.seniority,
        focus_areas=payload.focus_areas,
        student_notes=payload.student_notes,
        total_rounds=payload.total_rounds,
        preferred_model=payload.model or "auto"
    )
    return result


@router.post("/turn")
async def interview_turn_endpoint(
    payload: InterviewTurnRequest
):
    """
    Processes candidate voice/text input, reasons dynamically with the
    Senior Staff Interviewer agent, and yields the next follow-up question.
    """
    if not payload.student_transcript or not payload.student_transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student transcript cannot be empty."
        )

    result = await process_interview_turn(
        session_id=payload.session_id,
        student_transcript=payload.student_transcript
    )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", "Interview session error")
        )

    return result


@router.post("/evaluate")
async def evaluate_interview_endpoint(
    payload: EvaluateInterviewRequest
):
    """
    Computes post-interview multi-rubric scorecard (0-100), hire decision,
    strengths, weaknesses, missed opportunities, and 7-Day Action Plan.
    """
    evaluation = await evaluate_interview_session(payload.session_id)
    return {
        "session_id": payload.session_id,
        "evaluation": evaluation
    }


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    payload: TranscribeAudioRequest
):
    """
    Fallback server-side audio transcription endpoint for recorded voice blobs.
    """
    return await transcribe_audio_payload(payload.audio_base64, payload.format or "webm")


@router.get("/session/{session_id}")
def get_interview_session_details(session_id: str):
    """Fetches real-time status and transcript for an ongoing or completed session."""
    session = INTERVIEW_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{session_id}' not found."
        )
    return session
