import re
from typing import Dict, Any, List


TECH_RULES = {
    "Frontend": [
        {"name": "React", "keywords": ["react", "react-dom"], "files": ["package.json", "App.tsx", "App.jsx"]},
        {"name": "Next.js", "keywords": ["next", "next/navigation", "next/router"], "files": ["next.config.js", "next.config.mjs"]},
        {"name": "Vue.js", "keywords": ["vue", "@vue/"], "files": ["vue.config.js", "App.vue"]},
        {"name": "Angular", "keywords": ["@angular/core"], "files": ["angular.json"]},
        {"name": "Svelte", "keywords": ["svelte", "@sveltejs/kit"], "files": ["svelte.config.js"]},
        {"name": "Tailwind CSS", "keywords": ["tailwindcss"], "files": ["tailwind.config.js", "tailwind.config.ts"]},
        {"name": "Vite", "keywords": ["vite", "@vitejs/plugin-react"], "files": ["vite.config.ts", "vite.config.js"]},
        {"name": "Redux", "keywords": ["@reduxjs/toolkit", "redux"], "files": []},
        {"name": "Zustand", "keywords": ["zustand"], "files": []},
    ],
    "Backend": [
        {"name": "FastAPI", "keywords": ["fastapi", "uvicorn"], "files": ["main.py", "requirements.txt", "pyproject.toml"]},
        {"name": "Express.js", "keywords": ["express"], "files": ["server.js", "app.js", "package.json"]},
        {"name": "Node.js", "keywords": ["node"], "files": ["package.json"]},
        {"name": "Flask", "keywords": ["flask"], "files": ["app.py", "requirements.txt"]},
        {"name": "Django", "keywords": ["django", "djangorestframework"], "files": ["manage.py", "settings.py"]},
        {"name": "Spring Boot", "keywords": ["org.springframework.boot"], "files": ["pom.xml", "build.gradle"]},
        {"name": "NestJS", "keywords": ["@nestjs/core"], "files": ["nest-cli.json"]},
    ],
    "Database": [
        {"name": "PostgreSQL", "keywords": ["psycopg2", "pg", "postgresql", "pgvector"], "files": []},
        {"name": "Supabase", "keywords": ["@supabase/supabase-js", "supabase"], "files": ["supabase.py", "supabaseClient.ts"]},
        {"name": "MongoDB", "keywords": ["mongoose", "mongodb", "pymongo"], "files": []},
        {"name": "SQLite", "keywords": ["sqlite", "sqlite3"], "files": []},
        {"name": "MySQL", "keywords": ["mysql", "mysql2", "pymysql"], "files": []},
        {"name": "Redis", "keywords": ["redis", "ioredis"], "files": []},
        {"name": "Prisma ORM", "keywords": ["@prisma/client", "prisma"], "files": ["schema.prisma"]},
        {"name": "SQLAlchemy", "keywords": ["sqlalchemy"], "files": []},
    ],
    "AI & ML": [
        {"name": "Google Gemini", "keywords": ["google-genai", "google.generativeai", "@google/generative-ai"], "files": []},
        {"name": "OpenAI", "keywords": ["openai"], "files": []},
        {"name": "LangChain", "keywords": ["langchain", "@langchain/core"], "files": []},
        {"name": "Hugging Face", "keywords": ["transformers", "huggingface_hub"], "files": []},
        {"name": "pgvector", "keywords": ["pgvector", "vector(1536)"], "files": []},
        {"name": "PyTorch", "keywords": ["torch", "torchvision"], "files": []},
        {"name": "TensorFlow", "keywords": ["tensorflow", "keras"], "files": []},
    ],
    "Authentication": [
        {"name": "JWT (JSON Web Tokens)", "keywords": ["jsonwebtoken", "python-jose", "jwt"], "files": []},
        {"name": "Supabase Auth", "keywords": ["supabase.auth"], "files": []},
        {"name": "Firebase Auth", "keywords": ["firebase/auth", "firebase-admin"], "files": []},
        {"name": "Bcrypt Password Hashing", "keywords": ["bcrypt", "passlib", "bcryptjs"], "files": []},
        {"name": "OAuth", "keywords": ["oauth", "passport-google-oauth20"], "files": []},
    ],
    "Deployment & DevOps": [
        {"name": "Docker", "keywords": ["FROM ", "WORKDIR "], "files": ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"]},
        {"name": "Vercel", "keywords": ["vercel"], "files": ["vercel.json"]},
        {"name": "Render", "keywords": ["render"], "files": ["render.yaml"]},
        {"name": "GitHub Actions", "keywords": ["name: "], "files": [".github/workflows"]},
    ]
}


def detect_technologies_from_files(files: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, str]]]:
    """
    Scans files and package manifests to detect technologies with strict source evidence.
    """
    detected: Dict[str, List[Dict[str, str]]] = {
        "Frontend": [],
        "Backend": [],
        "Database": [],
        "AI & ML": [],
        "Authentication": [],
        "Deployment & DevOps": []
    }

    all_file_paths = [f.get("file_path", "") for f in files]
    file_contents_map = {f.get("file_path", ""): f.get("content", "").lower() for f in files}

    for category, rules in TECH_RULES.items():
        for rule in rules:
            tech_name = rule["name"]
            keywords = rule["keywords"]
            required_files = rule["files"]
            found_evidence = []

            # Check filename matches
            for req_f in required_files:
                for path in all_file_paths:
                    if path.lower().endswith(req_f.lower()) or req_f.lower() in path.lower():
                        found_evidence.append(f"File: {path}")

            # Check keyword matches in manifests / code
            for path, content in file_contents_map.items():
                is_manifest = path.lower().endswith(('package.json', 'requirements.txt', 'pyproject.toml', 'pom.xml', 'dockerfile', 'docker-compose.yml'))
                for kw in keywords:
                    if kw.lower() in content:
                        found_evidence.append(f"Mentioned in {path}")
                        break

            if found_evidence:
                detected[category].append({
                    "name": tech_name,
                    "evidence": found_evidence[0] if len(found_evidence) == 1 else f"{found_evidence[0]}, {found_evidence[1]}"
                })

    return detected
