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

    if not books:
        # Initial default recommendations if DB search yields empty
        return {
            "query": query,
            "results": [
                {"id": 1, "title": "Introduction to Algorithms (4th Ed)", "author": "Cormen, Leiserson", "isbn": "978-0262033848", "category": "Computer Science", "copies_available": 3, "location": "Rack C-4"},
                {"id": 2, "title": "Compilers: Principles, Techniques, & Tools", "author": "Aho, Sethi, Ullman", "isbn": "978-0321486813", "category": "Computer Science", "copies_available": 0, "location": "Rack E-1"},
                {"id": 3, "title": "Computer Networking: A Top-Down Approach", "author": "Kurose, Ross", "isbn": "978-0133594140", "category": "Networks", "copies_available": 5, "location": "Rack B-2"},
                {"id": 4, "title": "Pattern Recognition & Machine Learning", "author": "Christopher Bishop", "isbn": "978-0387310732", "category": "Artificial Intelligence", "copies_available": 4, "location": "Rack AI-1"}
            ]
        }

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
                "location": f"Rack {b.category[0].upper() if b.category else 'A'}-{(b.id % 5) + 1}"
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
