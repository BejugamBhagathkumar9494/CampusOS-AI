from fastapi import APIRouter

router = APIRouter(prefix="/finance", tags=["Finance Management"])


@router.get("/fees")
def get_fees(student_id: str = "1"):
    """Get fee details (dues, structural breakdown, paid status)."""
    return {
        "student_id": student_id,
        "dues": 1250.0,
        "total_paid": 5000.0,
        "due_date": "2026-08-15",
        "breakdown": [
            {"category": "Tuition Fee", "amount": 4000.0, "status": "Paid"},
            {"category": "Lab & Library Fee", "amount": 1000.0, "status": "Paid"},
            {"category": "Semester Exam & Placement Cell Fee", "amount": 1250.0, "status": "Pending"}
        ]
    }


@router.post("/transaction")
def initiate_transaction(amount: float = 1250.0, student_id: str = "1"):
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
def get_scholarships(student_id: str = "1"):
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
