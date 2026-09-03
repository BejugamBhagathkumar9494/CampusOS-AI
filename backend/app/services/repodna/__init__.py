"""
CampusOS AI - RepoDNA Service Package
AI-Powered GitHub Repository Intelligence & Codebase RAG
"""

from .github_scanner import parse_github_url, fetch_github_repository, filter_relevant_files
from .code_extractor import extract_code_metadata
from .tech_detector import detect_technologies_from_files
from .repodna_indexer import index_repository_files, retrieve_repository_chunks
from .repodna_generator import analyze_repository_pipeline
from .repodna_chat import answer_repository_query

__all__ = [
    "parse_github_url",
    "fetch_github_repository",
    "filter_relevant_files",
    "extract_code_metadata",
    "detect_technologies_from_files",
    "index_repository_files",
    "retrieve_repository_chunks",
    "analyze_repository_pipeline",
    "answer_repository_query"
]
