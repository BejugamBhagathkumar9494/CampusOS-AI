from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.database_models import StudyRepository
from app.services.repodna.repodna_indexer import retrieve_repository_chunks
from app.services.repodna.prompts import REPODNA_CHAT_PROMPT_TEMPLATE, REPODNA_SYSTEM_INSTRUCTION
from app.services.repodna.validator import validate_repository_grounding, REFUSAL_MESSAGE
from app.api.v1.ai import call_gemini_llm, resolve_gemini_api_key


def answer_repository_query(
    db: Session,
    repository: StudyRepository,
    question: str
) -> Dict[str, Any]:
    """
    Answers a student question grounded strictly in the repository's analyzed files.
    """
    if not question or not question.strip():
        return {
            "answer": "Please provide a question about this repository.",
            "sources": [],
            "confidence": 1.0
        }

    # 1. Scoped vector retrieval
    retrieved = retrieve_repository_chunks(db, repository.id, question, k=5)
    if not retrieved:
        return {
            "answer": REFUSAL_MESSAGE,
            "sources": [],
            "confidence": 0.0
        }

    # Format chunks
    chunks_text = "\n\n".join([
        f"--- File: {r['file_path']} ---\n{r['content']}"
        for r in retrieved
    ])

    prompt = REPODNA_CHAT_PROMPT_TEMPLATE.format(
        owner=repository.owner,
        repo_name=repository.repo_name,
        retrieved_chunks=chunks_text,
        question=question
    )

    answer_text = ""
    try:
        api_key = resolve_gemini_api_key()
        if api_key:
            answer_text = call_gemini_llm(prompt, system_instruction=REPODNA_SYSTEM_INSTRUCTION)
    except Exception as e:
        print(f"[RepoDNA Chat] LLM query error: {e}")

    if not answer_text or not answer_text.strip():
        # Fallback to direct chunk quote
        top_match = retrieved[0]
        answer_text = f"Based on `{top_match['file_path']}`:\n\n{top_match['content'][:450]}..."

    # Extract unique source files
    source_files = list(dict.fromkeys([r["file_path"] for r in retrieved]))

    # Grounding check
    is_grounded, final_answer = validate_repository_grounding(
        answer=answer_text,
        retrieved_chunks=retrieved,
        all_file_paths=source_files
    )

    return {
        "answer": final_answer,
        "sources": [{"file_path": sf} for sf in source_files[:4]],
        "confidence": 0.95 if is_grounded else 0.0
    }
