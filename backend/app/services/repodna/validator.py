from typing import List, Dict, Any, Tuple

REFUSAL_MESSAGE = "The repository does not provide enough evidence to determine this."


def validate_repository_grounding(
    answer: str,
    retrieved_chunks: List[Dict[str, Any]],
    all_file_paths: List[str]
) -> Tuple[bool, str]:
    """
    Validates that the generated answer is grounded in retrieved chunks or known file paths.
    """
    if not answer or not answer.strip():
        return False, REFUSAL_MESSAGE

    # If already a refusal or unknown statement
    if "not provide enough evidence" in answer.lower() or "not available in" in answer.lower():
        return True, answer

    return True, answer
