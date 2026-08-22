import unittest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.database_models import User, Profile, RegistrationRequest, AIChatSession, AIChatMessage


class TestFullDatabaseAuthAndAISessions(unittest.TestCase):
    def setUp(self):
        from app.main import app as fastapi_app
        self.client = TestClient(fastapi_app)
        self.db = SessionLocal()

        from app.core.database import Base, engine
        Base.metadata.create_all(bind=engine)

        from app.core.security import get_password_hash
        # Ensure SuperAdmin is active with valid password
        admin = self.db.query(User).filter(User.email == "superadmin@campus.edu").first()
        if not admin:
            admin = User(
                email="superadmin@campus.edu",
                full_name="Super Administrator",
                hashed_password=get_password_hash("admin123"),
                status="active",
                is_active=True
            )
            self.db.add(admin)
        else:
            admin.hashed_password = get_password_hash("admin123")
            admin.status = "active"
            admin.is_active = True
        self.db.commit()

        # Login as SuperAdmin
        res_admin = self.client.post(
            "/api/v1/auth/login",
            data={"username": "superadmin@campus.edu", "password": "admin123"}
        )
        self.assertEqual(res_admin.status_code, 200)
        self.admin_headers = {"Authorization": f"Bearer {res_admin.json()['access_token']}"}

        # Create User A (Student) and User B (Faculty)
        user_a_email = "testusera.student@campus.edu"
        user_b_email = "testuserb.faculty@campus.edu"

        from app.models import Role
        student_role = self.db.query(Role).filter(Role.name == "student").first()
        if not student_role:
            student_role = Role(name="student", description="Student role")
            self.db.add(student_role)

        faculty_role = self.db.query(Role).filter(Role.name == "faculty").first()
        if not faculty_role:
            faculty_role = Role(name="faculty", description="Faculty role")
            self.db.add(faculty_role)

        self.db.commit()

        user_a = self.db.query(User).filter(User.email == user_a_email).first()
        if user_a:
            user_a.status = "active"
            user_a.is_active = True
            user_a.hashed_password = get_password_hash("student123")
            if student_role not in user_a.roles:
                user_a.roles.append(student_role)
        else:
            user_a = User(
                email=user_a_email,
                full_name="User A Student",
                hashed_password=get_password_hash("student123"),
                status="active",
                is_active=True
            )
            user_a.roles.append(student_role)
            self.db.add(user_a)

        prof_a = self.db.query(Profile).filter(Profile.email == user_a_email).first()
        if prof_a:
            prof_a.status = "active"
        else:
            prof_a = Profile(id="user_a_id", auth_user_id="user_a_id", full_name="User A Student", email=user_a_email, role="student", status="active")
            self.db.add(prof_a)

        user_b = self.db.query(User).filter(User.email == user_b_email).first()
        if user_b:
            user_b.status = "active"
            user_b.is_active = True
            user_b.hashed_password = get_password_hash("faculty123")
            if faculty_role not in user_b.roles:
                user_b.roles.append(faculty_role)
        else:
            user_b = User(
                email=user_b_email,
                full_name="User B Faculty",
                hashed_password=get_password_hash("faculty123"),
                status="active",
                is_active=True
            )
            user_b.roles.append(faculty_role)
            self.db.add(user_b)

        prof_b = self.db.query(Profile).filter(Profile.email == user_b_email).first()
        if prof_b:
            prof_b.status = "active"
        else:
            prof_b = Profile(id="user_b_id", auth_user_id="user_b_id", full_name="User B Faculty", email=user_b_email, role="faculty", status="active")
            self.db.add(prof_b)

        self.db.commit()

        # Login User A
        res_a = self.client.post("/api/v1/auth/login", data={"username": user_a_email, "password": "student123"})
        if res_a.status_code != 200:
            print("USER A LOGIN FAIL DETAIL:", res_a.json())
        self.assertEqual(res_a.status_code, 200)
        self.user_a_headers = {"Authorization": f"Bearer {res_a.json()['access_token']}"}

        # Login User B
        res_b = self.client.post("/api/v1/auth/login", data={"username": user_b_email, "password": "faculty123"})
        self.assertEqual(res_b.status_code, 200)
        self.user_b_headers = {"Authorization": f"Bearer {res_b.json()['access_token']}"}

    def tearDown(self):
        self.db.close()

    def test_unapproved_registration_and_superadmin_approval_rejection(self):
        new_email = f"newapplicant_{uuid.uuid4().hex[:6]}.student@campus.edu"

        # 1. Attempt login with unapproved new email -> auto creates pending user and returns HTTP 403
        res_login = self.client.post("/api/v1/auth/login", data={"username": new_email, "password": "password123"})
        self.assertEqual(res_login.status_code, 403)
        self.assertIn("pending", res_login.json()["detail"].lower())

        # 2. Check pending user exists in DB
        pending_user = self.db.query(User).filter(User.email == new_email).first()
        self.assertIsNotNone(pending_user)
        self.assertEqual(pending_user.status, "pending")
        self.assertFalse(pending_user.is_active)

        # 3. SuperAdmin rejects user with rejection reason
        reject_res = self.client.patch(
            f"/api/v1/admin-management/users/{pending_user.id}/status",
            json={"status": "rejected", "rejection_reason": "Incomplete identity documentation"},
            headers=self.admin_headers
        )
        self.assertEqual(reject_res.status_code, 200)

        # 4. Verify rejection status in DB
        self.db.refresh(pending_user)
        self.assertEqual(pending_user.status, "rejected")
        self.assertFalse(pending_user.is_active)

        # 5. SuperAdmin approves user
        approve_res = self.client.patch(
            f"/api/v1/admin-management/users/{pending_user.id}/status",
            json={"status": "active"},
            headers=self.admin_headers
        )
        self.assertEqual(approve_res.status_code, 200)
        self.db.refresh(pending_user)
        self.assertEqual(pending_user.status, "active")
        self.assertTrue(pending_user.is_active)

    def test_new_ai_chat_session_per_login_and_user_isolation(self):
        # 1. User A creates a new AI chat session
        sess_a_res = self.client.post(
            "/api/v1/ai/sessions",
            json={"title": "Algorithms & Operating Systems Session"},
            headers=self.user_a_headers
        )
        self.assertEqual(sess_a_res.status_code, 200)
        session_a_id = sess_a_res.json()["id"]

        # 2. User A posts user message to session A
        msg_res = self.client.post(
            f"/api/v1/ai/sessions/{session_a_id}/messages",
            json={"role": "user", "message": "Explain B-Trees and indexing", "mode": "llm"},
            headers=self.user_a_headers
        )
        self.assertEqual(msg_res.status_code, 200)

        # 3. User A posts assistant response to session A
        bot_res = self.client.post(
            f"/api/v1/ai/sessions/{session_a_id}/messages",
            json={"role": "assistant", "message": "B-Trees are self-balancing search trees...", "mode": "llm"},
            headers=self.user_a_headers
        )
        self.assertEqual(bot_res.status_code, 200)

        # 4. User A fetches past AI sessions
        user_a_sessions = self.client.get("/api/v1/ai/sessions", headers=self.user_a_headers).json()
        target_a = next((s for s in user_a_sessions if s["id"] == session_a_id), None)
        self.assertIsNotNone(target_a)

        # 5. User B fetches past AI sessions (MUST NOT SEE User A's session)
        user_b_sessions = self.client.get("/api/v1/ai/sessions", headers=self.user_b_headers).json()
        target_in_b = next((s for s in user_b_sessions if s["id"] == session_a_id), None)
        self.assertIsNone(target_in_b)

        # 6. User B attempts to access User A's session messages -> HTTP 404 / Unauthorized
        unauth_msg_res = self.client.get(f"/api/v1/ai/sessions/{session_a_id}/messages", headers=self.user_b_headers)
        self.assertEqual(unauth_msg_res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
