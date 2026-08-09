# CampusOS AI – AI-Powered University Operating System

CampusOS AI is an enterprise-grade AI-powered University Operating System that helps students, faculty, hostel wardens, librarians, transport managers, placement officers, and administrators through intelligent automation, AI agents, machine learning, and predictive analytics.

Unlike traditional college ERP systems, CampusOS AI focuses on decision support, recommendations, forecasting, and automation.

---

## 🚀 Supabase Integration & Setup

The backend is fully configured for production deployment using Supabase. For complete details on deploying the SQL database migrations, configuring Row Level Security (RLS) policies, and setting up environment variables, please refer to the **[Supabase Integration & Configuration Guide](supabase_integration_guide.md)**.

---

## Tech Stack

### Frontend
- **Framework:** React 18 (TypeScript, Vite)
- **Styling:** Tailwind CSS, Shadcn UI, Framer Motion
- **State Management & Fetching:** React Query (TanStack Query), React Context
- **Routing:** React Router DOM
- **Forms & Validation:** React Hook Form, Zod
- **Visualization:** Recharts

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database ORM:** SQLAlchemy with Alembic migrations
- **Database:** PostgreSQL (with `pgvector` & `uuid-ossp` extensions)
- **Auth:** JWT (OAuth2, Google & Microsoft OAuth)
- **Task Queue (Optional):** Celery + Redis

### AI & ML Stack
- **Orchestration:** LangGraph (AI Multi-Agents)
- **LLMs:** OpenAI GPT, Llama 3, Mistral
- **Embeddings:** BAAI/bge-large-en-v1.5
- **Vector Search:** pgvector
- **Machine Learning:** Scikit-learn, XGBoost, LightGBM
- **OCR & Speech:** PaddleOCR, OpenAI Whisper

---

## Project Directory Structure

```text
CampusOS-AI/
├── backend/                  # FastAPI Backend application
│   ├── app/
│   │   ├── api/              # API routes (v1)
│   │   ├── core/             # Configuration, security, database
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic schemas for request/response validation
│   │   ├── services/         # ML models & AI Agent implementation
│   │   │   ├── ai_agents/    # LangGraph multi-agents
│   │   │   └── ml_models/    # Scikit-learn/XGBoost prediction scripts
│   │   └── main.py           # Application entrypoint
│   ├── Dockerfile
│   ├── requirements.txt      # Python dependencies
│   └── .env.example
├── frontend/                 # React Frontend application
│   ├── src/
│   │   ├── components/       # Shadcn UI and global layout components
│   │   ├── features/         # 18 Modular components (Dashboard, Hostel, Library, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API integration services (Axios/Fetch)
│   │   ├── utils/            # Shared utility functions
│   │   ├── App.tsx           # React router configurations
│   │   ├── index.css         # Styling system & dark-mode configurations
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── .env.example
├── docker-compose.yml        # Development environment services (Postgres, Redis)
└── README.md                 # Project README
```

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python (v3.10+)

### Setup Database & Services
Run the following command to start PostgreSQL (with pgvector) and Redis:
```bash
docker-compose up -d
```

### Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables template and configure it:
   ```bash
   cp .env.example .env
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The Swagger docs will be available at `http://localhost:8000/docs`.

### Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install NPM dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

The application will be accessible at `http://localhost:5173`.

---

## 🔒 CampusOS Authentication & Authorization System

CampusOS implements a zero-trust, multi-layered security architecture ensuring that **every user can only access features and data they are authorized to access**.

### Security Architecture

```text
                    CAMPUSOS AI
                         |
                         v
                  Authentication
                         |
                         v
                   Supabase Auth
                         |
                         v
                 Authenticated User
                         |
                         v
                    User Profile
                         |
               ┌─────────┴─────────┐
               v                   v
           ROLE CHECK          USER ID CHECK
        (Level 1 - RBAC)    (Level 2 - Owner Data)
               |                   |
               └─────────┬─────────┘
                         v
                  PERMISSION CHECK
                         v
               DATABASE / RLS POLICIES
                         v
                 Authorized Data & Features
                         v
                 Role-Specific Dashboard
```

### Access Control Levels

1. **Level 1: Role-Based Access Control (RBAC):**
   - Standardized database role identifiers: `student`, `faculty`, `admin`, `hostel_warden`, `placement_officer`, `super_admin`.
   - Restricts UI routes and API endpoints to permitted roles.

2. **Level 2: User-Specific Data Isolation:**
   - Enforces ownership queries (`WHERE user_id = authenticated_user_id`) and Row Level Security (RLS) policies on database tables (`profiles`, `students`, `attendance`, `marks`, `complaints`, `applications`).
   - Prevents parameter manipulation in client requests from accessing another user's private data.

### Key Security Rules

- **Zero-Trust Role Requests:** Requested roles during signup are validated against `authorized_users`. Self-registration as `admin` or `super_admin` is strictly blocked.
- **Role-Free Login:** Login requires Email and Password only; roles are loaded securely from database profiles.
- **Account Approval & Status:** Profiles carry status flags (`pending`, `active`, `suspended`, `rejected`). Only authorized Admins / Super Admins can approve or suspend accounts.
- **Audit Logging:** Security events (`LOGIN`, `LOGOUT`, `USER_CREATED`, `USER_APPROVED`, `USER_SUSPENDED`, `ADMIN_CREATED`) are logged in `audit_logs`.

### Pre-Approved Test Accounts (Development)

| Institution ID | Email | Role | Default Password |
| :--- | :--- | :--- | :--- |
| `SA001` | `superadmin@campus.edu` | `super_admin` | `superadmin123` |
| `ADM001` | `admin1@campus.edu` | `admin` | `admin123` |
| `STU001` | `rahul.student@campus.edu` | `student` | `rahul123` |
| `STU002` | `priya.student@campus.edu` | `student` | `priya123` |
| `FAC001` | `arun.faculty@campus.edu` | `faculty` | `arun123` |
| `WAR001` | `ramesh.warden@campus.edu` | `hostel_warden` | `ramesh123` |
| `PO001` | `suresh.placement@campus.edu` | `placement_officer` | `suresh123` |

