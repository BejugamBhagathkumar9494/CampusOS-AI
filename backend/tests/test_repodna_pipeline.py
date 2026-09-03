"""
=============================================================================
CampusOS AI - RepoDNA Pipeline Automated Unit Tests
=============================================================================
"""

import unittest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.database_models import (
    User,
    StudyRepository,
    RepositoryFile,
    RepositoryChunk,
    RepositoryAnalysis
)
from app.services.repodna.github_scanner import (
    parse_github_url,
    is_ignored_file,
    get_file_priority,
    filter_relevant_files
)
from app.services.repodna.code_extractor import (
    classify_file_type,
    detect_language,
    extract_code_metadata
)
from app.services.repodna.tech_detector import detect_technologies_from_files
from app.services.repodna.repodna_indexer import (
    generate_code_embedding,
    chunk_source_code,
    index_repository_files,
    retrieve_repository_chunks
)
from app.services.repodna.validator import (
    validate_repository_grounding,
    REFUSAL_MESSAGE
)
from app.services.repodna.repodna_generator import build_fallback_analysis


class TestRepoDNAPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def test_github_url_parsing_valid_and_invalid(self):
        """Test URL parsing for standard, .git, and invalid formats."""
        o, r = parse_github_url("https://github.com/facebook/react")
        self.assertEqual(o, "facebook")
        self.assertEqual(r, "react")

        o, r = parse_github_url("http://github.com/pallets/flask.git/")
        self.assertEqual(o, "pallets")
        self.assertEqual(r, "flask")

        o, r = parse_github_url("github.com/tiangolo/fastapi")
        self.assertEqual(o, "tiangolo")
        self.assertEqual(r, "fastapi")

        with self.assertRaises(ValueError):
            parse_github_url("https://gitlab.com/user/project")

        with self.assertRaises(ValueError):
            parse_github_url("invalid-url-string")

    def test_file_filtering_and_priority(self):
        """Test that build artifacts, node_modules, and binaries are ignored, and manifests get highest priority."""
        self.assertTrue(is_ignored_file("node_modules/react/index.js"))
        self.assertTrue(is_ignored_file(".git/config"))
        self.assertTrue(is_ignored_file("dist/bundle.js"))
        self.assertTrue(is_ignored_file("build/main.exe"))
        self.assertTrue(is_ignored_file("backend/__pycache__/main.cpython-311.pyc"))
        self.assertTrue(is_ignored_file(".venv/lib/site-packages/fastapi/main.py"))
        self.assertTrue(is_ignored_file("package-lock.json"))
        self.assertTrue(is_ignored_file("public/logo.png"))

        # Valid source files must not be ignored
        self.assertFalse(is_ignored_file("src/components/Navbar.tsx"))
        self.assertFalse(is_ignored_file("backend/app/api/v1/auth.py"))
        self.assertFalse(is_ignored_file("package.json"))
        self.assertFalse(is_ignored_file("Dockerfile"))

        # Priority test: manifest (0) > route (1) > component (4)
        self.assertEqual(get_file_priority("package.json"), 0)
        self.assertEqual(get_file_priority("src/routes/authRoutes.js"), 1)
        self.assertEqual(get_file_priority("src/components/Button.tsx"), 4)

    def test_code_metadata_extraction(self):
        """Test AST/regex extraction of imports, functions, classes, and REST routes."""
        sample_code = """
        import { useState, useEffect } from 'react';
        import axios from 'axios';

        export default function UserProfile({ userId }) {
            const [user, setUser] = useState(null);

            useEffect(() => {
                axios.get(`/api/users/${userId}`).then(res => setUser(res.data));
            }, [userId]);

            return <div>{user?.name}</div>;
        }
        """
        meta = extract_code_metadata("src/components/UserProfile.jsx", sample_code)
        self.assertEqual(meta["file_type"], "component")
        self.assertIn("react", meta["imports"])
        self.assertIn("axios", meta["imports"])
        self.assertIn("UserProfile", meta["functions"])
        self.assertTrue(len(meta["api_endpoints"]) > 0)

    def test_tech_detection_with_evidence(self):
        """Test deterministic detection of React, FastAPI, and PostgreSQL with source citations."""
        mock_files = [
            {
                "file_path": "package.json",
                "content": '{"dependencies": {"react": "^18.2.0", "tailwindcss": "^3.4.0", "jsonwebtoken": "^9.0.0"}}'
            },
            {
                "file_path": "backend/requirements.txt",
                "content": "fastapi>=0.110.0\nuvicorn>=0.28.0\npsycopg2-binary>=2.9.9\nsupabase>=2.4.0\n"
            },
            {
                "file_path": "Dockerfile",
                "content": "FROM python:3.11\nWORKDIR /app\n"
            }
        ]
        detected = detect_technologies_from_files(mock_files)
        fe_names = [t["name"] for t in detected.get("Frontend", [])]
        be_names = [t["name"] for t in detected.get("Backend", [])]
        db_names = [t["name"] for t in detected.get("Database", [])]
        auth_names = [t["name"] for t in detected.get("Authentication", [])]
        devops_names = [t["name"] for t in detected.get("Deployment & DevOps", [])]

        self.assertIn("React", fe_names)
        self.assertIn("FastAPI", be_names)
        self.assertIn("PostgreSQL", db_names)
        self.assertIn("Supabase", db_names)
        self.assertIn("JWT (JSON Web Tokens)", auth_names)
        self.assertIn("Docker", devops_names)

    def test_repository_indexing_and_scoped_retrieval(self):
        """Test indexing source files into vector chunks and scoped retrieval."""
        student = User(id=301, email="repouser@campusos.edu", full_name="Repo Student", hashed_password="pw", status="active")
        self.db.add(student)
        self.db.commit()

        repo_id = str(uuid.uuid4())
        repo = StudyRepository(
            id=repo_id,
            user_id=student.id,
            github_url="https://github.com/example/ecommerce",
            owner="example",
            repo_name="ecommerce",
            default_branch="main",
            primary_language="TypeScript"
        )
        self.db.add(repo)
        self.db.commit()

        files = [
            {
                "file_path": "src/controllers/authController.ts",
                "content": "export async function loginUser(req, res) { const token = jwt.sign({ id: user.id }, SECRET); return res.json({ token }); }",
                "content_hash": "hash1"
            },
            {
                "file_path": "src/routes/paymentRoutes.ts",
                "content": "router.post('/checkout', async (req, res) => { stripe.charges.create({ amount: 1000 }); });",
                "content_hash": "hash2"
            }
        ]
        meta_map = {
            "src/controllers/authController.ts": {"file_type": "controller", "language": "TypeScript", "functions": ["loginUser"]},
            "src/routes/paymentRoutes.ts": {"file_type": "route", "language": "TypeScript", "functions": []}
        }

        chunks_indexed = index_repository_files(self.db, repo, files, meta_map)
        self.assertEqual(chunks_indexed, 2)

        # Scoped retrieval for JWT login
        retrieved = retrieve_repository_chunks(self.db, repo_id, "jwt authentication token login", k=2)
        self.assertTrue(len(retrieved) > 0)
        self.assertEqual(retrieved[0]["file_path"], "src/controllers/authController.ts")

    def test_student_isolation(self):
        """Verify Student A cannot retrieve Student B's repository chunks."""
        student_a = User(id=401, email="student_a@campusos.edu", full_name="Student A", hashed_password="pw", status="active")
        student_b = User(id=402, email="student_b@campusos.edu", full_name="Student B", hashed_password="pw", status="active")
        self.db.add_all([student_a, student_b])
        self.db.commit()

        repo_a = StudyRepository(id="repo-a-uuid", user_id=student_a.id, github_url="https://github.com/a/repoa", owner="a", repo_name="repoa")
        repo_b = StudyRepository(id="repo-b-uuid", user_id=student_b.id, github_url="https://github.com/b/repob", owner="b", repo_name="repob")
        self.db.add_all([repo_a, repo_b])
        self.db.commit()

        file_b = RepositoryFile(id="file-b-uuid", repository_id=repo_b.id, file_path="secret/algo.py")
        self.db.add(file_b)
        self.db.commit()

        chunk_b = RepositoryChunk(repository_id=repo_b.id, file_id=file_b.id, file_path="secret/algo.py", content="Quantum Super Secret Algorithm")
        self.db.add(chunk_b)
        self.db.commit()

        # Querying repo_a MUST NEVER return chunk_b
        results = retrieve_repository_chunks(self.db, "repo-a-uuid", "Quantum Super Secret")
        self.assertEqual(len(results), 0)

    def test_hallucination_refusal_validation(self):
        """Verify grounding validator refuses empty or out-of-domain claims."""
        is_grounded, val = validate_repository_grounding(
            answer="",
            retrieved_chunks=[],
            all_file_paths=[]
        )
        self.assertFalse(is_grounded)
        self.assertEqual(val, REFUSAL_MESSAGE)


if __name__ == "__main__":
    unittest.main()
