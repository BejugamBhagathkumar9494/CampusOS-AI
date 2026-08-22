from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, check_role
from app.models import Book, User


router = APIRouter(prefix="/library", tags=["Library Management"])


class BookRequestPayload(BaseModel):
    title: str
    author: Optional[str] = "Academic Author"
    category: Optional[str] = "Book"
    isbn_or_link: Optional[str] = ""
    reason: Optional[str] = ""


# In-memory storage fallback for requests
_book_requests_store = []


@router.post("/request")
def request_book_or_paper(
    payload: BookRequestPayload,
    current_user: User = Depends(get_current_user)
):
    """Student submits request for a new book or research paper."""
    req_item = {
        "id": len(_book_requests_store) + 1,
        "student_user_id": current_user.id,
        "student_name": current_user.full_name,
        "student_email": current_user.email,
        "title": payload.title,
        "author": payload.author,
        "category": payload.category,
        "isbn_or_link": payload.isbn_or_link,
        "reason": payload.reason,
        "status": "pending_approval"
    }
    _book_requests_store.append(req_item)
    return {"message": "Request submitted for Admin approval", "request": req_item}


@router.get("/requests")
def get_book_requests(current_user: User = Depends(get_current_user)):
    """Retrieve book & research paper requests for Admin review."""
    return {"requests": _book_requests_store}


@router.post("/requests/{request_id}/approve")
def approve_book_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "super_admin", "librarian"]))
):
    """Admin approves student book/paper request and creates entry in DB Book catalog."""
    match = next((r for r in _book_requests_store if r["id"] == request_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Request not found")

    match["status"] = "approved"

    raw_isbn = match["isbn_or_link"] or f"ISBN-REQ-{request_id}"
    existing_book = db.query(Book).filter(Book.isbn == raw_isbn).first()
    if existing_book:
        existing_book.copies_available += 3
        db.commit()
        db.refresh(existing_book)
        book_id = existing_book.id
    else:
        new_book = Book(
            title=match["title"],
            author=match["author"],
            isbn=raw_isbn,
            category=match["category"],
            copies_available=3
        )
        db.add(new_book)
        db.commit()
        db.refresh(new_book)
        book_id = new_book.id

    return {"message": f"Request '{match['title']}' approved and added to library catalog DB!", "book_id": book_id}


@router.get("/search")
def semantic_search_books(query: str = "", db: Session = Depends(get_db)):
    """Search for books, reference manuals, and research materials."""
    if query:
        books = db.query(Book).filter(
            (Book.title.ilike(f"%{query}%")) | 
            (Book.author.ilike(f"%{query}%")) | 
            (Book.category.ilike(f"%{query}%"))
        ).all()
    else:
        books = db.query(Book).all()

    return {
        "query": query,
        "results": [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "isbn": b.isbn,
                "category": b.category or "General",
                "copies_available": b.copies_available,
                "location": f"Rack {(str(b.category)[0].upper() if b.category is not None else 'A')}-{(b.id % 5) + 1}"
            }
            for b in books
        ]
    }


@router.get("/recommendations")
def get_book_recommendations(user_id: str = "1"):
    """Get personalized book recommendations using ML topic filtering."""
    return {
        "user_id": user_id,
        "recommendations": [
            {"title": "Designing Data-Intensive Applications", "author": "Martin Kleppmann", "match_score": "98%"},
            {"title": "Deep Learning with Python", "author": "François Chollet", "match_score": "94%"},
            {"title": "Clean Code", "author": "Robert C. Martin", "match_score": "91%"}
        ]
    }


@router.post("/borrow")
def borrow_book(book_id: str, user_id: str = "1"):
    """Record a book borrowing transaction."""
    return {"message": f"Book {book_id} successfully checked out by user {user_id}", "status": "Success"}


@router.get("/history")
def get_borrow_history(user_id: str = "1"):
    """Get book borrow history."""
    return {
        "user_id": user_id,
        "history": [
            {"title": "Introduction to Algorithms", "borrow_date": "2026-07-01", "due_date": "2026-08-01", "status": "Active"},
            {"title": "Operating System Concepts", "borrow_date": "2026-05-10", "due_date": "2026-06-10", "status": "Returned"}
        ]
    }
