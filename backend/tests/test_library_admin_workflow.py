import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import Book, User


class TestLibraryAdminApprovalWorkflow(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Login as superadmin to get token for elevated role endpoints
        res = self.client.post(
            "/api/v1/auth/login",
            data={"username": "superadmin@campus.edu", "password": "superadmin123"}
        )
        self.assertEqual(res.status_code, 200)
        self.admin_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

        # Login as student to get student token
        s_res = self.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.student@campus.edu", "password": "rahul123"}
        )
        self.assertEqual(s_res.status_code, 200)
        self.student_headers = {"Authorization": f"Bearer {s_res.json()['access_token']}"}

    def tearDown(self):
        self.db.close()

    def test_student_request_and_admin_approval_workflow(self):
        title = "Deep Learning with PyTorch 2026 Edition"
        author = "Dr. Ian Goodfellow"

        # 1. Student submits a request for a new book/paper
        req_res = self.client.post(
            "/api/v1/library/request",
            json={
                "title": title,
                "author": author,
                "category": "Research Paper",
                "isbn_or_link": "978-0123456789",
                "reason": "Needed for final year AI thesis research"
            },
            headers=self.student_headers
        )
        self.assertEqual(req_res.status_code, 200)
        req_id = req_res.json()["request"]["id"]

        # 2. Admin fetches pending requests
        list_res = self.client.get(
            "/api/v1/library/requests",
            headers=self.admin_headers
        )
        self.assertEqual(list_res.status_code, 200)
        requests = list_res.json()["requests"]
        matched = next((r for r in requests if r["id"] == req_id), None)
        self.assertIsNotNone(matched)
        self.assertEqual(matched["status"], "pending_approval")

        # 3. Admin approves request and adds book to DB catalog
        approve_res = self.client.post(
            f"/api/v1/library/requests/{req_id}/approve",
            headers=self.admin_headers
        )
        self.assertEqual(approve_res.status_code, 200)
        self.assertIn("approved and added to library catalog DB", approve_res.json()["message"])

        # 4. Search library catalog and confirm the approved book is present in DB
        search_res = self.client.get(f"/api/v1/library/search?query={title}")
        self.assertEqual(search_res.status_code, 200)
        results = search_res.json()["results"]
        found = next((b for b in results if b["title"] == title), None)
        self.assertIsNotNone(found)
        self.assertEqual(found["author"], author)


if __name__ == "__main__":
    unittest.main()
