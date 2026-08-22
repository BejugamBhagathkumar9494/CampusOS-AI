import time
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import User, Student, Company, Attendance
from app.models.database_models import PlacementDrive, PlacementApplication


class TestFacultyAndPlacementDBOperations(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

        # Login as superadmin to get token for elevated role endpoints
        res = self.client.post(
            "/api/v1/auth/login",
            data={"username": "superadmin@campus.edu", "password": "superadmin123"}
        )
        self.assertEqual(res.status_code, 200)
        self.token = res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        self.db.close()

    def test_faculty_attendance_marking_and_student_sync_in_db(self):
        # Fetch an existing student from DB
        student = self.db.query(Student).first()
        self.assertIsNotNone(student)

        # Faculty marks attendance in DB via /api/v1/faculty/attendance
        today_str = "2026-08-22"
        payload = {
            "records": [
                {
                    "student_id": student.id,
                    "subject_id": 1,
                    "date": today_str,
                    "is_present": True
                }
            ]
        }

        mark_res = self.client.post(
            "/api/v1/faculty/attendance",
            json=payload,
            headers=self.headers
        )
        self.assertEqual(mark_res.status_code, 200)
        self.assertIn("Successfully marked attendance", mark_res.json()["message"])

        # Retrieve student attendance statistics from DB
        att_res = self.client.get(
            f"/api/v1/students/{student.id}/attendance",
            headers=self.headers
        )
        self.assertEqual(att_res.status_code, 200)
        data = att_res.json()
        self.assertEqual(data["student_id"], student.id)
        self.assertIn("overall_rate", data)
        self.assertIn("subjects", data)

    def test_course_roster_returns_db_students(self):
        roster_res = self.client.get(
            "/api/v1/faculty/courses/1/roster",
            headers=self.headers
        )
        self.assertEqual(roster_res.status_code, 200)
        roster_data = roster_res.json()
        self.assertIn("students", roster_data)
        self.assertGreater(len(roster_data["students"]), 0)

    def test_placement_officer_drive_creation_and_student_status_update(self):
        ts = int(time.time() * 1000)
        company_name = f"TechCorp_{ts}"

        # Ensure company exists in DB
        company = Company(name=company_name, industry="Software", website=f"https://{company_name.lower()}.com")
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)

        # Placement Officer creates a drive in DB
        drive_payload = {
            "company_id": company.id,
            "title": "Software Engineer 2026",
            "package_lpa": 14.5,
            "min_cgpa": 6.0,
            "max_backlogs": 0,
            "location": "Bengaluru",
            "required_skills": "Python, React, SQL",
            "deadline": "2026-12-31"
        }

        drive_res = self.client.post(
            "/api/v1/placements/drives",
            json=drive_payload,
            headers=self.headers
        )
        self.assertEqual(drive_res.status_code, 200)
        drive_id = drive_res.json()["drive_id"]

        # Student applies for the drive
        # Login as student rahul.student@campus.edu
        s_res = self.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.student@campus.edu", "password": "rahul123"}
        )
        self.assertEqual(s_res.status_code, 200)
        student_headers = {"Authorization": f"Bearer {s_res.json()['access_token']}"}

        apply_res = self.client.post(
            f"/api/v1/placements/apply/{drive_id}",
            headers=student_headers
        )
        self.assertEqual(apply_res.status_code, 200)

        # Placement Officer views applications
        apps_res = self.client.get(
            "/api/v1/placements/applications",
            headers=self.headers
        )
        self.assertEqual(apps_res.status_code, 200)
        apps_list = apps_res.json()["applications"]
        target_app = next((a for a in apps_list if a["company_name"] == company_name), None)
        self.assertIsNotNone(target_app)
        app_id = target_app["id"]

        # Placement Officer updates student status to Offered/Placed in DB
        status_res = self.client.put(
            f"/api/v1/placements/applications/{app_id}/status",
            json={"status": "Offered"},
            headers=self.headers
        )
        self.assertEqual(status_res.status_code, 200)

        # Student views their updated applications list from DB
        s_apps_res = self.client.get(
            "/api/v1/placements/applications",
            headers=student_headers
        )
        self.assertEqual(s_apps_res.status_code, 200)
        s_target_app = next((a for a in s_apps_res.json()["applications"] if a["id"] == app_id), None)
        self.assertIsNotNone(s_target_app)
        self.assertEqual(s_target_app["status"], "Offered")


if __name__ == "__main__":
    unittest.main()
