import re
from typing import List, Dict, Any, Tuple

REFUSAL_MESSAGE = "That information is not available in the uploaded study material."
INSUFFICIENT_INFO_MESSAGE = "I could not find enough information in the uploaded study material to generate a reliable answer."


def extract_keywords(text: str) -> List[str]:
    """Extracts non-trivial content words (>=4 letters) for grounded validation."""
    stopwords = {
        "what", "when", "where", "which", "whose", "whom", "this", "that", "these", "those",
        "have", "from", "with", "about", "into", "through", "during", "before", "after", "above",
        "below", "under", "between", "explain", "describe", "discuss", "summarize", "definition",
        "notes", "material", "study", "subject", "chapter", "marks", "question", "answer",
        "detail", "difference", "compare", "between", "give", "write", "show", "tell"
    }
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    return [w for w in words if w not in stopwords]


def validate_groundedness(
    query: str,
    answer: str,
    retrieved_chunks: List[Dict[str, Any]],
    threshold_ratio: float = 0.4
) -> Tuple[bool, str]:
    """
    Validates that the answer is grounded in retrieved chunks.
    Checks:
    1. If retrieved_chunks is empty -> refuse.
    2. If answer indicates missing info -> refuse.
    3. If query contains distinct specific technical terms absent in context -> refuse.
    """
    if not retrieved_chunks:
        return False, REFUSAL_MESSAGE

    if not answer or not answer.strip():
        return False, INSUFFICIENT_INFO_MESSAGE

    if "not available in the uploaded study material" in answer.lower() or "not available in the university knowledge base" in answer.lower():
        return False, REFUSAL_MESSAGE

    context_text = " ".join([c.get("content", "") for c in retrieved_chunks]).lower()
    if not context_text.strip():
        return False, REFUSAL_MESSAGE

    # Query term verification
    query_keywords = extract_keywords(query)
    if query_keywords:
        matched_q_terms = [w for w in query_keywords if w in context_text or w.rstrip('s') in context_text]
        # If query has specific nouns and NONE exist in context -> strict refusal
        if len(query_keywords) >= 1 and len(matched_q_terms) == 0:
            return False, REFUSAL_MESSAGE

    return True, answer
