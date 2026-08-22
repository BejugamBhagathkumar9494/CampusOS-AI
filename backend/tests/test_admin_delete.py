import time
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import User, Profile


class TestAdminUserManagement(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Login as superadmin to get token
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "superadmin@campus.edu", "password": "superadmin123"},
        )
        self.assertEqual(response.status_code, 200)
        token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {token}"}

    def tearDown(self):
        self.db.close()

    def test_status_update_and_delete_user(self):
        ts = int(time.time() * 1000)
        test_email = f"temp_{ts}.student@campus.edu"
        test_inst_id = f"STU_TEMP_{ts}"

        # 1. Register a test user
        reg_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": test_email,
                "password": "Password123!",
                "full_name": "Temporary User",
                "role": "student",
                "institution_id": test_inst_id
            }
        )
        self.assertEqual(reg_response.status_code, 201)
        
        # Fetch user details
        user = self.db.query(User).filter(User.email == test_email).first()
        self.assertIsNotNone(user)
        user_id_int = user.id
        user_id_str = str(user.id)

        # 2. Update status to active (Accept user)
        patch_res = self.client.patch(
            f"/api/v1/admin-management/users/{user_id_str}/status",
            headers=self.headers,
            json={"status": "active"}
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], "active")

        # 3. Update status to rejected (Reject user)
        patch_res = self.client.patch(
            f"/api/v1/admin-management/users/{user_id_str}/status",
            headers=self.headers,
            json={"status": "rejected"}
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], "rejected")

        # 4. Delete user permanently from database (Remove user)
        del_res = self.client.delete(
            f"/api/v1/admin-management/users/{user_id_str}",
            headers=self.headers
        )
        self.assertEqual(del_res.status_code, 200)
        self.assertIn("deleted successfully", del_res.json()["message"])

        # 5. Verify user is removed from DB
        new_db_session = SessionLocal()
        try:
            deleted_user = new_db_session.query(User).filter(User.id == user_id_int).first()
            deleted_profile = new_db_session.query(Profile).filter(Profile.id == user_id_str).first()
            self.assertIsNone(deleted_user)
            self.assertIsNone(deleted_profile)
        finally:
            new_db_session.close()


if __name__ == "__main__":
    unittest.main()
