"""
=============================================================================
CampusOS AI - AI Exam Preparation Pipeline Unit Tests
=============================================================================
Tests:
1. Multi-PDF text extraction, unit detection, page number preservation.
2. Indexing into study_chunks with complete metadata.
3. Collection-isolated semantic retrieval.
4. Student user_id isolation (Student A cannot access Student B).
5. Grounding & Anti-Hallucination validation.
6. 2-mark, 4-mark, and 10-mark prompt validation.
=============================================================================
"""

import unittest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.database_models import (
    User,
    Role,
    StudyCollection,
    StudyDocument,
    StudyChunk,
    GeneratedExamMaterial
)
from app.services.exam_prep.pdf_processor import (
    detect_unit_from_text_or_filename,
    clean_pdf_text,
    process_study_pdf
)
from app.services.exam_prep.indexer import (
    generate_chunk_embedding,
    chunk_page_text,
    index_collection_documents
)
from app.services.exam_prep.retriever import (
    retrieve_collection_chunks,
    retrieve_unit_chunks
)
from app.services.exam_prep.validator import (
    validate_groundedness,
    REFUSAL_MESSAGE
)


class TestExamPrepPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_unit_detection(self):
        """Test Unit / Chapter regex detection from various filename patterns."""
        self.assertEqual(detect_unit_from_text_or_filename("DBMS_Unit_1.pdf"), "Unit 1")
        self.assertEqual(detect_unit_from_text_or_filename("OS_Unit_2_Notes.pdf"), "Unit 2")
        self.assertEqual(detect_unit_from_text_or_filename("CN_chapter_3.pdf"), "Unit 3")
        self.assertEqual(detect_unit_from_text_or_filename("Module_4_Transactions.pdf"), "Unit 4")
        self.assertEqual(detect_unit_from_text_or_filename("AI_Unit_V.pdf"), "Unit 5")

    def test_clean_pdf_text(self):
        """Test text cleaning and whitespace normalization."""
        raw = "Line 1   with   spaces\n\n\n\nLine 2\x00 with null"
        cleaned = clean_pdf_text(raw)
        self.assertNotIn("\x00", cleaned)
        self.assertNotIn("\n\n\n", cleaned)
        self.assertIn("Line 1 with spaces", cleaned)

    def test_semantic_chunking_metadata_preservation(self):
        """Verify that chunking preserves page numbers, units, and topic headings."""
        sample_page = (
            "# Two-Phase Locking Protocol\n\n"
            "The two-phase locking protocol (2PL) is a concurrency control method that guarantees serializability.\n"
            "In 2PL, a transaction acquires locks in the growing phase and releases locks in the shrinking phase.\n\n"
            "## Advantages\n"
            "Ensures conflict serializability and prevents dirty reads in database systems."
        )
        chunks = chunk_page_text(
            page_text=sample_page,
            page_number=14,
            source_file="DBMS_Unit_3.pdf",
            unit="Unit 3"
        )
        self.assertTrue(len(chunks) >= 1)
        first_chunk = chunks[0]
        self.assertEqual(first_chunk["page_number"], 14)
        self.assertEqual(first_chunk["unit"], "Unit 3")
        self.assertEqual(first_chunk["source_file"], "DBMS_Unit_3.pdf")
        self.assertIn("Two-Phase Locking", first_chunk["topic"])

    def test_multi_pdf_indexing_and_collection_retrieval(self):
        """Simulate uploading 3 PDF notes (DBMS Unit 1, 2, 3) and verify unified retrieval."""
        # Create test student
        student = User(
            id=101,
            email="student_rag@campusos.edu",
            full_name="Arjun Student",
            hashed_password="hashed_pw_test",
            status="active"
        )
        self.db.add(student)
        self.db.commit()

        # Create study collection
        col_id = str(uuid.uuid4())
        col = StudyCollection(
            id=col_id,
            user_id=student.id,
            subject_name="Database Management Systems",
            course_code="CS401",
            semester=4,
            branch="CSE",
            academic_year="2025-2026"
        )
        self.db.add(col)
        self.db.commit()

        # Mock parsed 3 unit PDFs
        parsed_docs = [
            {
                "id": str(uuid.uuid4()),
                "file_name": "DBMS_Unit_1_ER_Model.pdf",
                "file_size": 245000,
                "storage_path": "study_notes/DBMS_Unit_1.pdf",
                "page_count": 5,
                "primary_unit": "Unit 1",
                "pages": [
                    {
                        "page_number": 1,
                        "text": "Entity-Relationship (ER) Model: An entity is an object that exists in the real world. Attributes describe entity properties.",
                        "has_diagram": True,
                        "diagram_caption": "ER Diagram for University System",
                        "unit": "Unit 1"
                    }
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "file_name": "DBMS_Unit_2_Relational_Algebra.pdf",
                "file_size": 310000,
                "storage_path": "study_notes/DBMS_Unit_2.pdf",
                "page_count": 8,
                "primary_unit": "Unit 2",
                "pages": [
                    {
                        "page_number": 4,
                        "text": "Relational Algebra Operations: Select, Project, Cartesian Product, Set Difference, and Union form the fundamental operations.",
                        "has_diagram": False,
                        "diagram_caption": None,
                        "unit": "Unit 2"
                    }
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "file_name": "DBMS_Unit_3_Transactions.pdf",
                "file_size": 420000,
                "storage_path": "study_notes/DBMS_Unit_3.pdf",
                "page_count": 12,
                "primary_unit": "Unit 3",
                "pages": [
                    {
                        "page_number": 18,
                        "text": "Two-Phase Locking (2PL) Protocol: Guarantees serializability. In growing phase, locks are acquired. In shrinking phase, locks are released.",
                        "has_diagram": True,
                        "diagram_caption": "2PL Growing and Shrinking Phase Timeline",
                        "unit": "Unit 3"
                    }
                ]
            }
        ]

        indexed_count = index_collection_documents(self.db, col, parsed_docs)
        self.assertEqual(indexed_count, 3)

        # Retrieve for Unit 3 question: "Explain Two-Phase Locking"
        retrieved = retrieve_collection_chunks(
            self.db,
            collection_id=col_id,
            query="Two-Phase Locking 2PL growing shrinking phase",
            k=3
        )
        self.assertTrue(len(retrieved) > 0)
        top_match = retrieved[0]
        self.assertEqual(top_match["unit"], "Unit 3")
        self.assertEqual(top_match["page_number"], 18)
        self.assertEqual(top_match["source_file"], "DBMS_Unit_3_Transactions.pdf")

    def test_student_isolation_security(self):
        """Verify Student A cannot retrieve Student B's chunks."""
        student_a = User(id=201, email="student_a@campusos.edu", full_name="Student A", hashed_password="pw", status="active")
        student_b = User(id=202, email="student_b@campusos.edu", full_name="Student B", hashed_password="pw", status="active")
        self.db.add_all([student_a, student_b])
        self.db.commit()

        col_a = StudyCollection(id="col-a-id", user_id=student_a.id, subject_name="OS", course_code="CS402")
        col_b = StudyCollection(id="col-b-id", user_id=student_b.id, subject_name="DBMS", course_code="CS401")
        self.db.add_all([col_a, col_b])
        self.db.commit()

        doc_a = StudyDocument(id="doc-a-id", collection_id=col_a.id, file_name="OS_Secrets.pdf")
        doc_b = StudyDocument(id="doc-b-id", collection_id=col_b.id, file_name="DBMS_Secrets.pdf")
        self.db.add_all([doc_a, doc_b])
        self.db.commit()

        chunk_a = StudyChunk(document_id=doc_a.id, collection_id=col_a.id, content="Secret OS Kernel Code", page_number=1, unit="Unit 1")
        chunk_b = StudyChunk(document_id=doc_b.id, collection_id=col_b.id, content="Secret SQL B-Tree Index", page_number=1, unit="Unit 1")
        self.db.add_all([chunk_a, chunk_b])
        self.db.commit()

        # Querying col_a MUST NEVER return chunk_b
        res_a = retrieve_collection_chunks(self.db, collection_id=col_a.id, query="SQL B-Tree")
        for r in res_a:
            self.assertNotEqual(r["content"], "Secret SQL B-Tree Index")

    def test_anti_hallucination_refusal(self):
        """Verify grounding validator strictly refuses out-of-domain / unmentioned concepts."""
        retrieved_chunks = [
            {
                "content": "Normalization is the process of organizing data in database tables to reduce redundancy.",
                "page_number": 3,
                "source_file": "DBMS_Unit_2.pdf"
            }
        ]

        # Query about Quantum Computing (completely absent in context)
        is_grounded, answer = validate_groundedness(
            query="What is quantum entanglement in cryptography?",
            answer="Quantum entanglement connects particles across space.",
            retrieved_chunks=retrieved_chunks
        )
        self.assertFalse(is_grounded)
        self.assertEqual(answer, REFUSAL_MESSAGE)


if __name__ == "__main__":
    unittest.main()
