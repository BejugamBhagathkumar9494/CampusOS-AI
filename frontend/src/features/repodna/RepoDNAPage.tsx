import React, { useState, useEffect, useRef } from 'react';
import {
  GitBranch, GitFork, Star, Terminal, Code2, Layers, Cpu, Database,
  ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Sparkles,
  BookOpen, FolderTree, FileCode, Check, Copy, HelpCircle,
  MessageSquare, Send, RefreshCw, Trash2, ChevronDown, ChevronUp,
  Activity, ExternalLink, Zap, Compass, Info, ArrowUpRight
} from 'lucide-react';
import { repoDnaService } from './services/repoDnaService';
import { RepoMindmapView } from './components/RepoMindmapView';
import { MermaidDiagram } from './components/MermaidDiagram';
import {
  StudyRepository,
  RepositoryAnalysis,
  RepositoryFileItem,
  RepoQueryResponse
} from './types';

const SCAN_STEPS = [
  "Validating repository & checking permissions",
  "Reading folder structure & prioritizing manifests",
  "Analyzing source files & extracting AST metadata",
  "Understanding system architecture & data flows",
  "Building semantic vector knowledge base",
  "Generating student-friendly RepoDNA intelligence report"
];

export default function RepoDNAPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Repositories & Active Selection
  const [repositories, setRepositories] = useState<StudyRepository[]>([]);
  const [activeRepo, setActiveRepo] = useState<StudyRepository | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [files, setFiles] = useState<RepositoryFileItem[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<
    'overview' | 'mindmap' | 'architecture' | 'structure' | 'tech' | 'flows' | 'database' | 'apis' | 'auth' | 'files' | 'health' | 'interview' | 'chat'
  >('overview');
  
  // UI Helpers
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [selectedFileModal, setSelectedFileModal] = useState<RepositoryFileItem | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: string[] }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserRepositories();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      setScanStepIndex(0);
      interval = setInterval(() => {
        setScanStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const loadUserRepositories = async () => {
    try {
      const list = await repoDnaService.getUserRepositories();
      setRepositories(list || []);
      if (list && list.length > 0 && !activeRepo) {
        selectRepository(list[0]);
      }
    } catch (e) {
      console.warn('Failed to load user repositories:', e);
    }
  };

  const selectRepository = async (repo: StudyRepository) => {
    setActiveRepo(repo);
    setErrorMessage('');
    try {
      const details = await repoDnaService.getRepositoryDetails(repo.id);
      setAnalysis(details.analysis);
      const fileList = await repoDnaService.getRepositoryFiles(repo.id);
      setFiles(fileList || []);
      // Reset Chat
      setChatMessages([
        {
          role: 'assistant',
          text: `Hi! I'm your **RepoDNA Codebase Assistant** for **${repo.owner}/${repo.repo_name}**. Ask me about the architecture, where specific APIs are implemented, how authentication works, or interview preparation tips!`
        }
      ]);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to load repository details.');
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!githubUrl.trim()) {
      setErrorMessage('Please enter a valid GitHub repository URL.');
      return;
    }
    setErrorMessage('');
    setIsScanning(true);
    try {
      const res = await repoDnaService.analyzeRepository(githubUrl.trim());
      setActiveRepo(res.repository);
      setAnalysis(res.analysis);
      await loadUserRepositories();
      const fileList = await repoDnaService.getRepositoryFiles(res.repository.id);
      setFiles(fileList || []);
      setActiveTab('overview');
      setChatMessages([
        {
          role: 'assistant',
          text: `Analysis complete for **${res.repository.owner}/${res.repository.repo_name}**! Ask me anything about the code or architecture.`
        }
      ]);
      setGithubUrl('');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        setErrorMessage('Cannot connect to the backend server. Please verify the FastAPI server is running on http://localhost:8000 (run: uvicorn app.main:app --port 8000).');
      } else {
        setErrorMessage(msg || 'Failed to analyze repository. Ensure it is public and accessible.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeleteRepository = async (repoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this repository intelligence report?')) return;
    try {
      await repoDnaService.deleteRepository(repoId);
      const remaining = repositories.filter(r => r.id !== repoId);
      setRepositories(remaining);
      if (activeRepo?.id === repoId) {
        if (remaining.length > 0) {
          selectRepository(remaining[0]);
        } else {
          setActiveRepo(null);
          setAnalysis(null);
          setFiles([]);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete repository.');
    }
  };

  const handleCopyPitch = () => {
    if (!analysis?.interview_pitch) return;
    navigator.clipboard.writeText(analysis.interview_pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRepo || isChatLoading) return;
    const q = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: q }]);
    setIsChatLoading(true);

    try {
      const res = await repoDnaService.queryRepository(activeRepo.id, q);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          sources: res.sources?.map(s => s.file_path) || []
        }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'The repository does not provide enough evidence to answer this question accurately.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleQuestion = (idx: number) => {
    setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      {/* Hero Header */}
      <div className="bg-[#FAF7F2] text-[#1C211F] p-7 sm:p-9 rounded-3xl shadow-xs relative overflow-hidden border border-[#EAE3D8]">
        <div className="space-y-3 max-w-2xl z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED] text-[#C85A32] text-xs font-bold border border-[#C85A32]/20">
            <GitBranch className="w-3.5 h-3.5 text-[#C85A32]" /> RepoDNA Codebase Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C211F]">
            Repository Codebase Intelligence <br />
            <span className="text-[#C85A32]">
              Architecture, Schemas & Endpoints
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6763] font-medium leading-relaxed">
            Enter any public GitHub repository URL. RepoDNA analyzes the source tree, decodes system architecture, extracts APIs, database models, and generates technical explanations.
          </p>
        </div>

        {/* Input Form Inside Hero */}
        <form onSubmit={handleAnalyze} className="mt-6 flex flex-col sm:flex-row items-center gap-3 z-10 relative max-w-3xl">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8E9893]">
              <GitFork className="w-4 h-4 text-[#C85A32]" />
            </div>
            <input
              type="text"
              placeholder="https://github.com/owner/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={isScanning}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-[#1C211F] placeholder-[#8E9893] text-xs sm:text-sm font-medium border border-[#EAE3D8] focus:outline-none focus:ring-2 focus:ring-[#C85A32] transition-all shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !githubUrl.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" /> Analyze Repository
              </>
            )}
          </button>
        </form>

        {/* Quick Repository Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 z-10 relative">
          <span className="text-[11px] font-bold text-[#5E6763]">Quick presets:</span>
          <button
            type="button"
            onClick={() => setGithubUrl('https://github.com/BejugamBhagathkumar9494/CampusOS-AI')}
            className="px-2.5 py-1 rounded-lg bg-[#FAF0E9] hover:bg-[#FDF2ED] text-[#C85A32] text-[11px] font-bold border border-[#C85A32]/30 transition-all active:scale-95"
          >
            CampusOS AI (Current Workspace)
          </button>
          <button
            type="button"
            onClick={() => setGithubUrl('https://github.com/pallets/flask')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#5E6763] text-[11px] font-semibold border border-[#EAE3D8] transition-all active:scale-95"
          >
            Flask
          </button>
          <button
            type="button"
            onClick={() => setGithubUrl('https://github.com/facebook/react')}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#5E6763] text-[11px] font-semibold border border-[#EAE3D8] transition-all active:scale-95"
          >
            React
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#FEF7ED] border border-[#D9822B]/30 text-[#D9822B] text-xs font-medium flex items-center gap-2 z-10 relative animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D9822B]" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Live Scanning Step Progress Overlay */}
      {isScanning && (
        <div className="p-7 rounded-[28px] bg-white text-[#1C211F] border border-[#EAE3D8] shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center border border-[#C85A32]/30">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1C211F]">Analyzing Repository with RepoDNA</h3>
                <p className="text-xs text-[#5E6763]">Step {scanStepIndex + 1} of {SCAN_STEPS.length}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FDF2ED] text-[#C85A32] text-xs font-mono font-bold">
              {Math.round(((scanStepIndex + 1) / SCAN_STEPS.length) * 100)}%
            </span>
          </div>

          <div className="w-full bg-[#F4EFEA] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#C85A32] h-2 transition-all duration-700 ease-out"
              style={{ width: `${((scanStepIndex + 1) / SCAN_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {SCAN_STEPS.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                  idx < scanStepIndex
                    ? 'bg-[#F0F6F2] border-[#5E8C71]/30 text-[#5E8C71]'
                    : idx === scanStepIndex
                    ? 'bg-[#FDF2ED] border-[#C85A32]/40 text-[#C85A32] ring-1 ring-[#C85A32]'
                    : 'bg-[#FAF7F2] border-[#EAE3D8] text-[#8E9893]'
                }`}
              >
                {idx < scanStepIndex ? (
                  <CheckCircle2 className="w-4 h-4 text-[#5E8C71] shrink-0" />
                ) : idx === scanStepIndex ? (
                  <RefreshCw className="w-4 h-4 text-[#C85A32] animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#DCD2C3] flex items-center justify-center text-[9px] text-[#8E9893] shrink-0">
                    {idx + 1}
                  </div>
                )}
                <span className="truncate">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Pill Selector for Analyzed Repos */}
      {repositories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-[#8E9893] uppercase tracking-wider shrink-0 mr-1">Analyzed Repos:</span>
          {repositories.map(r => (
            <div
              key={r.id}
              onClick={() => selectRepository(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                activeRepo?.id === r.id
                  ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                  : 'bg-white text-[#2D3330] border-[#EAE3D8] hover:bg-[#FAF7F2]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{r.owner}/{r.repo_name}</span>
              <button
                onClick={(e) => handleDeleteRepository(r.id, e)}
                className="text-[#8E9893] hover:text-[#C85A32] p-0.5"
                title="Delete Repository"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Analysis Display */}
      {activeRepo && analysis ? (
        <div className="space-y-6">
          {/* Active Repo Top Bar */}
          <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-[#1C211F] flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-[#C85A32]" />
                  {activeRepo.owner} / {activeRepo.repo_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F0F6F2] text-[#5E8C71] text-[11px] font-extrabold border border-[#5E8C71]/30">
                  {activeRepo.primary_language}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F4EFEA] text-[#5E6763] text-[11px] font-bold border border-[#EAE3D8]">
                  {activeRepo.default_branch}
                </span>
              </div>
              <p className="text-xs text-[#5E6763] font-medium">{analysis.one_line_desc || activeRepo.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('mindmap')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  activeTab === 'mindmap'
                    ? 'bg-[#C85A32] text-white ring-2 ring-[#C85A32]/30'
                    : 'bg-[#C85A32] hover:bg-[#B44E27] text-white'
                }`}
              >
                <Compass className="w-4 h-4" /> Go Visually (Mindmap)
              </button>
              <a
                href={activeRepo.github_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#F4EFEA] hover:bg-[#EFE8DF] text-[#1C211F] text-xs font-bold flex items-center gap-1.5 transition-all border border-[#EAE3D8]"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View on GitHub
              </a>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5E6763] bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#EAE3D8]">
                <Star className="w-3.5 h-3.5 text-[#D9822B] fill-[#D9822B]" /> {activeRepo.stars_count}
                <GitFork className="w-3.5 h-3.5 text-[#8E9893] ml-1" /> {activeRepo.forks_count}
                <FileCode className="w-3.5 h-3.5 text-[#C85A32] ml-1" /> {files.length} Files
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#EAE3D8]">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'mindmap', label: 'Mindmap (Visual)', icon: Compass },
              { id: 'architecture', label: 'Architecture', icon: Layers },
              { id: 'structure', label: 'Project Structure', icon: FolderTree },
              { id: 'tech', label: 'Tech Stack', icon: Cpu },
              { id: 'flows', label: 'Application Flows', icon: Compass },
              { id: 'database', label: 'Database', icon: Database },
              { id: 'apis', label: 'APIs', icon: Terminal },
              { id: 'auth', label: 'Authentication', icon: ShieldCheck },
              { id: 'files', label: 'File Tree', icon: FolderTree },
              { id: 'health', label: 'Code Health', icon: Activity },
              { id: 'interview', label: 'Interview Prep', icon: BookOpen },
              { id: 'chat', label: 'Codebase Chat', icon: MessageSquare }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                    isActive
                      ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                      : 'bg-white text-[#5E6763] border-[#EAE3D8] hover:text-[#1C211F] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 0: MINDMAP UNIVERSE */}
          {activeTab === 'mindmap' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#C85A32]" /> Architecture Mindmap
                  </h3>
                  <p className="text-xs text-[#5E6763]">
                    Interactive architectural map. Drag to pan, scroll to zoom, click any node to inspect code files.
                  </p>
                </div>
              </div>
              <RepoMindmapView
                repository={activeRepo}
                analysis={analysis}
                files={files}
                onAskAI={(prompt) => {
                  setActiveTab('chat');
                  setChatInput(prompt);
                }}
              />
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Technical Project Summary */}
              {analysis.interview_pitch && (
                <div className="bg-[#1C211F] text-white p-6 rounded-2xl shadow-sm border border-[#2D3330] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#FAF0E9] text-xs font-bold uppercase tracking-wider">
                      <MessageSquare className="w-4 h-4 text-[#C85A32]" /> Technical Project Summary
                    </div>
                    <button
                      onClick={handleCopyPitch}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                    >
                      {copiedPitch ? <Check className="w-3.5 h-3.5 text-[#5E8C71]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPitch ? 'Copied!' : 'Copy Summary'}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-[#FAF7F2] font-medium leading-relaxed italic bg-black/20 p-4 rounded-xl border border-white/5">
                    "{analysis.interview_pitch || analysis.short_summary}"
                  </p>
                </div>
              )}

              {/* Two Column Summary: Executive & Beginner */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-3">
                  <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#C85A32]" /> Executive Overview
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5E6763] leading-relaxed font-medium">
                    {analysis.detailed_overview || analysis.short_summary}
                  </p>
                </div>

                <div className="bg-[#FAF0E9] p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-3">
                  <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#C85A32]" /> Explain Like I'm a Beginner (ELI5)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#2D3330] leading-relaxed font-medium">
                    {analysis.beginner_explanation || analysis.short_summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#C85A32]" /> System Architecture & Data Flow
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-[#FDF2ED] text-[#C85A32] text-xs font-bold border border-[#EAE3D8]">
                    {analysis.architecture?.pattern || 'Client-Server Architecture'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5E6763] leading-relaxed font-medium">
                  {analysis.architecture?.summary || 'Standard modular architecture separating presentation, controller routes, and data state.'}
                </p>

                {analysis.architecture?.mermaid && (
                  <div className="mt-4">
                    <div className="text-xs uppercase text-[#5E6763] font-bold mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#C85A32]" /> Interactive Architecture Diagram
                    </div>
                    <MermaidDiagram chart={analysis.architecture.mermaid} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-[#C85A32]" /> Directory Structure & Folder Dictionary
                </h3>
                <p className="text-xs text-[#5E6763] font-medium">
                  Every important folder explained in simple student-friendly language.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis.project_structure || []).map((f, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-1 hover:border-[#C85A32]/30 transition-all">
                      <div className="flex items-center gap-2 font-mono text-xs font-extrabold text-[#C85A32]">
                        <FolderTree className="w-4 h-4 text-[#C85A32]" />
                        {f.folder}
                      </div>
                      <p className="text-xs text-[#5E6763] leading-relaxed font-medium">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNOLOGIES */}
          {activeTab === 'tech' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(analysis.tech_stack || {}).map(([category, items]) => (
                  <div key={category} className="bg-white p-5 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-3">
                    <h4 className="text-sm font-extrabold text-[#1C211F] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#C85A32]" /> {category}
                    </h4>
                    {items && items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((tech, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8]">
                            <span className="text-xs font-extrabold text-[#1C211F] block">{tech.name}</span>
                            <span className="text-[11px] text-[#8E9893] font-medium">{tech.evidence}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#8E9893] py-2 font-medium">None explicitly detected</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: APPLICATION FLOWS */}
          {activeTab === 'flows' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-5">
                <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#C85A32]" /> Key Application & Data Flows
                </h3>
                <div className="space-y-6">
                  {(analysis.application_flows || []).map((flow, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-[#FAF0E9] border border-[#EAE3D8] space-y-3">
                      <h4 className="text-sm font-extrabold text-[#1C211F] flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#C85A32]" /> {flow.flow_name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {flow.steps.map((step, sIdx) => (
                          <div key={sIdx} className="p-3 rounded-xl bg-white border border-[#EAE3D8] shadow-xs relative">
                            <span className="text-[10px] font-extrabold text-[#C85A32] uppercase block mb-1">Step {sIdx + 1}</span>
                            <span className="text-xs text-[#2D3330] font-medium leading-relaxed block">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATABASE */}
          {activeTab === 'database' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#D9822B]" /> Database & Schema Architecture
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-[#FEF7ED] text-[#D9822B] text-xs font-bold border border-[#D9822B]/20">
                    {analysis.database_analysis?.detected_db || 'PostgreSQL / SQL'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis.database_analysis?.tables_or_collections || []).map((tbl, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#1C211F] font-mono">{tbl.name}</span>
                        {tbl.source_file && (
                          <span className="text-[10px] text-[#8E9893] font-mono truncate max-w-[150px]">{tbl.source_file}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#5E6763] font-medium">{tbl.purpose}</p>
                      {tbl.fields && tbl.fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {tbl.fields.map((fld, fIdx) => (
                            <span key={fIdx} className="px-2 py-0.5 rounded-md bg-white text-[#5E6763] text-[10px] font-mono border border-[#EAE3D8]">
                              {fld}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: APIS */}
          {activeTab === 'apis' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#C85A32]" /> REST API Endpoints Explorer
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#EAE3D8] text-[#8E9893] uppercase font-bold">
                        <th className="py-3 px-3">Method</th>
                        <th className="py-3 px-3">Endpoint</th>
                        <th className="py-3 px-3">Purpose</th>
                        <th className="py-3 px-3">Handler</th>
                        <th className="py-3 px-3">Source File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8] font-medium">
                      {(analysis.api_analysis || []).map((api, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F2] transition-all">
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono ${
                              api.method === 'GET' ? 'bg-[#F0F6F2] text-[#5E8C71]' :
                              api.method === 'POST' ? 'bg-[#FDF2ED] text-[#C85A32]' :
                              api.method === 'DELETE' ? 'bg-[#FDF2ED] text-[#C85A32]' :
                              'bg-[#FEF7ED] text-[#D9822B]'
                            }`}>
                              {api.method}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#1C211F]">{api.endpoint}</td>
                          <td className="py-3 px-3 text-[#5E6763]">{api.purpose}</td>
                          <td className="py-3 px-3 font-mono text-[#8E9893]">{api.controller || 'route'}</td>
                          <td className="py-3 px-3 font-mono text-[#8E9893] truncate max-w-[140px]">{api.source_file}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#5E8C71]" /> Authentication & Security Architecture
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-[#F0F6F2] text-[#5E8C71] text-xs font-bold border border-[#5E8C71]/30">
                    {analysis.authentication_analysis?.mechanism || 'JWT / Token Authentication'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-2">
                  <span className="text-xs font-extrabold text-[#1C211F] block">Login & Verification Walkthrough</span>
                  <p className="text-xs text-[#5E6763] leading-relaxed font-medium">
                    {analysis.authentication_analysis?.login_flow || 'Users submit credentials which are validated by the backend service and returned as a secure session token.'}
                  </p>
                </div>

                {analysis.authentication_analysis?.protected_routes && analysis.authentication_analysis.protected_routes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-[#1C211F] block">Protected Endpoints & Middlewares</span>
                    <div className="flex flex-wrap gap-2">
                      {analysis.authentication_analysis.protected_routes.map((rt, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-[#F4EFEA] text-[#1C211F] text-xs font-mono font-bold border border-[#EAE3D8]">
                          {rt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* TAB 9: IMPORTANT FILES */}
          {activeTab === 'files' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-[#C85A32]" /> Analyzed Source Code Files ({files.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {files.map(f => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFileModal(f)}
                      className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] hover:border-[#C85A32]/30 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#1C211F] font-mono truncate">{f.file_path}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white text-[#C85A32] text-[10px] font-bold border border-[#EAE3D8]">
                          {f.language}
                        </span>
                      </div>
                      <p className="text-xs text-[#5E6763] line-clamp-2 font-medium">{f.purpose_summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: HEALTH & IMPROVEMENTS */}
          {activeTab === 'health' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-[#1C211F] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#C85A32]" /> Codebase Health
                  </h3>
                  <div className="text-center py-4">
                    <div className="text-4xl font-extrabold text-[#C85A32]">
                      {analysis.project_health?.organization_score || 8.5}/10
                    </div>
                    <span className="text-xs font-bold text-[#8E9893] uppercase">Architecture & Structure Score</span>
                  </div>
                  <div className="space-y-2 text-xs font-medium text-[#5E6763]">
                    <div className="flex justify-between py-1 border-b border-[#EAE3D8]">
                      <span>Automated Tests:</span>
                      <span className={analysis.project_health?.tests_present ? 'text-[#5E8C71] font-bold' : 'text-[#D9822B] font-bold'}>
                        {analysis.project_health?.tests_present ? 'Detected ✓' : 'Limited Tests'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Documentation:</span>
                      <span className="text-[#1C211F] font-bold">{analysis.project_health?.documentation_quality || 'High'}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-[#1C211F] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5E8C71]" /> Recommendations & Potential Improvements
                  </h3>
                  <div className="space-y-3">
                    {(analysis.improvements || []).map((imp, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#FDF2ED] border border-[#C85A32]/20 space-y-1">
                        <span className="text-xs font-extrabold text-[#C85A32] block">{imp.area}</span>
                        <p className="text-xs text-[#2D3330] leading-relaxed font-medium">{imp.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: INTERVIEW PREP */}
          {activeTab === 'interview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-[#EAE3D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#C85A32]" /> Technical Interview Questions & Model Answers
                  </h3>
                  <span className="text-xs font-bold text-[#8E9893]">Tailored to this repository</span>
                </div>

                <div className="space-y-3">
                  {(analysis.interview_questions || []).map((q, idx) => {
                    const isExpanded = expandedQuestions[idx];
                    return (
                      <div key={idx} className="rounded-2xl border border-[#EAE3D8] overflow-hidden bg-[#FAF7F2]">
                        <button
                          onClick={() => toggleQuestion(idx)}
                          className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#1C211F] hover:bg-[#F4EFEA] transition-all"
                        >
                          <span>{q.question}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#C85A32] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#8E9893] shrink-0" />}
                        </button>
                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-[#EAE3D8] text-xs text-[#2D3330] leading-relaxed font-medium">
                            <span className="text-[10px] font-extrabold text-[#C85A32] uppercase block mb-1">Model Interview Answer:</span>
                            {q.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: ASK REPODNA CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-[28px] border border-[#EAE3D8] shadow-sm flex flex-col h-[600px] overflow-hidden animate-fade-in">
              {/* Chat Header */}
              <div className="p-4 border-b border-[#EAE3D8] bg-[#FAF7F2] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C85A32] text-white flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1C211F]">Ask RepoDNA Code Assistant</h4>
                    <p className="text-[10px] text-[#8E9893] font-medium">Grounded strictly in {activeRepo.owner}/{activeRepo.repo_name}</p>
                  </div>
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed font-medium ${
                        msg.role === 'user'
                          ? 'bg-[#C85A32] text-white rounded-br-none shadow-xs'
                          : 'bg-[#FAF7F2] text-[#1C211F] rounded-bl-none border border-[#EAE3D8]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#EAE3D8] flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold text-[#8E9893] block w-full">Verified Source Files:</span>
                          {msg.sources.map((src, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 rounded bg-white text-[#C85A32] text-[10px] font-mono border border-[#EAE3D8]">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 p-3 bg-[#FAF7F2] rounded-2xl text-xs text-[#5E6763] max-w-xs border border-[#EAE3D8]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C85A32]" />
                    <span>Searching codebase & generating grounded answer...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3.5 border-t border-[#EAE3D8] bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything: 'Where is login handled?', 'Explain the database connection', 'What are weaknesses?'"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-[#1C211F] placeholder-[#8E9893] text-xs font-medium border border-[#EAE3D8] focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-extrabold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </div>
          )}
        </div>
      ) : !isScanning ? (
        <div className="bg-white p-12 rounded-[32px] border border-[#EAE3D8] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center mx-auto border border-[#C85A32]/20">
            <GitFork className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[#1C211F]">No Repository Analyzed Yet</h3>
          <p className="text-xs text-[#5E6763] max-w-md mx-auto font-medium">
            Paste any public GitHub repository URL above (e.g. your project, a semester project, or an open-source tool) to generate instant architectural intelligence and interview preparation.
          </p>
        </div>
      ) : null}

      {/* File Excerpt View Modal */}
      {selectedFileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#EAE3D8] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#C85A32]" />
                <span className="text-sm font-extrabold text-[#1C211F] font-mono">{selectedFileModal.file_path}</span>
              </div>
              <button onClick={() => setSelectedFileModal(null)} className="text-[#8E9893] hover:text-[#1C211F] p-1">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#8E9893] uppercase">Purpose Summary</span>
              <p className="text-xs text-[#2D3330] font-medium leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#EAE3D8]">
                {selectedFileModal.purpose_summary}
              </p>
            </div>
            {selectedFileModal.excerpt && (
              <div className="flex-1 overflow-y-auto space-y-1">
                <span className="text-xs font-bold text-[#8E9893] uppercase">Code Excerpt</span>
                <pre className="p-3.5 rounded-xl bg-[#1C211F] text-[#FAF7F2] text-xs font-mono overflow-x-auto border border-[#2D3330]">
                  {selectedFileModal.excerpt}
                </pre>
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFileModal(null)}
                className="px-5 py-2 rounded-xl bg-[#1C211F] text-white text-xs font-extrabold hover:bg-[#2D3330]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
