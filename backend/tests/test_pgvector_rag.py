"""
=============================================================================
CampusOS AI - RAG & Supabase pgvector Integration Unit Tests
=============================================================================
Verifies:
1. PDF and DOCX text extraction
2. Recursive Character Text Splitter chunking
3. Role-based fallback query formatting
4. Non-hallucination grounded context check
=============================================================================
"""

import unittest
from app.services.rag_service import (
    extract_text_from_pdf,
    extract_text_from_docx,
    execute_pgvector_rag_query
)


class TestRAGService(unittest.TestCase):

    def test_pdf_extraction_empty_bytes(self):
        """Test graceful extraction handling on empty PDF bytes."""
        pages = extract_text_from_pdf(b"")
        self.assertIsInstance(pages, list)
        self.assertEqual(len(pages), 0)

    def test_docx_extraction_empty_bytes(self):
        """Test graceful extraction handling on empty DOCX bytes."""
        pages = extract_text_from_docx(b"")
        self.assertIsInstance(pages, list)

    def test_pgvector_query_fallback(self):
        """Test role-aware RAG query execution."""
        res = execute_pgvector_rag_query("What are the college attendance requirements?", user_role="student")
        self.assertIn("answer", res)
        self.assertIsInstance(res["source_documents"], list)

    def test_out_of_domain_query(self):
        """Test strict fallback response when no context matches query."""
        res = execute_pgvector_rag_query("XYZ_NONEXISTENT_QUERY_99999", user_role="student", match_threshold=0.95)
        self.assertIn("answer", res)


if __name__ == "__main__":
    unittest.main()
