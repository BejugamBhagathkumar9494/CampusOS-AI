import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.rag_service import init_rag_service, execute_pgvector_rag_query, GlobalFAISSRetriever


class TestVectorRAGPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_rag_service()

    def setUp(self):
        self.client = TestClient(app)

    def test_pure_vector_embedding_retrieval(self):
        # Query attendance requirement
        chunks = GlobalFAISSRetriever.retrieve(query="attendance requirement percentage for exams", category="student", k=5, match_threshold=0.20)
        self.assertTrue(len(chunks) > 0)
        self.assertTrue(any("75%" in c["content"] or "attendance" in c["content"].lower() for c in chunks))

    def test_rag_fallback_when_out_of_domain(self):
        res = execute_pgvector_rag_query(query="random quantum thermodynamics formula xyz", user_role="student", match_threshold=0.45)
        self.assertEqual(res["answer"], "This information is not available in the university knowledge base.")
        self.assertEqual(len(res["source_documents"]), 0)

    def test_llm_endpoint_independent_of_rag(self):
        response = self.client.post(
            "/api/v1/ai/chat/llm",
            json={"message": "Write a Python function to find the maximum element in a list."}
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["mode"], "llm")
        self.assertNotIn("sources", json_data)
        self.assertIn("def ", json_data["answer"].lower())

    def test_rag_endpoint_flow(self):
        response = self.client.post(
            "/api/v1/ai/chat/rag",
            json={"message": "What is the hostel curfew timing?", "role": "student"}
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["mode"], "rag")
        self.assertIn("sources", json_data)


if __name__ == "__main__":
    unittest.main()
