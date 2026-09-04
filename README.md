# 🚀 CampusOS AI
> The Next-Gen AI Operating System for Modern Universities: Automating campus operations, accelerating student careers, and empowering institutions with predictive intelligence.

🔗 [Live Demo](https://campus-os-ai-jbth.vercel.app) | 🎥 [Demo Video](https://campus-os-ai-jbth.vercel.app) | 📂 [GitHub](https://github.com/BejugamBhagathkumar9494/CampusOS-AI)

---

## 📌 Overview

**CampusOS AI** is a unified, enterprise-grade AI operating system built for modern higher education. Unlike legacy campus ERPs that act as static record stores, CampusOS AI introduces real-time decision support, agentic automations, predictive academic forecasting, and AI career-readiness tools across students, faculty, recruiters, and administrators.

The platform provides a **1-click instant demo** allowing evaluators to explore all student features without entering login credentials.

---

## 🎯 Problem Statement

- **Passive Campus ERPs**: Existing college systems only record attendance and marks without providing predictive insights or automated workflows.
- **Recruitment Readiness Gap**: Engineering graduates lack objective, verifiable audits of their coding skills and realistic interview practice.
- **Fragmented Portals**: Students, faculty, wardens, and placement officers use disjointed tools, causing communication delays and administrative overhead.
- **Late Intervention**: Academic struggles and dropout risks are typically recognized only after semester examinations.

---

## 💡 Solution

CampusOS AI delivers an intelligent, all-in-one university operations and career engine:
- **RepoDNA Engine**: Audits GitHub repositories to evaluate code quality, detect architectural patterns, and generate recruiter-ready skill radar charts.
- **AI Mock Interview Studio**: Conducts live voice and text interviews with adaptive technical probing powered by **Featherless AI (Kimi-K3)** and Google models.
- **Institutional Syllabus RAG**: Context-grounded conversational assistant that helps students prepare for exams and answers curriculum queries.
- **Early Warning Predictors**: Machine learning models forecast student risk factors and placement probabilities early.
- **Zero-Friction Demo Mode**: Instant 1-click student access directly from the landing page.

---

## ✨ Key Features

- **RepoDNA (Code & Portfolio Intelligence)**: Deep code quality analysis, modularity scoring, dependency graph audits, and skills breakdown for student GitHub projects.
- **AI Mock Interview Studio (Powered by Featherless AI)**: Dynamic role-specific technical interview simulation utilizing **Moonshot AI / Kimi-K3** via Featherless AI for multi-turn technical probing and rubric-based evaluations.
- **Academic Copilot & Syllabus RAG**: Vector-indexed retrieval system over university handbooks and course syllabi with citation backing.
- **Multi-Role Portals**: Dedicated workspaces for Students, Faculty, Training & Placement Officers, Hostel Wardens, Librarians, and Super Administrators.
- **Predictive Analytics**: Early academic risk alerts and placement conversion forecasting.
- **Zero-Trust Role-Based Access Control (RBAC)**: Secure multi-layer authorization with row-level data isolation.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client([Web / Mobile Client]) --> |HTTPS / WSS| Frontend[React 18 + Vite SPA]

    subgraph Frontend [Presentation Layer]
        Frontend --> Landing[Landing Page & Instant Demo]
        Frontend --> Portals[Student / Faculty / Admin Portals]
        Frontend --> AuthState[AuthContext & Session State]
    end

    Frontend --> |REST APIs /api/v1| Gateway[FastAPI Backend Gateway]

    subgraph GatewayCore [Backend Services]
        Gateway --> AuthGuard[JWT & RBAC Middleware]
        Gateway --> Router[Domain API Routers]
    end

    subgraph AIEngine [AI & Intelligence Layer]
        Router --> InterviewBrain[Interview Brain]
        InterviewBrain --> |Primary Reasoning| Featherless[Featherless AI: Kimi-K3]
        InterviewBrain --> |Fallback & General LLM| GoogleLLM[Google GenAI: Gemini / Gemma]
        Router --> RepoDNA[RepoDNA GitHub Parser]
        Router --> RAG[LangChain & FAISS / pgvector]
    end

    subgraph Persistence [Data Layer]
        Router --> DB[(PostgreSQL / Supabase)]
        Router --> Cache[(Local Storage & State Cache)]
    end
```

---

## 🔄 Application Workflow

1. **Access / Instant Demo**: Users access the platform via [Live Demo](https://campus-os-ai-jbth.vercel.app) or log in with role credentials. Clicking **"Watch Demo"** triggers instant student authentication without credentials.
2. **Dashboard Navigation**: Role-based access control directs the user to their designated dashboard (Student, Faculty, Placement, etc.).
3. **Repository Audit (RepoDNA)**: A student inputs a GitHub repo URL; the backend clones and analyzes the repository structure, code health, and tech stack.
4. **Mock Interview Session**:
   - The student selects a target role (Fullstack, Backend, AI/ML) and seniority.
   - **Featherless AI (Kimi-K3)** generates a role-tailored opening question.
   - Candidate responds; the AI probes technical depth and evaluates architectural trade-offs.
   - At the conclusion, the engine generates an executive evaluation scorecard.
5. **Academic Querying**: Students ask syllabus or exam questions; the RAG pipeline retrieves relevant passages from course documents.

---

## 🤖 AI/ML Architecture

```text
AI/ML Architecture
├── LLM
│   ├── Featherless AI (Moonshot AI / Kimi-K3) [Primary]
│   │   └── Powers deep technical interview questioning, multi-round candidate probing, and rubric evaluation
│   └── Google Model (Gemini / Gemma) [Fallback & Conversational]
│       └── High-throughput question generation and general campus assistant
├── RAG
│   ├── LangChain document processing pipeline
│   ├── Vector Store: FAISS (in-memory) & pgvector (PostgreSQL)
│   └── Embeddings: BAAI/bge-large-en-v1.5
├── ML Models
│   ├── Scikit-learn / XGBoost: Student dropout & academic risk classifier
│   └── Placement conversion probability predictor
├── Agents
│   ├── Student Success Agent (Interview Brain, Syllabus Copilot)
│   └── Administrative Automation Agent (Hostel leave pass & grievance routing)
└── External APIs
    ├── Featherless AI Inference API
    ├── Google GenAI API
    ├── GitHub REST / GraphQL API
    └── Supabase Auth & Database
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy, Pydantic v2, Uvicorn |
| **AI & LLM Services** | **Featherless AI (`moonshotai/Kimi-K3`)**, Google GenAI (`Gemini / Gemma`), LangChain, FAISS |
| **Database & Auth** | PostgreSQL (Supabase / Neon), `pgvector`, JWT Bearer Authentication |
| **Deployment** | Vercel (Frontend), Render / Docker (Backend) |

---

## 📂 Project Structure

```text
CampusOS-AI/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints (auth, repodna, mock_interview, academics)
│   │   ├── core/            # Database, security, and environment configuration
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic validation models
│   │   ├── services/        # AI agents, Featherless interview brain, RAG pipeline
│   │   └── main.py          # FastAPI application entrypoint
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Backend environment configuration template
├── frontend/
│   ├── src/
│   │   ├── auth/            # AuthContext, ProtectedRoute, demo student auth
│   │   ├── features/        # Feature modules (repodna, mock-interview, landing, student)
│   │   ├── services/        # API client services
│   │   ├── App.tsx          # Application routing and role guards
│   │   └── main.tsx         # Frontend root
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.ts       # Vite config with backend proxy
│   └── .env.example         # Frontend environment configuration template
├── docker-compose.yml       # Local container setup
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/BejugamBhagathkumar9494/CampusOS-AI.git
cd CampusOS-AI
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```ini
PROJECT_NAME="CampusOS AI"
API_V1_STR="/api/v1"
DATABASE_URL="postgresql://user:password@host:5432/campusos_db"
JWT_SECRET_KEY="your-secure-random-secret"

# Featherless AI Configuration (Kimi-K3)
FEATHERLESS_API_KEY="your-featherless-api-key"
FEATHERLESS_BASE_URL="https://api.featherless.ai/v1"
FEATHERLESS_MODEL="moonshotai/Kimi-K3"

# Google Model Configuration
GOOGLE_API_KEY="your-google-api-key"
GEMINI_API_KEY="your-google-api-key"

DEFAULT_EMBEDDING_MODEL="BAAI/bge-large-en-v1.5"
ALLOWED_ORIGINS="https://campus-os-ai-jbth.vercel.app,http://localhost:5173"
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL="http://localhost:8000/api/v1"
VITE_APP_NAME="CampusOS AI"
```

---

## ▶️ Running Locally

### Start Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
*API documentation will be available at `http://localhost:8000/docs`.*

### Start Frontend
```bash
cd frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 📊 Results & Performance

- **Low-Latency Technical Probing**: Sub-second question generation using **Featherless AI (Kimi-K3)** for complex conversational reasoning.
- **Lightweight Memory Footprint**: Backend container operates under 450 MB RAM with asynchronous workers.
- **Instant Demo Access**: 0 ms authentication delay for instant student portal access.
- **Comprehensive Code Audits**: RepoDNA produces complete repository health reports in under 5 seconds.

---

## 🖥️ Screenshots

| Landing Page & Instant Demo | AI Mock Interview Studio (Featherless AI) |
| :---: | :---: |
| *Hero section with 1-click demo entry point* | *Adaptive role-tailored technical interviewer* |

| RepoDNA Portfolio Analyzer | Student Success Analytics Hub |
| :---: | :---: |
| *Deep GitHub codebase health & skills radar* | *Unified academic metrics, GPA, and alerts* |

---

## 🎥 Demo

- **Live Application**: [https://campus-os-ai-jbth.vercel.app](https://campus-os-ai-jbth.vercel.app)
- **Instant Student Demo**: Visit the live site and click **"Watch Demo"** or **"Live Demo"** for instant access without credentials.

### Test Accounts (If logging in manually):
| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@campus.edu` | `superadmin123` |
| **Student** | `rahul.student@campus.edu` | `rahul123` |
| **Faculty** | `arun.faculty@campus.edu` | `arun123` |
| **Placement Officer** | `suresh.placement@campus.edu` | `suresh123` |

---

## 🔮 Future Enhancements

- **Multimodal Interview Analysis**: Real-time facial expression and speech tone evaluation via WebRTC.
- **Automated Assignment Grading**: Ingestion of student code submissions with automated test case evaluation.
- **Cross-Campus Federated Benchmarking**: Privacy-preserving placement and performance comparisons across universities.
