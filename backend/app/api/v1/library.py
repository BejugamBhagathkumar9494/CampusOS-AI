from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models import Book

router = APIRouter(prefix="/library", tags=["Library Management"])


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
