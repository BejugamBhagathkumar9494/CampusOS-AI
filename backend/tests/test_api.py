import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestCampusOSAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy", "version": "1.0.0"})

    def test_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Welcome to CampusOS AI API", response.json()["message"])

    def test_login_success(self):
        # Login with the seeded user
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.student@campus.edu", "password": "rahul123"},
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertIn("access_token", json_data)
        self.assertIn("refresh_token", json_data)
        self.assertEqual(json_data["token_type"], "bearer")

    def test_login_failure(self):
        # Attempt login with invalid credentials
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "rahul.student@campus.edu", "password": "wrong_password"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Incorrect email address or password.")


if __name__ == "__main__":
    unittest.main()

