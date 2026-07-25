"""Library Recommendation System ML model.

Recommends books using previous borrowing history.
"""
from typing import List, Dict


def recommend_books_collaborative(user_borrow_history: List[str]) -> List[Dict]:
    """Provides collaborative filtering recommendation lists of library books."""
    # Stub representation
    return [
        {"book_id": "b_101", "title": "Design Patterns", "author": "Gang of Four"},
        {"book_id": "b_102", "title": "Clean Code", "author": "Robert C. Martin"},
    ]
