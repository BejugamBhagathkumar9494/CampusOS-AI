"""
CampusOS AI - Exam Preparation Engine
Multi-PDF Ingestion, Grounded pgvector RAG, and University Exam Generator
"""

from .pdf_processor import process_study_pdf, detect_unit_from_text_or_filename
from .indexer import index_collection_documents, generate_chunk_embedding
from .retriever import retrieve_collection_chunks, retrieve_unit_chunks
from .generator import generate_complete_exam_material, answer_subject_query
from .validator import validate_groundedness

__all__ = [
    "process_study_pdf",
    "detect_unit_from_text_or_filename",
    "index_collection_documents",
    "generate_chunk_embedding",
    "retrieve_collection_chunks",
    "retrieve_unit_chunks",
    "generate_complete_exam_material",
    "answer_subject_query",
    "validate_groundedness"
]
