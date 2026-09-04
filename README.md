# CampusOS AI — The Next-Gen AI Operating System for Universities

<div align="center">

![CampusOS AI Banner](https://img.shields.io/badge/CampusOS-AI%20Operating%20System-blue?style=for-the-badge&logo=probot&logoColor=white)
<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google GenAI](https://img.shields.io/badge/Google_GenAI-Gemini%20%2F%20Gemma-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Featherless AI](https://img.shields.io/badge/Featherless_AI-Kimi--K3-8A2BE2?style=flat-square)](https://featherless.ai/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<p align="center">
  <b>Transforming traditional university operations through agentic AI, predictive intelligence, automated workflows, and career-readiness engines.</b>
</p>

[Explore Demo](#-instant-demo-access) • [Features](#-key-capabilities--ai-engines) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Security & RBAC](#-security--access-control-system) • [API Reference](#-api-endpoints)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Capabilities & AI Engines](#-key-capabilities--ai-engines)
  - [1. RepoDNA — GitHub Portfolio Intelligence](#1-repodna--github-portfolio-intelligence)
  - [2. AI Mock Interview Studio](#2-ai-mock-interview-studio)
  - [3. Academic Copilot & RAG Assistant](#3-academic-copilot--rag-assistant)
  - [4. Predictive Analytics & Early Warning System](#4-predictive-analytics--early-warning-system)
  - [5. Instant 1-Click Demo Access](#5-instant-1-click-demo-access)
- [Multi-Portal System Overview](#-multi-portal-system-overview)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (FastAPI)](#backend-setup-fastapi)
  - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
  - [Running with Docker Compose](#running-with-docker-compose)
- [Environment Configuration](#-environment-configuration)
- [Security & Access Control System](#-security--access-control-system)
  - [Pre-Configured Test Accounts](#pre-configured-test-accounts)
- [API Endpoints](#-api-endpoints)
- [License](#-license)

---

## 🌟 Overview

**CampusOS AI** is an enterprise-grade university operating system designed to overcome the limitations of legacy, siloed ERP systems. While traditional college management software simply records transactions, **CampusOS AI** actively powers decisions, forecasts academic risks, accelerates student careers, and automates operational workflows across all campus stakeholders.

Whether automating hostel allocations, predicting student dropout risk, conducting realistic AI technical interviews, or auditing GitHub repositories for placement readiness, CampusOS AI delivers an integrated, real-time command center for modern educational institutions.

---

## 🚀 Key Capabilities & AI Engines

### 1. RepoDNA — GitHub Portfolio Intelligence
A proprietary developer intelligence engine that deeply parses student GitHub repositories to verify project authenticity, code quality, and engineering readiness for campus recruiters.
- **Deep Architecture Parsing**: Analyzes dependency trees, file structures, and code distribution.
- **Code Health Score**: Benchmarks documentation, test coverage, modularity, and error handling.
- **Skills Radar & Stack Extraction**: Automatically pinpoints frameworks, tools, and technical competencies.
- **AI Executive Summary**: Generates structured recruiter briefs highlighting stand-out strengths and edge-case growth areas.

### 2. AI Mock Interview Studio
A voice- and text-driven technical interview simulator designed to give students realistic, rigorous interview practice.
- **Dual-Model Brain**: Powered by the **Google Model** (Gemma/Gemini) and **Kimi-K3** (via Featherless AI) with high-availability automated fallback.
- **Dynamic Role-Specific Questions**: Questions are generated adaptively based on target role (Fullstack, Frontend, Backend, AI/ML, DevOps, Data Engineering) and seniority level.
- **Multi-Round Technical Probing**: Follows up on candidate code explanations, drilling into race conditions, scaling bottlenecks, and trade-offs.
- **Comprehensive Scorecards**: Evaluates candidates across Communication, Technical Depth, Problem Solving, and System Design with detailed executive summaries.

### 3. Academic Copilot & RAG Assistant
A conversational Retrieval-Augmented Generation (RAG) assistant grounded in institutional documents, university handbooks, syllabus regulations, and lecture notes.
- **Vector Search Engine**: Powered by `pgvector` / `FAISS` and sentence embedding models.
- **Exam Prep Mode**: Generates practice question banks, conceptual flashcards, and topic deep dives directly aligned with the course syllabus.
- **Multi-Document Citations**: Pulls verified context from course materials to eliminate hallucinations.

### 4. Predictive Analytics & Early Warning System
Machine learning pipelines built with Scikit-learn and XGBoost providing actionable administrative intelligence:
- **Dropout Risk Detection**: Identifies students with declining attendance and grades before failure points.
- **Placement Probability Index**: Forecasts company placement conversion rates based on CGPA, coding performance, and interview readiness.
- **Resource Utilization Optimization**: Dynamically models hostel occupancy, mess meal demand, library catalog turnover, and bus route congestion.

### 5. Instant 1-Click Demo Access
Frictionless exploration for prospective universities, evaluators, and recruiters.
- Clicking **"Watch Demo"** or **"Live Demo"** on the landing page instantly launches a pre-configured student session without requiring credentials or sign-up forms.
- One-click demo access is also accessible directly from the login portal.

---

## 👥 Multi-Portal System Overview

CampusOS AI provides custom interfaces tailored to every stakeholder role:

| Portal | Target Audience | Primary Features |
| :--- | :--- | :--- |
| **Student Hub** | Undergraduate & Graduate Students | Unified Dashboard, RepoDNA, Mock Interview Studio, Academics, Attendance, Timetable, Exam Prep, Grievances, Fees, Hostel & Transport. |
| **Faculty Command** | Professors & Teaching Staff | Course Syllabus Planning, Assignment Publishing, Attendance Recording, Gradebook Analytics, At-Risk Student Early Alerts. |
| **Placement Suite** | Training & Placement Officers | Campus Drive Management, Student Eligibility Filtering, Recruiter CRM, Interview Performance Scorecards, Placement Statistics. |
| **Hostel & Mess** | Wardens & Facility Staff | Room Allocation Matrix, Student Night-Out / Leave Pass Approval, Mess Meal Scheduling, Facility Maintenance Logs. |
| **Library Management** | Librarians & Digital Curators | Book Circulation, Digital Repository Access, Overdue Fines Tracking, Automated Reservation Reminders. |
| **Campus Admin & Super Admin** | Registrars & University Directors | User Lifecycle Approval, Role-Based Access Control (RBAC), Audit Trails, Institutional Settings, Financial Overview. |

---

## 🏗 System Architecture

```mermaid
graph TD
    User([Web / Mobile Client]) --> |HTTPS / WSS| Frontend[React 18 + Vite SPA]
    
    subgraph Frontend Layer
        Frontend --> AuthContext[Auth State & Session Persistence]
        Frontend --> Landing[Modern Responsive Landing]
        Frontend --> RoleRoutes[Role-Guarded Portals]
    end

    Frontend --> |REST APIs /api/v1| Gateway[FastAPI Backend Gateway]

    subgraph Backend Core
        Gateway --> AuthMiddleware[JWT & Role Verification Middleware]
        Gateway --> RLS[Row Level Security & Isolation]
        Gateway --> CoreServices[FastAPI Routers & Controllers]
    end

    subgraph AI Intelligence Layer
        CoreServices --> InterviewBrain[Interview Brain & Question Generator]
        InterviewBrain --> GoogleModel[Google GenAI: Gemini / Gemma]
        InterviewBrain --> FeatherlessModel[Featherless AI: Kimi-K3]
        CoreServices --> RepoDNAEngine[RepoDNA Engine - GitHub Parser]
        CoreServices --> RAGService[RAG Engine & LangChain Embeddings]
    end

    subgraph Data & Persistence Layer
        CoreServices --> SupabasePostgres[(PostgreSQL / Supabase)]
        CoreServices --> VectorDB[(Vector Store: pgvector / FAISS)]
        CoreServices --> LocalStorage[(Cache & Local Storage)]
    end
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 5](https://vitejs.dev/) (fast HMR and optimized asset bundling)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with curated glassmorphic dark/light design tokens
- **Component Icons**: [Lucide React](https://lucide.dev/)
- **Visualizations**: [Recharts](https://recharts.org/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **State & Context**: React Context + Local Storage synchronization

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous, High Throughput, Python 3.10+)
- **ORM & Database**: [SQLAlchemy](https://www.sqlalchemy.org/) with [Alembic](https://alembic.sqlalchemy.org/) migrations
- **Databases**: [PostgreSQL](https://www.postgresql.org/) (via Supabase / Neon) with `pgvector` & `uuid-ossp`
- **Authentication**: JWT Bearer Tokens with OAuth2 and Supabase Auth integration
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)

### AI & Machine Learning
- **Primary LLM**: Google GenAI (`google-genai`, Gemma / Gemini)
- **Secondary / High-Reasoning LLM**: Featherless AI (`moonshotai/Kimi-K3`)
- **Embeddings & Vector Search**: `BAAI/bge-large-en-v1.5`, `pgvector`, FAISS
- **RAG & Agent Orchestration**: LangChain, LangGraph
- **Predictive Analytics**: Scikit-Learn, XGBoost

---

## 📂 Project Directory Structure

```text
CampusOS-AI/
├── backend/                              # FastAPI Backend application
│   ├── app/
│   │   ├── api/                          # REST API route endpoints (v1)
│   │   │   ├── v1/
│   │   │   │   ├── academics.py          # Academic course & attendance routes
│   │   │   │   ├── admin_management.py   # User approval & system settings
│   │   │   │   ├── ai.py                 # Core AI chat & inference endpoints
│   │   │   │   ├── auth.py               # Authentication & token management
│   │   │   │   ├── exam_prep.py          # Exam prep & question generation
│   │   │   │   ├── mock_interview.py     # AI Mock Interview session controller
│   │   │   │   ├── repodna.py            # GitHub repository intelligence routes
│   │   │   │   └── ...                   # Additional domain endpoints
│   │   ├── core/                         # Config, security, database connectors
│   │   │   ├── config.py                 # System settings & environment validation
│   │   │   ├── database.py               # SQLAlchemy engine & session factory
│   │   │   └── security.py               # Password hashing & JWT token logic
│   │   ├── models/                       # Database models (User, Student, Profile)
│   │   ├── schemas/                      # Pydantic schemas for data validation
│   │   ├── services/                     # Business logic & AI pipelines
│   │   │   ├── ai_agents/                # Student success agents & interview brain
│   │   │   │   └── student_success_agent/
│   │   │   │       └── interview_brain.py# Dual-model question generation & evaluation
│   │   │   └── rag_service.py            # FAISS / vector embeddings service
│   │   └── main.py                       # FastAPI application entrypoint
│   ├── requirements.txt                  # Python dependencies
│   ├── Dockerfile                        # Backend container image definition
│   └── .env.example                      # Backend environment template
│
├── frontend/                             # React Frontend application
│   ├── src/
│   │   ├── auth/                         # Authentication & authorization module
│   │   │   ├── components/               # ProtectedRoute & Role Guards
│   │   │   ├── context/                  # AuthContext with demo student state
│   │   │   ├── pages/                    # Login, Register, Forgot Password
│   │   │   └── services/                 # AuthService with demo student login
│   │   ├── components/                   # Shared UI layouts, sidebars, modals
│   │   ├── features/                     # Modular domain features
│   │   │   ├── academics/                # Grades, courses, and attendance UI
│   │   │   ├── admin/                    # User approval & audit logs UI
│   │   │   ├── exam-prep/                # AI study planner & syllabus cards
│   │   │   ├── landing/                  # Landing page with instant demo access
│   │   │   ├── mock-interview/           # Voice/text interactive mock interview
│   │   │   ├── placements/               # Placement drives & skill analytics
│   │   │   ├── repodna/                  # GitHub portfolio audit & radar charts
│   │   │   └── student/                  # Student central hub & dashboard
│   │   ├── services/                     # API client utilities (fetch / Axios)
│   │   ├── App.tsx                       # Route configurations & guards
│   │   └── main.tsx                      # React root rendering
│   ├── package.json                      # Node.js dependencies
│   ├── vite.config.ts                    # Vite config with backend proxy
│   └── .env.example                      # Frontend environment template
│
├── docker-compose.yml                    # Docker orchestration for local stack
├── supabase_setup.sql                    # Database migrations & RLS configuration
├── supabase_integration_guide.md         # Supabase setup and migration handbook
└── README.md                             # Project Documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Package Managers**: `npm` (or `yarn` / `pnpm`) and `pip`
- **Docker & Docker Compose** (Optional, for containerized run)

---

### Backend Setup (FastAPI)

1. **Navigate to the `backend/` directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # On Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up your environment file**:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to supply your API keys (e.g., `GEMINI_API_KEY`, `FEATHERLESS_API_KEY`, and `DATABASE_URL`).*

5. **Start the backend development server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The interactive Swagger documentation is live at `http://localhost:8000/docs`.*

---

### Frontend Setup (React + Vite)

1. **Navigate to the `frontend/` directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Launch the Vite development server**:
   ```bash
   npm run dev
   ```
   *Access the web application at `http://localhost:5173`.*

---

### Running with Docker Compose

To start the entire containerized stack with a single command:
```bash
docker-compose up --build -d
```

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)

```ini
# General Settings
PROJECT_NAME="CampusOS AI"
DEBUG=true
API_V1_STR="/api/v1"

# Database Connection (PostgreSQL / Supabase / Neon)
DATABASE_URL="postgresql://user:password@host:5432/campusos_db"

# Security & CORS
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
JWT_SECRET_KEY="generate_a_secure_random_key"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AI Services Configuration
GOOGLE_API_KEY="your-google-gemini-api-key"
GEMINI_API_KEY="your-google-gemini-api-key"

FEATHERLESS_API_KEY="your-featherless-api-key"
FEATHERLESS_BASE_URL="https://api.featherless.ai/v1"
FEATHERLESS_MODEL="moonshotai/Kimi-K3"

DEFAULT_EMBEDDING_MODEL="BAAI/bge-large-en-v1.5"

# Supabase Storage & Database (Optional)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
```

### Frontend (`frontend/.env`)

```ini
# API Gateway Endpoint
VITE_API_URL="http://localhost:8000/api/v1"
VITE_APP_NAME="CampusOS AI"

# Supabase Auth Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

## 🔒 Security & Access Control System

CampusOS AI enforces a **Zero-Trust Role-Based Access Control (RBAC)** architecture:

```text
                      CAMPUSOS AI CLIENT
                              │
                              ▼
                     Supabase / JWT Auth
                              │
                              ▼
                      User Profile Entity
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
            ROLE CHECK               USER ID CHECK
         (Level 1 - RBAC)        (Level 2 - Data Owner)
                 │                         │
                 └────────────┬────────────┘
                              ▼
                      PERMISSION CHECK
                              │
                              ▼
                   Row-Level Security (RLS)
                              │
                              ▼
                   Role-Specific Dashboard
```

- **Level 1 (RBAC)**: All routes verify user roles (`student`, `faculty`, `admin`, `super_admin`, `hostel_warden`, `placement_officer`).
- **Level 2 (Data Isolation)**: Queries enforce ownership checks (`WHERE user_id = authenticated_user_id`).
- **Account Verification**: New accounts default to `pending` status and must be verified by an administrator before access is granted.
- **Audit Logging**: All authentication and authorization events are logged to `audit_logs` for compliance.

### Pre-Configured Test Accounts

| Institution ID | Email | Role | Default Password |
| :--- | :--- | :--- | :--- |
| `SA001` | `superadmin@campus.edu` | `super_admin` | `superadmin123` |
| `ADM001` | `admin1@campus.edu` | `admin` | `admin123` |
| `STU001` | `rahul.student@campus.edu` | `student` | `rahul123` |
| `STU002` | `priya.student@campus.edu` | `student` | `priya123` |
| `FAC001` | `arun.faculty@campus.edu` | `faculty` | `arun123` |
| `WAR001` | `ramesh.warden@campus.edu` | `hostel_warden` | `ramesh123` |
| `PO001` | `suresh.placement@campus.edu` | `placement_officer` | `suresh123` |

> 💡 **Demo Shortcut**: You do not need to enter credentials to test student features. Click **"Watch Demo"** or **"Live Demo"** on the landing page to enter instantly.

---

## 📡 API Endpoints

A selection of primary REST endpoints exposed by the backend:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user and issue JWT bearer tokens |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile & permissions |
| `POST` | `/api/v1/mock-interview/start` | Start mock interview with dual-model dynamic starter question |
| `POST` | `/api/v1/mock-interview/{id}/respond` | Submit candidate reply, verify code, and get next question |
| `POST` | `/api/v1/mock-interview/{id}/complete`| Generate final score rubric & executive evaluation summary |
| `POST` | `/api/v1/repodna/analyze` | Parse GitHub repository and generate RepoDNA portfolio audit |
| `POST` | `/api/v1/ai/chat/llm` | Direct multi-model conversational assistant |
| `POST` | `/api/v1/ai/chat/rag` | Institutional RAG query with document citations |
| `GET` | `/api/v1/students/{id}/academics` | Fetch GPA, credits, marks, and attendance stats |
| `GET` | `/api/v1/placements/drives` | Fetch campus placement drives and eligibility status |

*Complete schema definitions and test runners are available on `/docs`.*

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.

---

<div align="center">
  <sub>Built with ❤️ by the CampusOS AI Engineering Team.</sub>
</div>
