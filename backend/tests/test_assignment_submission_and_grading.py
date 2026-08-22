import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.database_models import User, Assignment, AssignmentSubmission, Student


class TestAssignmentSubmissionAndGrading(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Activate student user & faculty user in DB if pending
        student_user = self.db.query(User).filter(User.email == "rahul.student@campus.edu").first()
        if student_user:
            student_user.status = "active"
            student_user.is_active = True

        faculty_user = self.db.query(User).filter(User.email == "rahul.faculty@campus.edu").first()
        if faculty_user:
            faculty_user.status = "active"
            faculty_user.is_active = True

        self.db.commit()

        # Login as Student
        res_stu = self.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.student@campus.edu", "password": "rahul123"}
        )
        self.assertEqual(res_stu.status_code, 200)
        self.student_headers = {"Authorization": f"Bearer {res_stu.json()['access_token']}"}

        # Login as Faculty
        res_fac = self.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.faculty@campus.edu", "password": "rahul123"}
        )
        self.assertEqual(res_fac.status_code, 200)
        self.faculty_headers = {"Authorization": f"Bearer {res_fac.json()['access_token']}"}

        # Ensure an Assignment exists in DB
        assignment = self.db.query(Assignment).first()
        if not assignment:
            assignment = Assignment(
                course_id=1,
                title="Data Structures Lab 1",
                description="Implement Binary Search Tree",
                due_date="2026-09-01"
            )
            self.db.add(assignment)
            self.db.commit()
            self.db.refresh(assignment)
        self.assignment_id = assignment.id

    def tearDown(self):
        self.db.close()

    def test_full_student_submit_and_faculty_grade_flow(self):
        # 1. Student submits assignment
        sub_res = self.client.post(
            f"/api/v1/academic-ext/assignments/{self.assignment_id}/submit",
            json={"file_path": "https://github.com/rahul/bst-solution"},
            headers=self.student_headers
        )
        self.assertEqual(sub_res.status_code, 200)
        sub_data = sub_res.json()
        submission_id = sub_data["id"]
        self.assertEqual(sub_data["status"], "Submitted")

        # 2. Faculty grades student submission
        grade_res = self.client.post(
            f"/api/v1/academic-ext/assignments/submissions/{submission_id}/grade",
            json={"marks_obtained": 95.5, "feedback": "Outstanding implementation!"},
            headers=self.faculty_headers
        )
        self.assertEqual(grade_res.status_code, 200)
        self.assertEqual(grade_res.json()["status"], "Graded")
        self.assertEqual(grade_res.json()["marks_obtained"], 95.5)

        # 3. Student fetches my-submissions and verifies evaluated score + feedback
        my_subs_res = self.client.get(
            "/api/v1/academic-ext/assignments/my-submissions",
            headers=self.student_headers
        )
        self.assertEqual(my_subs_res.status_code, 200)
        my_subs = my_subs_res.json()
        target_sub = next((s for s in my_subs if s["id"] == submission_id), None)
        self.assertIsNotNone(target_sub)
        self.assertEqual(target_sub["marks_obtained"], 95.5)
        self.assertEqual(target_sub["feedback"], "Outstanding implementation!")
        self.assertEqual(target_sub["status"], "Graded")


if __name__ == "__main__":
    unittest.main()
