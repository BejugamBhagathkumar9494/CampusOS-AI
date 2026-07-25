# CampusOS AI – AI-Powered University Operating System

CampusOS AI is an enterprise-grade AI-powered University Operating System that helps students, faculty, hostel wardens, librarians, transport managers, placement officers, and administrators through intelligent automation, AI agents, machine learning, and predictive analytics.

Unlike traditional college ERP systems, CampusOS AI focuses on decision support, recommendations, forecasting, and automation.

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
