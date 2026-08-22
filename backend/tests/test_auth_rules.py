import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_db
from app.models import User, Profile


class TestAuthEmailRulesAndApproval(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_invalid_email_format_rejected(self):
        # Invalid domain
        response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "teststudent.student@gmail.com",
                "password": "Password123!",
                "full_name": "Test Student",
                "role": "student",
                "institution_id": "STU99001"
            }
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Email format invalid", response.json()["detail"])

        # Missing role tag (.student)
        response2 = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "teststudent@campus.edu",
                "password": "Password123!",
                "full_name": "Test Student",
                "role": "student",
                "institution_id": "STU99002"
            }
        )
        self.assertEqual(response2.status_code, 400)
        self.assertIn("Email format invalid", response2.json()["detail"])

    def test_valid_registration_creates_pending_user_and_login_protection(self):
        import time
        ts = int(time.time() * 1000)
        email = f"testnewstudent_{ts}.student@campus.edu"
        password = "Password123!"
        inst_id = f"STU_NEW_{ts}"

        # Register user with correct role email tag .student@campus.edu
        res = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "full_name": "New Student",
                "role": "student",
                "institution_id": inst_id
            }
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["status"], "pending")
        self.assertFalse(data["is_active"])

        # Try to log in while pending approval
        login_res = self.client.post(
            "/api/v1/auth/login",
            data={"username": email, "password": password}
        )
        self.assertEqual(login_res.status_code, 403)
        self.assertIn("pending Superadmin approval", login_res.json()["detail"])

        # Simulate Superadmin accepting the user
        from app.core.database import SessionLocal
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        self.assertIsNotNone(user)
        user.status = "active"
        user.is_active = True
        
        profile = db.query(Profile).filter(Profile.email == email).first()
        if profile:
            profile.status = "active"
        db.commit()
        db.close()

        # Login now succeeds
        login_res2 = self.client.post(
            "/api/v1/auth/login",
            data={"username": email, "password": password}
        )
        self.assertEqual(login_res2.status_code, 200)
        self.assertIn("access_token", login_res2.json())


if __name__ == "__main__":
    unittest.main()
