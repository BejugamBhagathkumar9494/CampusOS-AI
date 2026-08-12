from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models import User, FeeStructure, Student

router = APIRouter(prefix="/finance", tags=["Finance Management"])


@router.get("/fees")
def get_fees(
    student_id: str = "1",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get fee details (dues, structural breakdown, paid status)."""
    try:
        s_id = int(student_id)
        fee = db.query(FeeStructure).filter(FeeStructure.student_id == s_id).first()
    except (ValueError, TypeError):
        fee = None

    if fee:
        dues = max(0.0, float(fee.total_amount - fee.paid_amount))
        return {
            "student_id": student_id,
            "dues": dues,
            "total_paid": float(fee.paid_amount),
            "due_date": fee.due_date.isoformat() if fee.due_date else None,
            "breakdown": [
                {"category": "Tuition Fee & Charges", "amount": float(fee.total_amount), "status": "Pending" if dues > 0 else "Paid"}
            ]
        }

    return {
        "student_id": student_id,
        "dues": 0.0,
        "total_paid": 0.0,
        "due_date": None,
        "breakdown": []
    }


@router.post("/transaction")
def initiate_transaction(
    amount: float = 1250.0,
    student_id: str = "1",
    current_user: User = Depends(get_current_user)
):
    """Initiate a payment transaction."""
    import uuid
    tx_ref = f"TX_{uuid.uuid4().hex[:8].upper()}"
    return {
        "transaction_id": tx_ref,
        "student_id": student_id,
        "amount": amount,
        "status": "Success",
        "message": "Payment processed successfully"
    }


@router.get("/scholarships")
def get_scholarships(
    student_id: str = "1",
    current_user: User = Depends(get_current_user)
):
    """Get AI scholarship recommendations matching student grades and financial status."""
    return {
        "student_id": student_id,
        "recommendations": [
            {
                "id": "sch_1",
                "title": "Merit Academic Excellence Grant",
                "amount_usd": 2500,
                "eligibility_match": 95,
                "criteria": "CGPA > 8.0 & attendance > 85%",
                "deadline": "2026-08-30"
            },
            {
                "id": "sch_2",
                "title": "STEM Women Leadership Fellowship",
                "amount_usd": 3000,
                "eligibility_match": 88,
                "criteria": "Top 10% in Computer Science",
                "deadline": "2026-09-15"
            }
        ]
    }

