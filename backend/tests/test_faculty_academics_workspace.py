import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import User


class TestFacultyAcademicsWorkspace(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Activate faculty user in DB if pending
        faculty = self.db.query(User).filter(User.email == "rahul.faculty@campus.edu").first()
        if faculty:
            faculty.status = "active"
            faculty.is_active = True
            self.db.commit()

        # Login as Faculty
        res = self.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.faculty@campus.edu", "password": "rahul123"}
        )
        self.assertEqual(res.status_code, 200)
        self.faculty_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    def tearDown(self):
        self.db.close()

    def test_faculty_course_load_and_roster(self):
        # 1. Fetch faculty courses
        courses_res = self.client.get("/api/v1/faculty/courses", headers=self.faculty_headers)
        self.assertEqual(courses_res.status_code, 200)
        courses = courses_res.json()
        self.assertGreaterEqual(len(courses), 1)
        self.assertIn("enrolled_count", courses[0])
        self.assertIn("syllabus_progress", courses[0])

        # 2. Fetch course student roster
        course_id = courses[0]["id"]
        roster_res = self.client.get(f"/api/v1/faculty/courses/{course_id}/roster", headers=self.faculty_headers)
        self.assertEqual(roster_res.status_code, 200)
        self.assertIn("students", roster_res.json())

    def test_faculty_post_course_announcement(self):
        ann_res = self.client.post(
            "/api/v1/academic-ext/announcements",
            json={
                "title": "Midterm Exam Guidelines 2026",
                "content": "Please review Modules 1 and 2 for the upcoming midterm exam.",
                "target_role": "student"
            },
            headers=self.faculty_headers
        )
        self.assertEqual(ann_res.status_code, 200)
        self.assertEqual(ann_res.json()["title"], "Midterm Exam Guidelines 2026")


if __name__ == "__main__":
    unittest.main()
