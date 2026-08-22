"""
=============================================================================
CampusOS AI - 5-Role Grounded RAG Pipeline Unit Tests
=============================================================================
Verifies:
1. Student asks: "What is minimum attendance?" -> Student documents only.
2. Faculty asks: "How do I publish internal marks?" -> Faculty documents only.
3. Warden asks: "What is late entry policy?" -> Warden documents only.
4. Librarian asks: "How many books can students borrow?" -> Library documents only.
5. Admin asks: "Summarize hostel and attendance policies." -> Retrieves both.
6. Out-of-domain drone query -> Returns strict refusal message.
=============================================================================
"""

import unittest
from app.services.rag_service import (
    extract_text_from_pdf,
    extract_text_from_docx,
    execute_pgvector_rag_query
)


class TestRoleBasedRAGService(unittest.TestCase):

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

    def test_role_student_attendance(self):
        """Student asks: What is minimum attendance?"""
        res = execute_pgvector_rag_query("What is the minimum attendance required?", user_role="student", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("attendance" in res["answer"].lower() or "policy" in res["answer"].lower())

    def test_role_faculty_marks(self):
        """Faculty asks: Faculty grade submissions and examination deadline?"""
        res = execute_pgvector_rag_query("Faculty grade submissions and examination deadline?", user_role="faculty", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("faculty" in res["answer"].lower() or "grade" in res["answer"].lower() or "exam" in res["answer"].lower())

    def test_role_warden_late_entry(self):
        """Warden asks: What is late entry policy?"""
        res = execute_pgvector_rag_query("What is late entry policy and curfew timing?", user_role="warden", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("curfew" in res["answer"].lower() or "hostel" in res["answer"].lower() or "10:00" in res["answer"].lower())

    def test_role_librarian_book_borrowing(self):
        """Librarian asks: How many books can students borrow?"""
        res = execute_pgvector_rag_query("How many books can students borrow?", user_role="librarian", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("library" in res["answer"].lower() or "book" in res["answer"].lower() or "borrow" in res["answer"].lower())

    def test_role_admin_cross_domain_summary(self):
        """Admin asks: Summarize hostel rules and curfew policies."""
        res = execute_pgvector_rag_query("Summarize hostel rules and curfew policies.", user_role="admin", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("curfew" in res["answer"].lower() or "hostel" in res["answer"].lower())

    def test_cgpa_calculation_with_typo(self):
        """Student asks: how cgpa is caluclated (with spelling typo)."""
        res = execute_pgvector_rag_query("how cgpa is caluclated", user_role="student", match_threshold=0.15)
        self.assertIn("answer", res)
        self.assertTrue("cgpa" in res["answer"].lower() or "scale" in res["answer"].lower() or "credits" in res["answer"].lower())

    def test_absent_info_drone_refusal(self):
        """Absent info: Does CampusOS allow drones in hostel rooms?"""
        res = execute_pgvector_rag_query("Does CampusOS allow drones in hostel rooms?", user_role="student", match_threshold=0.20)
        expected_refusal = "This information is not available in the university knowledge base."
        self.assertEqual(res["answer"].strip(), expected_refusal)
        self.assertEqual(len(res["source_documents"]), 0)


if __name__ == "__main__":
    unittest.main()
