import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Search,
  Layers, Code2, Database, ShieldCheck, Cpu, FileCode,
  Sparkles, ExternalLink, MessageSquare, ArrowRight, Compass,
  ChevronRight, Filter, Info, X, GitBranch, Terminal,
  CheckCircle2, BookOpen, Workflow, Server, HardDrive, KeyRound
} from 'lucide-react';
import { StudyRepository, RepositoryAnalysis, RepositoryFileItem } from '../types';

interface RepoMindmapViewProps {
  repository: StudyRepository;
  analysis: RepositoryAnalysis;
  files: RepositoryFileItem[];
  onAskAI?: (question: string) => void;
}

interface MindmapNode {
  id: string;
  name: string;
  category: 'root' | 'frontend' | 'backend' | 'database' | 'ai' | 'security' | 'core';
  level: number; // 0 = root, 1 = domain branch, 2 = module/service, 3 = file/endpoint
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  details: {
    title: string;
    role: string;
    path?: string;
    tech?: string[];
    functions?: string[];
    endpoints?: string[];
    models?: string[];
    excerpt?: string;
    connections?: string[];
  };
  children?: MindmapNode[];
}

export const RepoMindmapView: React.FC<RepoMindmapViewProps> = ({
  repository,
  analysis,
  files,
  onAskAI
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'radial' | 'tree'>('radial');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'branch-frontend': true,
    'branch-backend': true,
    'branch-database': true,
    'branch-ai': true,
    'branch-security': true,
    'branch-core': true
  });

  // Toggle node expand/collapse
  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Build True Repository Mindmap Graph Data
  const graphData = useMemo<MindmapNode>(() => {
    const rootName = repository.repo_name || 'CampusOS AI';
    const branches: MindmapNode[] = [];

    // Helper to clean file names
    const getCleanName = (path: string) => {
      const parts = path.replace(/\\/g, '/').split('/');
      return parts.pop() || path;
    };

    // Filter meaningful files (ignore __init__, lockfiles, installer artifacts)
    const meaningfulFiles = files.filter(f => {
      const p = f.file_path.toLowerCase();
      return !p.includes('__init__') && !p.includes('__pycache__') && !p.includes('node_modules') && !p.endsWith('.lock');
    });

    // 1. FRONTEND ARCHITECTURE BRANCH
    const frontendFiles = meaningfulFiles.filter(f => 
      f.file_path.toLowerCase().includes('frontend') || 
      f.file_path.toLowerCase().includes('src/') || 
      f.file_path.endsWith('.tsx') || 
      f.file_path.endsWith('.jsx') ||
      f.file_path.endsWith('.css')
    );
    const frontendTech = analysis?.tech_stack?.frontend || ['React', 'TypeScript', 'TailwindCSS', 'Vite'];
    
    branches.push({
      id: 'branch-frontend',
      name: 'Frontend UI & Client',
      category: 'frontend',
      level: 1,
      color: '#06b6d4',
      bgColor: '#083344',
      borderColor: '#06b6d4',
      icon: '🎨',
      details: {
        title: 'Frontend Application & User Interface',
        role: 'Client-side SPA built with React and Vite. Provides responsive student dashboards, interactive AI study workspaces, and real-time visualization.',
        tech: frontendTech,
        connections: ['branch-backend', 'branch-ai']
      },
      children: [
        {
          id: 'fe-dashboards',
          name: 'Dashboard & Layouts',
          category: 'frontend',
          level: 2,
          color: '#38bdf8',
          bgColor: '#0c4a6e',
          borderColor: '#38bdf8',
          icon: '📊',
          details: {
            title: 'Student Dashboard & Navigation',
            role: 'Manages multi-tier sidebar navigation, student metrics, quick access cards, and role-based views.',
            path: 'frontend/src/components/layout/DashboardLayout.tsx',
            tech: ['React', 'Lucide Icons', 'TailwindCSS']
          }
        },
        {
          id: 'fe-exam-prep',
          name: 'AI Exam Prep Hub',
          category: 'frontend',
          level: 2,
          color: '#38bdf8',
          bgColor: '#0c4a6e',
          borderColor: '#38bdf8',
          icon: '📚',
          details: {
            title: 'Exam Preparation UI',
            role: 'Multi-PDF ingestion portal, categorized 2/4/10 marks answer viewer, chapter summaries, and One-Day revision sheets.',
            path: 'frontend/src/features/exam-prep/ExamPrepPage.tsx',
            tech: ['TypeScript', 'PDF Processing', 'Reactive State']
          }
        },
        {
          id: 'fe-repodna',
          name: 'RepoDNA Intelligence UI',
          category: 'frontend',
          level: 2,
          color: '#38bdf8',
          bgColor: '#0c4a6e',
          borderColor: '#38bdf8',
          icon: '🧬',
          details: {
            title: 'RepoDNA Interactive Portal',
            role: 'GitHub repository intelligence visualizer, NotebookLM-style radial mindmap, architecture inspector, and grounded codebase chat.',
            path: 'frontend/src/features/repodna/RepoDNAPage.tsx',
            tech: ['SVG Graph Engine', 'Interactive Mindmap', 'RAG Chat']
          }
        },
        ...frontendFiles.slice(0, 3).map(f => ({
          id: `file-${f.id || f.file_path}`,
          name: getCleanName(f.file_path),
          category: 'frontend' as const,
          level: 2,
          color: '#7dd3fc',
          bgColor: '#164e63',
          borderColor: '#7dd3fc',
          icon: '📄',
          details: {
            title: getCleanName(f.file_path),
            role: f.purpose_summary || 'Component handling interactive client-side operations.',
            path: f.file_path,
            tech: [f.language || 'TypeScript'],
            excerpt: f.excerpt
          }
        }))
      ]
    });

    // 2. BACKEND API & ROUTERS BRANCH
    const backendFiles = meaningfulFiles.filter(f => 
      f.file_path.toLowerCase().includes('backend') || 
      f.file_path.toLowerCase().includes('api') || 
      f.file_path.endsWith('.py') || 
      f.file_path.endsWith('.go')
    );
    const backendTech = analysis?.tech_stack?.backend || ['FastAPI', 'Python', 'Uvicorn', 'Pydantic'];
    const apis = analysis?.api_analysis || [];

    branches.push({
      id: 'branch-backend',
      name: 'Backend APIs & Routes',
      category: 'backend',
      level: 1,
      color: '#a855f7',
      bgColor: '#3b0764',
      borderColor: '#a855f7',
      icon: '⚙️',
      details: {
        title: 'Backend API & Business Logic Server',
        role: 'High-performance asynchronous FastAPI server handling HTTP requests, RAG embeddings, background processing, and database transactions.',
        tech: backendTech,
        endpoints: apis.map(a => `${a.method} ${a.endpoint}`),
        connections: ['branch-database', 'branch-security', 'branch-ai']
      },
      children: [
        {
          id: 'be-repodna-router',
          name: 'RepoDNA API Router',
          category: 'backend',
          level: 2,
          color: '#c084fc',
          bgColor: '#581c87',
          borderColor: '#c084fc',
          icon: '⚡',
          details: {
            title: 'RepoDNA API Endpoints',
            role: 'Handles repository URL ingestion, public GitHub scanning, AST code extraction, and codebase grounded Q&A.',
            path: 'backend/app/api/v1/repodna.py',
            endpoints: ['POST /api/v1/repodna/analyze', 'POST /api/v1/repodna/query', 'GET /api/v1/repodna/repositories'],
            tech: ['FastAPI', 'AsyncIO', 'HTTPX']
          }
        },
        {
          id: 'be-exam-router',
          name: 'Exam Prep Router',
          category: 'backend',
          level: 2,
          color: '#c084fc',
          bgColor: '#581c87',
          borderColor: '#c084fc',
          icon: '⚡',
          details: {
            title: 'Exam Preparation API Endpoints',
            role: 'Manages multi-unit PDF uploads, automatic 2/4/10 marks model answer generation, chapter summaries, and revision sheets.',
            path: 'backend/app/api/v1/exam_prep.py',
            endpoints: ['POST /api/v1/exam-prep/collections', 'POST /api/v1/exam-prep/upload-multiple', 'POST /api/v1/exam-prep/generate'],
            tech: ['FastAPI', 'SQLAlchemy', 'Gemini LLM']
          }
        },
        {
          id: 'be-ai-router',
          name: 'AI Assistant Router',
          category: 'backend',
          level: 2,
          color: '#c084fc',
          bgColor: '#581c87',
          borderColor: '#c084fc',
          icon: '🤖',
          details: {
            title: 'CampusOS AI Assistant Router',
            role: 'Unified conversational agent with role-based grounded vector search and academic intelligence.',
            path: 'backend/app/api/v1/ai.py',
            endpoints: ['POST /api/v1/ai/chat', 'POST /api/v1/ai/knowledge/upload'],
            tech: ['LangChain', 'pgvector', 'Agentic Supervisor']
          }
        }
      ]
    });

    // 3. DATABASE & DATA SCHEMAS BRANCH
    const dbTech = analysis?.tech_stack?.database || ['PostgreSQL', 'Supabase', 'SQLAlchemy', 'pgvector'];
    const models = analysis?.database_analysis?.models || [];

    branches.push({
      id: 'branch-database',
      name: 'Database & Schemas',
      category: 'database',
      level: 1,
      color: '#10b981',
      bgColor: '#022c22',
      borderColor: '#10b981',
      icon: '🗄️',
      details: {
        title: 'Database & Entity Schemas',
        role: 'PostgreSQL relational database with Supabase integration and pgvector embeddings for vector similarity search.',
        tech: dbTech,
        models: models.map(m => m.name),
        connections: ['branch-backend']
      },
      children: [
        {
          id: 'db-users',
          name: 'User & Auth Models',
          category: 'database',
          level: 2,
          color: '#34d399',
          bgColor: '#064e3b',
          borderColor: '#34d399',
          icon: '👤',
          details: {
            title: 'User & Role Tables',
            role: 'Stores student profiles, hashed credentials, roles, and institutional references.',
            path: 'backend/app/models/database_models.py',
            tech: ['SQLAlchemy', 'PostgreSQL']
          }
        },
        {
          id: 'db-repodna-tables',
          name: 'StudyRepository Models',
          category: 'database',
          level: 2,
          color: '#34d399',
          bgColor: '#064e3b',
          borderColor: '#34d399',
          icon: '📦',
          details: {
            title: 'RepoDNA Repository Tables',
            role: 'Stores analyzed repositories, file AST metadata, repository chunks, vector embeddings, and intelligence reports.',
            path: 'backend/app/models/database_models.py (StudyRepository, RepositoryFile, RepositoryAnalysis)',
            tech: ['PostgreSQL', 'pgvector']
          }
        },
        {
          id: 'db-exam-tables',
          name: 'Exam Prep Tables',
          category: 'database',
          level: 2,
          color: '#34d399',
          bgColor: '#064e3b',
          borderColor: '#34d399',
          icon: '📑',
          details: {
            title: 'StudyCollection & Exam Material Tables',
            role: 'Persists subject collections, PDF chunks, generated 2/4/10 marks questions, summaries, and One-Day revision sheets.',
            path: 'backend/app/models/database_models.py (StudyCollection, StudyChunk, GeneratedExamMaterial)',
            tech: ['SQLAlchemy', 'pgvector']
          }
        }
      ]
    });

    // 4. AI & CORE RAG SERVICES BRANCH
    branches.push({
      id: 'branch-ai',
      name: 'AI Engine & Grounded RAG',
      category: 'ai',
      level: 1,
      color: '#ec4899',
      bgColor: '#4c0519',
      borderColor: '#ec4899',
      icon: '🧠',
      details: {
        title: 'CampusOS AI & RAG Engine',
        role: 'Semantic vector retrieval, Gemini LLM prompt orchestration, anti-hallucination verification, and codebase AST extraction.',
        tech: ['Google Gemini API', 'LangChain', 'pgvector', 'NumPy'],
        connections: ['branch-backend', 'branch-frontend']
      },
      children: [
        {
          id: 'ai-exam-generator',
          name: 'Exam Material Generator',
          category: 'ai',
          level: 2,
          color: '#f472b6',
          bgColor: '#831843',
          borderColor: '#f472b6',
          icon: '✨',
          details: {
            title: 'Exam Note & Question Orchestrator',
            role: 'Generates 5 distinct 2-mark, 5 distinct 4-mark, and 5 distinct 10-mark model answers strictly grounded in student notes without duplicates.',
            path: 'backend/app/services/exam_prep/generator.py',
            tech: ['Gemini 1.5 / 2.0', 'Prompt Templates', 'Anti-Hallucination']
          }
        },
        {
          id: 'ai-repodna-engine',
          name: 'RepoDNA Generator',
          category: 'ai',
          level: 2,
          color: '#f472b6',
          bgColor: '#831843',
          borderColor: '#f472b6',
          icon: '🧬',
          details: {
            title: 'RepoDNA Intelligence Pipeline',
            role: 'Analyzes architecture, detected tech stacks, application flows, database schemas, and powers grounded codebase chat.',
            path: 'backend/app/services/repodna/repodna_generator.py',
            tech: ['AST Parser', 'Semantic Chunker', 'Gemini LLM']
          }
        },
        {
          id: 'ai-pdf-processor',
          name: 'PDF Extraction Engine',
          category: 'ai',
          level: 2,
          color: '#f472b6',
          bgColor: '#831843',
          borderColor: '#f472b6',
          icon: '📄',
          details: {
            title: 'PDF & Document Ingestion',
            role: 'Multi-page text extraction, unit detection, OCR fallbacks, and semantic chunking with page number citations.',
            path: 'backend/app/services/exam_prep/pdf_processor.py',
            tech: ['PyPDF2', 'PDFPlumber', 'Regex Chunker']
          }
        }
      ]
    });

    // 5. SECURITY & AUTHENTICATION BRANCH
    const authInfo = analysis?.authentication_analysis;
    branches.push({
      id: 'branch-security',
      name: 'Security & Auth',
      category: 'security',
      level: 1,
      color: '#f59e0b',
      bgColor: '#451a03',
      borderColor: '#f59e0b',
      icon: '🔐',
      details: {
        title: 'Authentication & Access Control',
        role: 'Dual-token JWT validation, Supabase Auth integration, session guards, and role-based access control (Student, Faculty, Admin).',
        tech: [authInfo?.type || 'JWT + Supabase Auth', 'OAuth2 Bearer', 'RBAC'],
        connections: ['branch-backend']
      },
      children: [
        {
          id: 'sec-deps',
          name: 'Auth Dependency Guard',
          category: 'security',
          level: 2,
          color: '#fbbf24',
          bgColor: '#78350f',
          borderColor: '#fbbf24',
          icon: '🛡️',
          details: {
            title: 'get_current_user Dependency',
            role: 'Intercepts Bearer tokens, validates JWT claims, resolves Supabase Auth sessions, and isolates student data.',
            path: 'backend/app/api/deps.py',
            tech: ['FastAPI Depends', 'PyJWT', 'OAuth2PasswordBearer']
          }
        },
        {
          id: 'sec-cors',
          name: 'CORS & Security Middleware',
          category: 'security',
          level: 2,
          color: '#fbbf24',
          bgColor: '#78350f',
          borderColor: '#fbbf24',
          icon: '🌐',
          details: {
            title: 'CORS Preflight & Security Headers',
            role: 'Configures allowed origins regex for Vercel preview domains and localhost ports, preventing 400 Bad Request preflights.',
            path: 'backend/app/main.py',
            tech: ['CORSMiddleware', 'Uvicorn']
          }
        }
      ]
    });

    // 6. CORE UTILITIES & INFRASTRUCTURE BRANCH
    branches.push({
      id: 'branch-core',
      name: 'Core & Scanner Engine',
      category: 'core',
      level: 1,
      color: '#6366f1',
      bgColor: '#1e1b4b',
      borderColor: '#6366f1',
      icon: '🛠️',
      details: {
        title: 'Core Repository Scanner & Workspace Engine',
        role: 'Downloads public GitHub repos via archive zipball or falls back to local workspace scanning for private developer projects.',
        tech: ['HTTPX', 'ZipFile', 'Python AST', 'Hashlib'],
        connections: ['branch-backend', 'branch-ai']
      },
      children: [
        {
          id: 'core-scanner',
          name: 'GitHub Scanner & Fallback',
          category: 'core',
          level: 2,
          color: '#818cf8',
          bgColor: '#312e81',
          borderColor: '#818cf8',
          icon: '🔍',
          details: {
            title: 'GitHub Repository Scanner',
            role: 'Scans repositories, filters ignored dependencies, extracts AST manifests, and scans local project files on private 404s.',
            path: 'backend/app/services/repodna/github_scanner.py',
            tech: ['HTTPX', 'ZipFile', 'AST']
          }
        },
        {
          id: 'core-tech-detector',
          name: 'Tech Stack Detector',
          category: 'core',
          level: 2,
          color: '#818cf8',
          bgColor: '#312e81',
          borderColor: '#818cf8',
          icon: '🔬',
          details: {
            title: 'Technology & Framework Detector',
            role: 'Inspects package.json, requirements.txt, go.mod, and imports to detect frontend frameworks, databases, and libraries.',
            path: 'backend/app/services/repodna/tech_detector.py',
            tech: ['JSON Parser', 'Heuristic Engine']
          }
        }
      ]
    });

    return {
      id: 'root-repo',
      name: rootName,
      category: 'root',
      level: 0,
      color: '#6366f1',
      bgColor: '#1e1b4b',
      borderColor: '#818cf8',
      icon: '🧬',
      details: {
        title: `${repository.owner} / ${repository.repo_name}`,
        role: analysis?.one_line_desc || repository.description || 'Full-Stack Software Architecture',
        tech: [repository.primary_language || 'TypeScript', `${files.length} Analyzed Files`, repository.default_branch || 'main']
      },
      children: branches
    };
  }, [repository, analysis, files]);

  // Position nodes radially around center with generous spacing and collision avoidance
  const layoutGraph = useMemo(() => {
    const width = 1300;
    const height = 1000;
    const centerX = width / 2;
    const centerY = height / 2;

    const positionedNodes: (MindmapNode & { x: number; y: number; parentX?: number; parentY?: number; isExpanded?: boolean })[] = [];
    const links: { source: { x: number; y: number }; target: { x: number; y: number }; color: string }[] = [];

    // Root node
    positionedNodes.push({
      ...graphData,
      x: centerX,
      y: centerY,
      isExpanded: true
    });

    if (layoutMode === 'radial') {
      const branchCount = graphData.children?.length || 6;
      const branchRadius = 260;

      graphData.children?.forEach((branch, bIdx) => {
        // Distribute 6 branches evenly in a 360-degree circle
        const angle = (bIdx / branchCount) * 2 * Math.PI - Math.PI / 2;
        const bx = centerX + branchRadius * Math.cos(angle);
        const by = centerY + branchRadius * Math.sin(angle);

        const isBranchExpanded = expandedNodes[branch.id] !== false;

        positionedNodes.push({
          ...branch,
          x: bx,
          y: by,
          parentX: centerX,
          parentY: centerY,
          isExpanded: isBranchExpanded
        });

        links.push({
          source: { x: centerX, y: centerY },
          target: { x: bx, y: by },
          color: branch.color
        });

        // Children of branch
        if (isBranchExpanded && branch.children && branch.children.length > 0) {
          const childCount = branch.children.length;
          const childRadius = 175;
          // Calculate spread fan angle based on count
          const spreadAngle = Math.min(1.4, (childCount - 1) * 0.35 + 0.4);

          branch.children.forEach((child, cIdx) => {
            const childAngle = childCount === 1 
              ? angle 
              : angle - spreadAngle / 2 + (cIdx / (childCount - 1)) * spreadAngle;

            const cx = bx + childRadius * Math.cos(childAngle);
            const cy = by + childRadius * Math.sin(childAngle);

            positionedNodes.push({
              ...child,
              x: cx,
              y: cy,
              parentX: bx,
              parentY: by
            });

            links.push({
              source: { x: bx, y: by },
              target: { x: cx, y: cy },
              color: child.color
            });
          });
        }
      });
    } else {
      // Horizontal Hierarchical Tree Flow (NotebookLM / MindNode Style)
      const branchCount = graphData.children?.length || 6;
      const leftBranches = graphData.children?.slice(0, Math.ceil(branchCount / 2)) || [];
      const rightBranches = graphData.children?.slice(Math.ceil(branchCount / 2)) || [];

      // Right Side Branches
      const rightSpacingY = height / (rightBranches.length + 1);
      rightBranches.forEach((branch, bIdx) => {
        const bx = centerX + 260;
        const by = rightSpacingY * (bIdx + 1);
        const isBranchExpanded = expandedNodes[branch.id] !== false;

        positionedNodes.push({
          ...branch,
          x: bx,
          y: by,
          parentX: centerX,
          parentY: centerY,
          isExpanded: isBranchExpanded
        });

        links.push({
          source: { x: centerX, y: centerY },
          target: { x: bx, y: by },
          color: branch.color
        });

        if (isBranchExpanded && branch.children) {
          const childSpacing = 42;
          const startY = by - ((branch.children.length - 1) * childSpacing) / 2;

          branch.children.forEach((child, cIdx) => {
            const cx = bx + 220;
            const cy = startY + cIdx * childSpacing;

            positionedNodes.push({
              ...child,
              x: cx,
              y: cy,
              parentX: bx,
              parentY: by
            });

            links.push({
              source: { x: bx, y: by },
              target: { x: cx, y: cy },
              color: child.color
            });
          });
        }
      });

      // Left Side Branches
      const leftSpacingY = height / (leftBranches.length + 1);
      leftBranches.forEach((branch, bIdx) => {
        const bx = centerX - 260;
        const by = leftSpacingY * (bIdx + 1);
        const isBranchExpanded = expandedNodes[branch.id] !== false;

        positionedNodes.push({
          ...branch,
          x: bx,
          y: by,
          parentX: centerX,
          parentY: centerY,
          isExpanded: isBranchExpanded
        });

        links.push({
          source: { x: centerX, y: centerY },
          target: { x: bx, y: by },
          color: branch.color
        });

        if (isBranchExpanded && branch.children) {
          const childSpacing = 42;
          const startY = by - ((branch.children.length - 1) * childSpacing) / 2;

          branch.children.forEach((child, cIdx) => {
            const cx = bx - 220;
            const cy = startY + cIdx * childSpacing;

            positionedNodes.push({
              ...child,
              x: cx,
              y: cy,
              parentX: bx,
              parentY: by
            });

            links.push({
              source: { x: bx, y: by },
              target: { x: cx, y: cy },
              color: child.color
            });
          });
        }
      });
    }

    return { nodes: positionedNodes, links, width, height, centerX, centerY };
  }, [graphData, layoutMode, expandedNodes]);

  // Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('.interactive-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.35), 2.8));
  };

  const resetView = () => {
    setZoom(0.9);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // Search Filter
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim() && activeCategoryFilter === 'all') return null;
    const q = searchQuery.toLowerCase();
    const matching = new Set<string>();

    layoutGraph.nodes.forEach(n => {
      const matchSearch = !q || n.name.toLowerCase().includes(q) || n.details?.role?.toLowerCase().includes(q) || n.details?.title?.toLowerCase().includes(q);
      const matchCat = activeCategoryFilter === 'all' || n.category === activeCategoryFilter;
      if (matchSearch && matchCat) {
        matching.add(n.id);
      }
    });
    return matching;
  }, [searchQuery, activeCategoryFilter, layoutGraph.nodes]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl transition-all duration-300 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[780px]'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Starry Orbit Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

      {/* TOP CONTROLS & SEARCH BAR */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search components, APIs, models, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-48 sm:w-72 shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-lg">
            <button
              onClick={() => setLayoutMode('radial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'radial'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Radial Mindmap
            </button>
            <button
              onClick={() => setLayoutMode('tree')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'tree'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" /> Hierarchical Tree
            </button>
          </div>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.8))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.35))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-1" />
          <button
            onClick={resetView}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SVG INTERACTIVE GRAPH CANVAS */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`0 0 ${layoutGraph.width} ${layoutGraph.height}`}
      >
        <g transform={`translate(${pan.x + (1 - zoom) * (layoutGraph.width / 2)}, ${pan.y + (1 - zoom) * (layoutGraph.height / 2)}) scale(${zoom})`}>
          
          {/* Radial Orbital Guide Rings (Only in Radial Mode) */}
          {layoutMode === 'radial' && (
            <>
              <circle
                cx={layoutGraph.centerX}
                cy={layoutGraph.centerY}
                r={260}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                className="opacity-50"
              />
              <circle
                cx={layoutGraph.centerX}
                cy={layoutGraph.centerY}
                r={435}
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.5"
                strokeDasharray="3 5"
                className="opacity-30"
              />
            </>
          )}

          {/* Smooth Curving Connecting Links */}
          {layoutGraph.links.map((link, idx) => {
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const cx = (link.source.x + link.target.x) / 2;
            const cy = (link.source.y + link.target.y) / 2 - (layoutMode === 'radial' ? 12 : 0);

            return (
              <path
                key={idx}
                d={`M ${link.source.x} ${link.source.y} Q ${cx} ${cy} ${link.target.x} ${link.target.y}`}
                fill="none"
                stroke={link.color}
                strokeWidth="2.2"
                strokeOpacity="0.5"
                strokeLinecap="round"
                className="transition-all duration-300 hover:stroke-opacity-100 hover:stroke-width-3"
              />
            );
          })}

          {/* Graph Nodes */}
          {layoutGraph.nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isDimmed = filteredNodeIds && !filteredNodeIds.has(node.id);
            const isRoot = node.level === 0;
            const isBranch = node.level === 1;
            const radius = isRoot ? 40 : isBranch ? 28 : 16;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                className={`interactive-node cursor-pointer transition-transform duration-200 ${
                  isDimmed ? 'opacity-20' : 'opacity-100'
                } hover:scale-110`}
              >
                {/* Node Outer Halo / Pulsator */}
                {isRoot && (
                  <circle
                    r="50"
                    fill={node.color}
                    className="opacity-20 animate-ping"
                  />
                )}
                {isSelected && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node Bubble */}
                <circle
                  r={radius}
                  fill={node.bgColor}
                  stroke={node.borderColor}
                  strokeWidth={isRoot ? '3.5' : isBranch ? '2.8' : '2'}
                  style={{ filter: `drop-shadow(0 0 14px ${node.color}66)` }}
                />

                {/* Node Icon */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isRoot ? '20' : isBranch ? '14' : '10'}
                  className="pointer-events-none select-none"
                >
                  {node.icon}
                </text>

                {/* Expand/Collapse Badge on Branch Nodes */}
                {isBranch && node.children && node.children.length > 0 && (
                  <g
                    transform={`translate(${radius - 4}, ${-radius + 4})`}
                    onClick={(e) => toggleExpand(node.id, e)}
                    className="cursor-pointer hover:scale-125 transition-transform"
                  >
                    <circle r="8" fill="#1e293b" stroke={node.borderColor} strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {node.isExpanded ? '−' : '+'}
                    </text>
                  </g>
                )}

                {/* Node Label Card */}
                <g transform={`translate(0, ${radius + 14})`}>
                  <rect
                    x={-Math.min(90, (node.name.length * 4.2) + 12)}
                    y="-10"
                    width={Math.min(180, (node.name.length * 8.4) + 24)}
                    height="20"
                    rx="8"
                    fill="#090d16"
                    stroke={isSelected ? '#ffffff' : '#334155'}
                    strokeWidth="1"
                    className="opacity-90 drop-shadow-md"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : '#e2e8f0'}
                    fontSize={isRoot ? '12' : isBranch ? '11' : '10'}
                    fontWeight={isRoot ? '800' : isBranch ? '700' : '600'}
                    className="pointer-events-none drop-shadow-sm"
                  >
                    {node.name.length > 24 ? `${node.name.slice(0, 22)}...` : node.name}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* FLOATING DEEP INSPECTOR DRAWER */}
      {selectedNode && (
        <div className="absolute right-4 top-20 bottom-4 w-84 sm:w-[410px] bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-700/80 p-6 shadow-2xl z-30 flex flex-col justify-between animate-fade-in pointer-events-auto">
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg border"
                  style={{ backgroundColor: selectedNode.bgColor, borderColor: selectedNode.borderColor }}
                >
                  {selectedNode.icon}
                </span>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    {selectedNode.details.title || selectedNode.name}
                  </h3>
                  <span
                    className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ backgroundColor: `${selectedNode.color}22`, color: selectedNode.color, border: `1px solid ${selectedNode.color}55` }}
                  >
                    {selectedNode.category} Layer • Level {selectedNode.level}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Architectural Role & Purpose */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-1.5 shadow-inner">
              <span className="block text-[10px] uppercase font-black text-indigo-400 tracking-wider">
                Architectural Role & Description
              </span>
              <p className="font-medium text-slate-300">
                {selectedNode.details.role}
              </p>
            </div>

            {/* File Path */}
            {selectedNode.details.path && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-cyan-300">
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{selectedNode.details.path}</span>
              </div>
            )}

            {/* Technologies & Frameworks */}
            {selectedNode.details.tech && selectedNode.details.tech.length > 0 && (
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                  Technologies / Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.details.tech.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 text-[11px] font-bold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* API Endpoints */}
            {selectedNode.details.endpoints && selectedNode.details.endpoints.length > 0 && (
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                  Associated API Endpoints
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedNode.details.endpoints.map((ep, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{ep}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Database Models */}
            {selectedNode.details.models && selectedNode.details.models.length > 0 && (
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                  Database Models & Tables
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.details.models.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <Database className="w-3 h-3" /> {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source Code Excerpt */}
            {selectedNode.details.excerpt && (
              <div>
                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                  Source Excerpt
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 max-h-32 overflow-y-auto overflow-x-auto whitespace-pre leading-snug">
                  {selectedNode.details.excerpt}
                </pre>
              </div>
            )}
          </div>

          {/* Action: Ask AI Deep Dive */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (onAskAI) {
                  onAskAI(`Explain in detail how '${selectedNode.details.title || selectedNode.name}' functions in this repository, its architectural role, dependencies, and code implementation.`);
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Ask AI About This Component
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM LEGEND & HELPER BAR */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-3 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 text-xs text-slate-300 shadow-xl">
        <span className="font-extrabold text-white flex items-center gap-1.5 mr-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" /> Repository Mindmap:
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Frontend UI
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Backend APIs
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Database
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400" /> AI & RAG
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Security
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Core
        </span>
      </div>
    </div>
  );
};
