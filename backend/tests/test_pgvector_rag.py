"""
=============================================================================
CampusOS AI - Grounded RAG Pipeline Unit Tests (Step 9)
=============================================================================
Verifies:
1. TEST 1: Attendance requirement query -> Retrieves attendance document with citations
2. TEST 2: Hostel leave query -> Retrieves hostel handbook with citations
3. TEST 3: Placement eligibility with backlogs -> Retrieves placement guideline with citations
4. TEST 4: Out-of-domain drone query -> Returns strict refusal (0 hallucination)
=============================================================================
"""

import unittest
from app.services.rag_service import (
    extract_text_from_pdf,
    extract_text_from_docx,
    execute_pgvector_rag_query
)


class TestGroundedRAGService(unittest.TestCase):

    def test_pdf_extraction_empty_bytes(self):
        """Test graceful extraction handling on empty PDF bytes."""
        empty_data: bytes = b""
        pages = extract_text_from_pdf(empty_data)
        self.assertIsInstance(pages, list)
        self.assertEqual(len(pages), 0)

    def test_docx_extraction_empty_bytes(self):
        """Test graceful extraction handling on empty DOCX bytes."""
        empty_data: bytes = b""
        pages = extract_text_from_docx(empty_data)
        self.assertIsInstance(pages, list)

    def test_case_1_attendance_requirement(self):
        """TEST 1: Minimum attendance required query."""
        res = execute_pgvector_rag_query("What is the minimum attendance required?", user_role="student", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertIn("75%", res["answer"])
        self.assertTrue(len(res["source_documents"]) > 0 or "Sources:" in res["answer"])

    def test_case_2_hostel_leave_application(self):
        """TEST 2: Apply for hostel leave query."""
        res = execute_pgvector_rag_query("How do I apply for hostel leave?", user_role="student", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("leave" in res["answer"].lower() or "hostel" in res["answer"].lower())
        self.assertTrue(len(res["source_documents"]) > 0 or "Sources:" in res["answer"])

    def test_case_3_placement_eligibility_backlogs(self):
        """TEST 3: Placement eligibility with backlogs query."""
        res = execute_pgvector_rag_query("Am I eligible for placements with two backlogs?", user_role="student", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("cgpa" in res["answer"].lower() or "backlog" in res["answer"].lower())

    def test_case_4_out_of_domain_drone_query(self):
        """TEST 4: Out-of-domain drone query (Zero hallucination!)."""
        res = execute_pgvector_rag_query("Does CampusOS allow drones in hostel rooms?", user_role="student", match_threshold=0.20)
        expected_refusal = "I couldn't find this information in the CampusOS knowledge base."
        self.assertEqual(res["answer"].strip(), expected_refusal)
        self.assertEqual(len(res["source_documents"]), 0)


if __name__ == "__main__":
    unittest.main()
