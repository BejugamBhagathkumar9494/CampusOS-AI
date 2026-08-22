import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import User, Book


class TestFirstLoginAndAdminBooks(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Login as Superadmin
        res = self.client.post(
            "/api/v1/auth/login",
            data={"username": "superadmin@campus.edu", "password": "superadmin123"}
        )
        self.assertEqual(res.status_code, 200)
        self.admin_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    def tearDown(self):
        self.db.close()

    def test_direct_admin_book_addition(self):
        import time
        title = f"Cloud Native Microservices {int(time.time() * 1000)}"
        res = self.client.post(
            "/api/v1/library/books",
            json={
                "title": title,
                "author": "Dr. Martin Fowler",
                "category": "Computer Science",
                "isbn": f"978-{int(time.time() * 1000)}",
                "copies_available": 10
            },
            headers=self.admin_headers
        )
        self.assertEqual(res.status_code, 200)
        msg = res.json()["message"].lower()
        self.assertTrue("added" in msg or "updated" in msg)

        # Verify book exists in library search
        search_res = self.client.get(f"/api/v1/library/search?query={title}")
        self.assertEqual(search_res.status_code, 200)
        found = next((b for b in search_res.json()["results"] if b["title"] == title), None)
        self.assertIsNotNone(found)
        self.assertEqual(found["copies_available"], 10)

    def test_first_time_role_login_auto_request_and_superadmin_approval(self):
        import time
        new_faculty_email = f"prof{int(time.time() * 1000)}.faculty@campus.edu"
        password = "FacultyPassword123"

        # 1. First-time login attempt with unregistered faculty email
        login_res = self.client.post(
            "/api/v1/auth/login",
            data={"username": new_faculty_email, "password": password}
        )
        self.assertEqual(login_res.status_code, 403)
        self.assertIn("pending Superadmin approval", login_res.json()["detail"])

        # 2. Verify pending user entry exists in DB
        pending_user = self.db.query(User).filter(User.email == new_faculty_email).first()
        self.assertIsNotNone(pending_user)
        self.assertEqual(pending_user.status, "pending")
        self.assertFalse(pending_user.is_active)

        # 3. Superadmin approves user account status
        approve_res = self.client.patch(
            f"/api/v1/admin-management/users/{pending_user.id}/status",
            json={"status": "active"},
            headers=self.admin_headers
        )
        self.assertEqual(approve_res.status_code, 200)

        # 4. Post-approval login attempt succeeds
        success_login = self.client.post(
            "/api/v1/auth/login",
            data={"username": new_faculty_email, "password": password}
        )
        self.assertEqual(success_login.status_code, 200)
        self.assertIn("access_token", success_login.json())


if __name__ == "__main__":
    unittest.main()
