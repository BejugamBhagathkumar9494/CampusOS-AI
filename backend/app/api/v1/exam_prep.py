import uuid
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.database_models import (
    User,
    StudyCollection,
    StudyDocument,
    StudyChunk,
    GeneratedExamMaterial
)
from app.services.exam_prep.pdf_processor import process_study_pdf
from app.services.exam_prep.indexer import index_collection_documents
from app.services.exam_prep.generator import generate_complete_exam_material, answer_subject_query

router = APIRouter(prefix="/exam-prep", tags=["AI Exam Preparation"])


# Pydantic Schemas
class CreateCollectionPayload(BaseModel):
    subject_name: str
    course_code: str
    semester: int = 1
    branch: str = "CSE"
    academic_year: str = "2025-2026"


class QueryCollectionPayload(BaseModel):
    collection_id: str
    question: str
    marks: Optional[int] = None
    unit: Optional[str] = None


@router.post("/collections")
def create_study_collection(
    payload: CreateCollectionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new subject study collection with required metadata.
    Enforces student isolation by setting user_id = current_user.id.
    """
    if not payload.subject_name.strip() or not payload.course_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject Name and Course Code are required."
        )

    col_id = str(uuid.uuid4())
    collection = StudyCollection(
        id=col_id,
        user_id=current_user.id,
        subject_name=payload.subject_name.strip(),
        course_code=payload.course_code.strip().upper(),
        semester=payload.semester,
        branch=payload.branch.strip().upper(),
        academic_year=payload.academic_year.strip()
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)

    return {
        "id": collection.id,
        "subject_name": collection.subject_name,
        "course_code": collection.course_code,
        "semester": collection.semester,
        "branch": collection.branch,
        "academic_year": collection.academic_year,
        "created_at": collection.created_at,
        "documents_count": 0
    }


@router.get("/collections")
def get_user_study_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all study collections owned by the authenticated student.
    Strictly user-isolated (Student A never retrieves Student B's collections).
    """
    collections = (
        db.query(StudyCollection)
        .filter(StudyCollection.user_id == current_user.id)
        .order_by(StudyCollection.created_at.desc())
        .all()
    )

    result = []
    for c in collections:
        doc_count = db.query(StudyDocument).filter(StudyDocument.collection_id == c.id).count()
        chunk_count = db.query(StudyChunk).filter(StudyChunk.collection_id == c.id).count()
        has_materials = db.query(GeneratedExamMaterial).filter(GeneratedExamMaterial.collection_id == c.id).first() is not None

        result.append({
            "id": c.id,
            "subject_name": c.subject_name,
            "course_code": c.course_code,
            "semester": c.semester,
            "branch": c.branch,
            "academic_year": c.academic_year,
            "created_at": c.created_at,
            "documents_count": doc_count,
            "chunks_count": chunk_count,
            "has_generated_materials": has_materials
        })

    return result


@router.get("/collections/{collection_id}")
def get_study_collection_detail(
    collection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches detailed metadata, uploaded files status, and unit breakdown for a collection.
    """
    collection = db.query(StudyCollection).filter(
        StudyCollection.id == collection_id,
        StudyCollection.user_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Study collection not found or unauthorized access.")

    docs = db.query(StudyDocument).filter(StudyDocument.collection_id == collection.id).all()
    docs_data = []
    for d in docs:
        docs_data.append({
            "id": d.id,
            "file_name": d.file_name,
            "file_size_bytes": d.file_size_bytes,
            "page_count": d.page_count,
            "unit_detected": d.unit_detected,
            "processing_status": d.processing_status,
            "created_at": d.created_at
        })

    return {
        "id": collection.id,
        "subject_name": collection.subject_name,
        "course_code": collection.course_code,
        "semester": collection.semester,
        "branch": collection.branch,
        "academic_year": collection.academic_year,
        "created_at": collection.created_at,
        "documents": docs_data
    }


@router.delete("/collections/{collection_id}")
def delete_study_collection(
    collection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a study collection and all associated files, chunks, and notes."""
    collection = db.query(StudyCollection).filter(
        StudyCollection.id == collection_id,
        StudyCollection.user_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Study collection not found or unauthorized access.")

    db.delete(collection)
    db.commit()
    return {"status": "success", "message": f"Deleted collection '{collection.subject_name}'"}


@router.post("/collections/{collection_id}/upload")
async def upload_multiple_study_pdfs(
    collection_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Multi-PDF Ingestion Pipeline:
    Uploads multiple B.Tech PDF notes (e.g. Unit 1, Unit 2, Unit 3...),
    extracts text, detects units & diagrams, chunks content, and stores pgvector embeddings.
    Treats all uploaded PDFs as a SINGLE unified knowledge collection.
    """
    collection = db.query(StudyCollection).filter(
        StudyCollection.id == collection_id,
        StudyCollection.user_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Study collection not found or unauthorized access.")

    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No PDF files provided.")

    parsed_docs = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue

        doc_id = str(uuid.uuid4())
        content_bytes = await file.read()
        
        parsed_doc = process_study_pdf(file.filename, content_bytes)
        parsed_doc["id"] = doc_id
        parsed_doc["storage_path"] = f"study_notes/{current_user.id}/{collection.id}/{file.filename}"
        parsed_docs.append(parsed_doc)

    if not parsed_docs:
        raise HTTPException(status_code=400, detail="Please upload valid PDF files.")

    indexed_chunks = index_collection_documents(db, collection, parsed_docs)

    return {
        "status": "success",
        "collection_id": collection.id,
        "subject_name": collection.subject_name,
        "files_uploaded_count": len(parsed_docs),
        "total_chunks_indexed": indexed_chunks,
        "files": [
            {
                "id": d["id"],
                "file_name": d["file_name"],
                "page_count": d["page_count"],
                "primary_unit": d["primary_unit"],
                "status": "processed"
            }
            for d in parsed_docs
        ]
    }


@router.post("/collections/{collection_id}/generate")
async def generate_exam_notes_endpoint(
    collection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI analyzes the entire uploaded lesson set and generates:
    1. Complete Summary (unit-by-unit)
    2. 2-Mark Questions & Answers
    3. 4-Mark Questions & Answers
    4. 10-Mark Questions & Answers
    5. Important Questions
    6. Revision Sheets (One-Day & Last-Minute)
    """
    collection = db.query(StudyCollection).filter(
        StudyCollection.id == collection_id,
        StudyCollection.user_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Study collection not found or unauthorized access.")

    chunk_count = db.query(StudyChunk).filter(StudyChunk.collection_id == collection.id).count()
    if chunk_count == 0:
        raise HTTPException(
            status_code=400,
            detail="No study PDF notes found in this collection. Please upload notes first."
        )

    try:
        res = await generate_complete_exam_material(db, collection_id)
        return {
            "status": "success",
            "message": f"Successfully generated exam preparation notes for '{collection.subject_name}'.",
            "data": res
        }
    except Exception as e:
        print(f"[Exam Gen Error]: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate exam material: {str(e)}"
        )


@router.get("/collections/{collection_id}/materials")
def get_collection_generated_materials(
    collection_id: str,
    material_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all generated exam preparation materials grouped by category.
    """
    collection = db.query(StudyCollection).filter(
        StudyCollection.id == collection_id,
        StudyCollection.user_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Study collection not found or unauthorized access.")

    q = db.query(GeneratedExamMaterial).filter(GeneratedExamMaterial.collection_id == collection_id)
    if material_type:
        q = q.filter(GeneratedExamMaterial.material_type == material_type)

    materials = q.order_by(GeneratedExamMaterial.unit.asc(), GeneratedExamMaterial.id.asc()).all()

    grouped: Dict[str, Any] = {
        "summaries": [],
        "two_mark_questions": [],
        "four_mark_questions": [],
        "ten_mark_questions": [],
        "important_questions": [],
        "one_day_revision": None,
        "last_minute_revision": None
    }

    for m in materials:
        sources = []
        if m.sources:
            try:
                sources = json.loads(m.sources)
            except Exception:
                sources = []

        keywords = []
        if m.keywords:
            try:
                keywords = json.loads(m.keywords)
            except Exception:
                keywords = [k.strip() for k in m.keywords.split(",") if k.strip()]

        diagram_info = {}
        if m.diagram_info:
            try:
                diagram_info = json.loads(m.diagram_info)
            except Exception:
                diagram_info = {}

        item = {
            "id": m.id,
            "material_type": m.material_type,
            "question": m.question,
            "answer": m.answer,
            "marks": m.marks,
            "unit": m.unit,
            "topic": m.topic,
            "keywords": keywords,
            "diagram_info": diagram_info,
            "sources": sources,
            "priority_rank": m.priority_rank
        }

        if m.material_type == "summary":
            grouped["summaries"].append(item)
        elif m.material_type == "2_mark":
            grouped["two_mark_questions"].append(item)
        elif m.material_type == "4_mark":
            grouped["four_mark_questions"].append(item)
        elif m.material_type == "10_mark":
            grouped["ten_mark_questions"].append(item)
        elif m.material_type == "important_q":
            grouped["important_questions"].append(item)
        elif m.material_type == "revision_one_day":
            try:
                grouped["one_day_revision"] = json.loads(m.answer)
            except Exception:
                grouped["one_day_revision"] = m.answer
        elif m.material_type == "revision_last_minute":
            try:
                grouped["last_minute_revision"] = json.loads(m.answer)
            except Exception:
                grouped["last_minute_revision"] = m.answer

    return {
        "collection_id": collection.id,
        "subject_name": collection.subject_name,
        "course_code": collection.course_code,
        "materials": grouped
    }


@router.post("/query")
async def ask_study_collection_query(
    payload: QueryCollectionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ask AI questions strictly grounded in the student's uploaded subject collection notes.
    """
    collection = db.query(StudyCollection).filter(
        StudyCollection.id == payload.collection_id,
        StudyCollection.user_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Study collection not found or unauthorized access.")

    res = await answer_subject_query(
        db=db,
        collection_id=collection.id,
        question=payload.question,
        marks=payload.marks,
        unit=payload.unit
    )

    return res
