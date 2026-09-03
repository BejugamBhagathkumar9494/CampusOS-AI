import json
import re
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from app.models.database_models import StudyCollection, GeneratedExamMaterial, StudyChunk
from .retriever import retrieve_collection_chunks, retrieve_unit_chunks
from .validator import validate_groundedness, REFUSAL_MESSAGE, INSUFFICIENT_INFO_MESSAGE
from .prompts import (
    ANTI_HALLUCINATION_CORE,
    SUMMARY_PROMPT_TEMPLATE,
    TWO_MARK_PROMPT_TEMPLATE,
    FOUR_MARK_PROMPT_TEMPLATE,
    TEN_MARK_PROMPT_TEMPLATE,
    IMPORTANT_QUESTIONS_PROMPT_TEMPLATE,
    REVISION_PROMPT_TEMPLATE,
    COLLECTION_CHAT_PROMPT_TEMPLATE
)


def get_gemini_api_key() -> str:
    from app.api.v1.ai import resolve_gemini_api_key
    return resolve_gemini_api_key()


async def call_gemini_prompt(prompt_text: str, temperature: float = 0.2) -> str:
    """Invokes Gemini LLM with robust retry and model fallbacks."""
    key = get_gemini_api_key()
    candidate_models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"]
    
    # Try official google-genai SDK first
    try:
        from google import genai
        client = genai.Client(api_key=key)
        for model in candidate_models:
            try:
                res = client.models.generate_content(
                    model=model,
                    contents=prompt_text,
                )
                if res and hasattr(res, "text") and res.text:
                    return res.text.strip()
            except Exception as e:
                print(f"[Gemini SDK] Model {model} attempt error: {e}")
    except Exception:
        pass

    # Fallback to direct HTTP endpoint
    async with httpx.AsyncClient(timeout=25.0) as http_client:
        for model in candidate_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
                res = await http_client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt_text}]}],
                        "generationConfig": {"temperature": temperature}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
            except Exception as http_err:
                print(f"[Gemini HTTP] Model {model} attempt error: {http_err}")

    raise RuntimeError("Failed to generate content from Gemini API.")


def clean_json_response(raw_text: str) -> str:
    """Strips markdown code fence wrappers from JSON output."""
    raw = raw_text.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()


async def generate_unit_summary(
    db: Session,
    collection: StudyCollection,
    unit: str,
    chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generates complete chapter summary for a unit from its chunks."""
    context = "\n\n".join([f"[{c.get('source_file')} - Page {c.get('page_number')}]:\n{c.get('content')}" for c in chunks])
    sample_file = chunks[0].get("source_file", "Notes.pdf") if chunks else "Notes.pdf"
    sample_page = chunks[0].get("page_number", 1) if chunks else 1

    prompt = SUMMARY_PROMPT_TEMPLATE.format(
        unit=unit,
        subject_name=collection.subject_name,
        course_code=collection.course_code,
        anti_hallucination=ANTI_HALLUCINATION_CORE,
        context=context,
        sample_file=sample_file,
        sample_page=sample_page
    )

    try:
        summary_text = await call_gemini_prompt(prompt, temperature=0.2)
    except Exception as e:
        summary_text = f"## {unit} - {collection.subject_name}\n\n### Summary\n" + "\n".join([f"- {c['content'][:200]}..." for c in chunks[:4]])

    # Sources collection
    sources = []
    seen_sources = set()
    for c in chunks:
        key = (c.get("source_file"), c.get("page_number"))
        if key not in seen_sources:
            seen_sources.add(key)
            sources.append({"file_name": c.get("source_file"), "page_number": c.get("page_number")})

    mat = GeneratedExamMaterial(
        collection_id=collection.id,
        material_type="summary",
        question=f"Complete Chapter Summary - {unit}",
        answer=summary_text,
        marks=0,
        unit=unit,
        topic=f"{unit} Comprehensive Summary",
        sources=json.dumps(sources)
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)

    return {
        "id": mat.id,
        "type": "summary",
        "unit": unit,
        "title": f"Complete Chapter Summary - {unit}",
        "content": summary_text,
        "sources": sources
    }


async def generate_unit_questions(
    db: Session,
    collection: StudyCollection,
    unit: str,
    chunks: List[Dict[str, Any]],
    marks: int,
    count: int = 3
) -> List[Dict[str, Any]]:
    """Generates 2-mark, 4-mark, or 10-mark questions with model answers."""
    context = "\n\n".join([f"[{c.get('source_file')} - Page {c.get('page_number')}]:\n{c.get('content')}" for c in chunks])

    if marks == 2:
        template = TWO_MARK_PROMPT_TEMPLATE
    elif marks == 4:
        template = FOUR_MARK_PROMPT_TEMPLATE
    else:
        template = TEN_MARK_PROMPT_TEMPLATE

    prompt = template.format(
        count=count,
        unit=unit,
        subject_name=collection.subject_name,
        course_code=collection.course_code,
        anti_hallucination=ANTI_HALLUCINATION_CORE,
        context=context
    )

    created_records = []
    try:
        raw_json_str = await call_gemini_prompt(prompt, temperature=0.2)
        cleaned_json = clean_json_response(raw_json_str)
        q_list = json.loads(cleaned_json)
        if not isinstance(q_list, list):
            q_list = [q_list]
    except Exception as parse_err:
        print(f"[Question Generator] JSON parse error for {marks} marks: {parse_err}")
        # Deterministic fallback extracted directly from chunks
        topic_name = chunks[0].get("topic", f"{unit} Core Concepts") if chunks else f"{unit} Core Concepts"
        q_list = [{
            "question": f"Explain {topic_name} in the context of {collection.subject_name}.",
            "marks": marks,
            "unit": unit,
            "topic": topic_name,
            "answer": f"Definition & Core Principles:\n\n" + "\n\n".join([f"• {c['content']}" for c in chunks[:2]]),
            "keywords": [collection.subject_name, unit, topic_name],
            "sources": [{"file_name": chunks[0].get("source_file"), "page_number": chunks[0].get("page_number")}] if chunks else []
        }]

    mat_type = f"{marks}_mark"
    for q in q_list:
        sources_list = q.get("sources", [])
        if not sources_list and chunks:
            sources_list = [{"file_name": chunks[0].get("source_file"), "page_number": chunks[0].get("page_number")}]

        diagram_info_obj = q.get("diagram_info", {})

        mat = GeneratedExamMaterial(
            collection_id=collection.id,
            material_type=mat_type,
            question=q.get("question"),
            answer=q.get("answer"),
            marks=marks,
            unit=unit,
            topic=q.get("topic", "General"),
            keywords=json.dumps(q.get("keywords", [])),
            diagram_info=json.dumps(diagram_info_obj),
            sources=json.dumps(sources_list)
        )
        db.add(mat)
        created_records.append({
            "id": None,
            "material_type": mat_type,
            "question": q.get("question"),
            "answer": q.get("answer"),
            "marks": marks,
            "unit": unit,
            "topic": q.get("topic", "General"),
            "keywords": q.get("keywords", []),
            "diagram_info": diagram_info_obj,
            "sources": sources_list
        })

    db.commit()
    return created_records


async def generate_important_questions_and_revision(
    db: Session,
    collection: StudyCollection,
    all_chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generates prioritized Important Questions and Revision Sheets for the entire subject."""
    context = "\n\n".join([f"[{c.get('unit')} | {c.get('source_file')} - Page {c.get('page_number')}]:\n{c.get('content')}" for c in all_chunks[:25]])

    # 1. Important Questions
    imp_prompt = IMPORTANT_QUESTIONS_PROMPT_TEMPLATE.format(
        subject_name=collection.subject_name,
        course_code=collection.course_code,
        anti_hallucination=ANTI_HALLUCINATION_CORE,
        context=context,
        unit="All Units"
    )

    try:
        imp_raw = await call_gemini_prompt(imp_prompt, temperature=0.2)
        imp_json = clean_json_response(imp_raw)
        imp_list = json.loads(imp_json)
        if not isinstance(imp_list, list):
            imp_list = [imp_list]
    except Exception:
        imp_list = []

    for idx, item in enumerate(imp_list, 1):
        mat = GeneratedExamMaterial(
            collection_id=collection.id,
            material_type="important_q",
            question=item.get("question"),
            answer=item.get("priority_reason", "High priority based on the uploaded study material."),
            marks=item.get("marks", 10),
            unit=item.get("unit", "General"),
            topic=item.get("topic", "Key Concept"),
            keywords=json.dumps(item.get("expected_keywords", [])),
            sources=json.dumps(item.get("sources", [])),
            priority_rank=idx
        )
        db.add(mat)

    # 2. Revision Mode (One-Day and Last-Minute)
    rev_prompt = REVISION_PROMPT_TEMPLATE.format(
        subject_name=collection.subject_name,
        course_code=collection.course_code,
        anti_hallucination=ANTI_HALLUCINATION_CORE,
        context=context,
        unit="All Units"
    )

    try:
        rev_raw = await call_gemini_prompt(rev_prompt, temperature=0.2)
        rev_json = clean_json_response(rev_raw)
        rev_obj = json.loads(rev_json)
    except Exception:
        rev_obj = {
            "one_day_revision": {
                "title": f"One-Day Revision for {collection.subject_name}",
                "units": []
            },
            "last_minute_revision": {
                "title": f"Last-Minute Revision for {collection.subject_name}",
                "essential_points": [c["content"][:150] + "..." for c in all_chunks[:6]],
                "must_know_definitions": [],
                "critical_formulas": [],
                "quick_exam_traps_and_tips": ["Review all unit summaries thoroughly before examination."]
            }
        }

    mat_rev_1 = GeneratedExamMaterial(
        collection_id=collection.id,
        material_type="revision_one_day",
        question="One-Day Revision Sheet",
        answer=json.dumps(rev_obj.get("one_day_revision", {})),
        marks=0,
        unit="All Units",
        topic="One-Day Subject Revision"
    )
    mat_rev_2 = GeneratedExamMaterial(
        collection_id=collection.id,
        material_type="revision_last_minute",
        question="Last-Minute High-Yield Revision Sheet",
        answer=json.dumps(rev_obj.get("last_minute_revision", {})),
        marks=0,
        unit="All Units",
        topic="Last-Minute Revision"
    )
    db.add(mat_rev_1)
    db.add(mat_rev_2)
    db.commit()

    return {
        "important_questions": imp_list,
        "revision": rev_obj
    }


async def generate_complete_exam_material(
    db: Session,
    collection_id: str
) -> Dict[str, Any]:
    """
    High-level orchestrator:
    Processes all uploaded PDFs unit-by-unit as a single unified knowledge collection.
    Generates:
    1. Complete Chapter Summary (per unit)
    2. 2-Mark Questions & Answers (per unit)
    3. 4-Mark Questions & Answers (per unit)
    4. 10-Mark Questions & Answers (per unit)
    5. Important Questions
    6. One-Day Revision & Last-Minute Revision
    """
    collection = db.query(StudyCollection).filter(StudyCollection.id == collection_id).first()
    if not collection:
        raise ValueError("Study collection not found.")

    # Fetch unique units present in chunks
    distinct_units = [
        u[0] for u in db.query(StudyChunk.unit).filter(StudyChunk.collection_id == collection_id).distinct().all()
    ]
    if not distinct_units:
        distinct_units = ["Unit 1"]

    # Delete previous generated materials for this collection to avoid duplicates
    db.query(GeneratedExamMaterial).filter(GeneratedExamMaterial.collection_id == collection_id).delete()
    db.commit()

    summaries = []
    two_marks = []
    four_marks = []
    ten_marks = []

    all_subject_chunks = []

    for unit_name in distinct_units:
        unit_chunks = retrieve_unit_chunks(db, collection_id=collection_id, unit=unit_name, limit=20)
        if not unit_chunks:
            continue
        all_subject_chunks.extend(unit_chunks)

        # 1. Summary
        sum_res = await generate_unit_summary(db, collection, unit_name, unit_chunks)
        summaries.append(sum_res)

        # 2. 2-Mark Questions
        q2 = await generate_unit_questions(db, collection, unit_name, unit_chunks, marks=2, count=3)
        two_marks.extend(q2)

        # 3. 4-Mark Questions
        q4 = await generate_unit_questions(db, collection, unit_name, unit_chunks, marks=4, count=2)
        four_marks.extend(q4)

        # 4. 10-Mark Questions
        q10 = await generate_unit_questions(db, collection, unit_name, unit_chunks, marks=10, count=1)
        ten_marks.extend(q10)

    # 5. Important Questions & Revision Mode
    if not all_subject_chunks:
        all_subject_chunks = retrieve_unit_chunks(db, collection_id=collection_id, unit="Unit 1", limit=30)

    rev_res = await generate_important_questions_and_revision(db, collection, all_subject_chunks)

    return {
        "collection_id": collection_id,
        "subject_name": collection.subject_name,
        "course_code": collection.course_code,
        "units_processed": distinct_units,
        "summaries": summaries,
        "two_mark_questions": two_marks,
        "four_mark_questions": four_marks,
        "ten_mark_questions": ten_marks,
        "important_questions": rev_res.get("important_questions", []),
        "revision": rev_res.get("revision", {})
    }


async def answer_subject_query(
    db: Session,
    collection_id: str,
    question: str,
    marks: Optional[int] = None,
    unit: Optional[str] = None
) -> Dict[str, Any]:
    """
    Answers a student's question against their uploaded subject collection with strict grounding.
    """
    collection = db.query(StudyCollection).filter(StudyCollection.id == collection_id).first()
    if not collection:
        raise ValueError("Study collection not found.")

    # Retrieve relevant chunks
    chunks = retrieve_collection_chunks(db, collection_id=collection_id, query=question, k=6, unit=unit, match_threshold=0.08)

    if not chunks:
        return {
            "answer": REFUSAL_MESSAGE,
            "sources": [],
            "keywords": [],
            "grounded": False
        }

    context = "\n\n".join([f"[{c.get('source_file')} - Page {c.get('page_number')}]:\n{c.get('content')}" for c in chunks])

    user_q_lower = question.lower()
    if "10 mark" in user_q_lower or "10-mark" in user_q_lower or marks == 10:
        target_marks = 10
        extra_inst = "\nProvide a COMPLETE 10-MARK university answer with Introduction, Core Concept, Explanation, Working, Types, Example, Advantages, Limitations, Diagram citations, and Conclusion (~500-800 words)."
    elif "4 mark" in user_q_lower or "4-mark" in user_q_lower or marks == 4:
        target_marks = 4
        extra_inst = "\nProvide a structured 4-MARK university answer with Definition, Explanation, 2-4 Key Points, and Example."
    elif "2 mark" in user_q_lower or "2-mark" in user_q_lower or marks == 2:
        target_marks = 2
        extra_inst = "\nProvide a concise 2-MARK answer with Definition/Direct Answer, Key Point 1, Key Point 2, and exam keywords (3-5 sentences)."
    else:
        target_marks = None
        extra_inst = ""

    prompt = COLLECTION_CHAT_PROMPT_TEMPLATE.format(
        subject_name=collection.subject_name,
        course_code=collection.course_code,
        anti_hallucination=ANTI_HALLUCINATION_CORE,
        context=context,
        question=question + extra_inst
    )

    try:
        raw_answer = await call_gemini_prompt(prompt, temperature=0.2)
    except Exception as e:
        raw_answer = REFUSAL_MESSAGE

    is_grounded, final_answer = validate_groundedness(question, raw_answer, chunks)

    # Gather sources
    sources = []
    seen = set()
    for c in chunks:
        key = (c.get("source_file"), c.get("page_number"))
        if key not in seen:
            seen.add(key)
            sources.append({
                "file_name": c.get("source_file"),
                "page_number": c.get("page_number"),
                "relevance": int(c.get("score", 0.9) * 100)
            })

    # Extract keywords from answer
    keywords = list(set(re.findall(r'\b[A-Z][a-z]{3,}\b', final_answer)))[:6]

    return {
        "question": question,
        "marks": target_marks,
        "answer": final_answer,
        "sources": sources if is_grounded else [],
        "keywords": keywords if is_grounded else [],
        "grounded": is_grounded
    }
