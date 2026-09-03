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
      setErrorMessage(err.message || 'Failed to analyze repository. Ensure it is public and accessible.');
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 sm:p-9 rounded-[32px] shadow-2xl relative overflow-hidden border border-indigo-500/20">
        <div className="space-y-3 max-w-2xl z-10 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold border border-indigo-500/30">
            <Sparkles className="w-4 h-4 text-indigo-400" /> RepoDNA — AI GitHub Repository Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Understand Any GitHub Project <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Like You Built It Yourself.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Enter any public GitHub repository URL. RepoDNA scans the source tree, decodes the architecture, extracts APIs, database models, and generates an interview-ready explanation with codebase RAG.
          </p>
        </div>

        {/* Input Form Inside Hero */}
        <form onSubmit={handleAnalyze} className="mt-6 flex flex-col sm:flex-row items-center gap-3 z-10 relative max-w-3xl">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <GitFork className="w-4 h-4 text-indigo-400" />
            </div>
            <input
              type="text"
              placeholder="https://github.com/facebook/react or https://github.com/owner/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={isScanning}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 text-white placeholder-slate-400 text-xs sm:text-sm font-medium border border-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-md transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !githubUrl.trim()}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-2 z-10 relative animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Live Scanning Step Progress Overlay */}
      {isScanning && (
        <div className="p-7 rounded-[28px] bg-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Analyzing Repository with RepoDNA</h3>
                <p className="text-xs text-slate-400">Step {scanStepIndex + 1} of {SCAN_STEPS.length}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
              {Math.round(((scanStepIndex + 1) / SCAN_STEPS.length) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 transition-all duration-700 ease-out"
              style={{ width: `${((scanStepIndex + 1) / SCAN_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {SCAN_STEPS.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                  idx < scanStepIndex
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : idx === scanStepIndex
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 ring-1 ring-indigo-400'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                {idx < scanStepIndex ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : idx === scanStepIndex ? (
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-500 shrink-0">
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
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Analyzed Repos:</span>
          {repositories.map(r => (
            <div
              key={r.id}
              onClick={() => selectRepository(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                activeRepo?.id === r.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{r.owner}/{r.repo_name}</span>
              <button
                onClick={(e) => handleDeleteRepository(r.id, e)}
                className="text-slate-400 hover:text-rose-400 p-0.5"
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
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-indigo-600" />
                  {activeRepo.owner} / {activeRepo.repo_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                  {activeRepo.primary_language}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                  {activeRepo.default_branch}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{analysis.one_line_desc || activeRepo.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('mindmap')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  activeTab === 'mindmap'
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white ring-2 ring-indigo-400 shadow-indigo-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                <Compass className="w-4 h-4" /> Go Visually (Mindmap)
              </button>
              <a
                href={activeRepo.github_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View on GitHub
              </a>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {activeRepo.stars_count}
                <GitFork className="w-3.5 h-3.5 text-slate-400 ml-1" /> {activeRepo.forks_count}
                <FileCode className="w-3.5 h-3.5 text-indigo-500 ml-1" /> {files.length} Files
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
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
              { id: 'files', label: 'Important Files', icon: FileCode },
              { id: 'health', label: 'Health & Suggestions', icon: Activity },
              { id: 'interview', label: 'Interview Prep', icon: Sparkles },
              { id: 'chat', label: 'Ask RepoDNA', icon: MessageSquare },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 0: VISUAL MINDMAP */}
          {activeTab === 'mindmap' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-0.5">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-600" /> Interactive Repository Mindmap
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    NotebookLM-style visual radial universe. Pan, zoom, click any node to inspect modules, or ask AI about specific components.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Interactive Universe
                  </span>
                </div>
              </div>
              <RepoMindmapView
                repository={activeRepo}
                analysis={analysis}
                files={files}
                onAskAI={(question) => {
                  setActiveTab('chat');
                  setChatInput(question);
                }}
              />
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Interview Pitch Card */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-[28px] shadow-lg border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> 60-Second Interview Elevator Pitch
                  </div>
                  <button
                    onClick={handleCopyPitch}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                  >
                    {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPitch ? 'Copied!' : 'Copy Pitch'}
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed italic bg-black/20 p-4 rounded-2xl border border-white/5">
                  "{analysis.interview_pitch || analysis.short_summary}"
                </p>
              </div>

              {/* Two Column Summary: Executive & Beginner */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" /> Executive Overview
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {analysis.detailed_overview || analysis.short_summary}
                  </p>
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-[24px] border border-indigo-100 shadow-sm space-y-3">
                  <h3 className="text-base font-extrabold text-indigo-950 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" /> Explain Like I'm a Beginner (ELI5)
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-900/80 leading-relaxed font-medium">
                    {analysis.beginner_explanation || analysis.short_summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" /> System Architecture & Data Flow
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                    {analysis.architecture?.pattern || 'Client-Server Architecture'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {analysis.architecture?.summary || 'Standard modular architecture separating presentation, controller routes, and data state.'}
                </p>

                {analysis.architecture?.mermaid && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                    <div className="text-[10px] uppercase text-slate-500 font-bold mb-2">Mermaid System Diagram Code:</div>
                    <pre className="text-indigo-200">{analysis.architecture.mermaid}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-indigo-600" /> Directory Structure & Folder Dictionary
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Every important folder explained in simple student-friendly language.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis.project_structure || []).map((f, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-2 font-mono text-xs font-extrabold text-indigo-700">
                        <FolderTree className="w-4 h-4 text-indigo-500" />
                        {f.folder}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{f.explanation}</p>
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
                  <div key={category} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600" /> {category}
                    </h4>
                    {items && items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((tech, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs font-extrabold text-indigo-900 block">{tech.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{tech.evidence}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-2 font-medium">None explicitly detected</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: APPLICATION FLOWS */}
          {activeTab === 'flows' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-5">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" /> Key Application & Data Flows
                </h3>
                <div className="space-y-6">
                  {(analysis.application_flows || []).map((flow, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                      <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-600" /> {flow.flow_name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {flow.steps.map((step, sIdx) => (
                          <div key={sIdx} className="p-3 rounded-xl bg-white border border-indigo-100 shadow-xs relative">
                            <span className="text-[10px] font-extrabold text-indigo-500 uppercase block mb-1">Step {sIdx + 1}</span>
                            <span className="text-xs text-slate-700 font-medium leading-relaxed block">{step}</span>
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
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" /> Database & Schema Architecture
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                    {analysis.database_analysis?.detected_db || 'PostgreSQL / SQL'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis.database_analysis?.tables_or_collections || []).map((tbl, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-900 font-mono">{tbl.name}</span>
                        {tbl.source_file && (
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{tbl.source_file}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{tbl.purpose}</p>
                      {tbl.fields && tbl.fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {tbl.fields.map((fld, fIdx) => (
                            <span key={fIdx} className="px-2 py-0.5 rounded-md bg-white text-slate-600 text-[10px] font-mono border border-slate-200">
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
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-600" /> REST API Endpoints Explorer
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                        <th className="py-3 px-3">Method</th>
                        <th className="py-3 px-3">Endpoint</th>
                        <th className="py-3 px-3">Purpose</th>
                        <th className="py-3 px-3">Handler</th>
                        <th className="py-3 px-3">Source File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(analysis.api_analysis || []).map((api, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono ${
                              api.method === 'GET' ? 'bg-emerald-50 text-emerald-700' :
                              api.method === 'POST' ? 'bg-indigo-50 text-indigo-700' :
                              api.method === 'DELETE' ? 'bg-rose-50 text-rose-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {api.method}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{api.endpoint}</td>
                          <td className="py-3 px-3 text-slate-600">{api.purpose}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{api.controller || 'route'}</td>
                          <td className="py-3 px-3 font-mono text-slate-400 truncate max-w-[140px]">{api.source_file}</td>
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
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" /> Authentication & Security Architecture
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                    {analysis.authentication_analysis?.mechanism || 'JWT / Token Authentication'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-xs font-extrabold text-slate-900 block">Login & Verification Walkthrough</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {analysis.authentication_analysis?.login_flow || 'Users submit credentials which are validated by the backend service and returned as a secure session token.'}
                  </p>
                </div>

                {analysis.authentication_analysis?.protected_routes && analysis.authentication_analysis.protected_routes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-slate-900 block">Protected Endpoints & Middlewares</span>
                    <div className="flex flex-wrap gap-2">
                      {analysis.authentication_analysis.protected_routes.map((rt, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-800 text-xs font-mono font-bold border border-indigo-100">
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
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-600" /> Analyzed Source Code Files ({files.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {files.map(f => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFileModal(f)}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-300 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900 font-mono truncate">{f.file_path}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white text-indigo-700 text-[10px] font-bold border border-slate-200">
                          {f.language}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 font-medium">{f.purpose_summary}</p>
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
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" /> Codebase Health
                  </h3>
                  <div className="text-center py-4">
                    <div className="text-4xl font-extrabold text-indigo-600">
                      {analysis.project_health?.organization_score || 8.5}/10
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Architecture & Structure Score</span>
                  </div>
                  <div className="space-y-2 text-xs font-medium text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Automated Tests:</span>
                      <span className={analysis.project_health?.tests_present ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                        {analysis.project_health?.tests_present ? 'Detected ✓' : 'Limited Tests'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Documentation:</span>
                      <span className="text-slate-900 font-bold">{analysis.project_health?.documentation_quality || 'High'}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Actionable Recommendations & Potential Improvements
                  </h3>
                  <div className="space-y-3">
                    {(analysis.improvements || []).map((imp, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                        <span className="text-xs font-extrabold text-purple-900 block">{imp.area}</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{imp.recommendation}</p>
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
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Top 10 Technical Interview Questions & Model Answers
                  </h3>
                  <span className="text-xs font-bold text-slate-400">Tailored to this repository</span>
                </div>

                <div className="space-y-3">
                  {(analysis.interview_questions || []).map((q, idx) => {
                    const isExpanded = expandedQuestions[idx];
                    return (
                      <div key={idx} className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50">
                        <button
                          onClick={() => toggleQuestion(idx)}
                          className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-100/70 transition-all"
                        >
                          <span>{q.question}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                        </button>
                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                            <span className="text-[10px] font-extrabold text-indigo-600 uppercase block mb-1">Model Interview Answer:</span>
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
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden animate-fade-in">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Ask RepoDNA Code Assistant</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Grounded strictly in {activeRepo.owner}/{activeRepo.repo_name}</p>
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
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-100 text-slate-900 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold text-slate-400 block w-full">Verified Source Files:</span>
                          {msg.sources.map((src, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 rounded bg-white text-indigo-700 text-[10px] font-mono border border-slate-200">
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-2xl text-xs text-slate-500 max-w-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Searching codebase & generating grounded answer...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything: 'Where is login handled?', 'Explain the database connection', 'What are weaknesses?'"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </div>
          )}
        </div>
      ) : !isScanning ? (
        <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <GitFork className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">No Repository Analyzed Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Paste any public GitHub repository URL above (e.g. your project, a semester project, or an open-source tool) to generate instant architectural intelligence and interview preparation.
          </p>
        </div>
      ) : null}

      {/* File Excerpt View Modal */}
      {selectedFileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-extrabold text-slate-900 font-mono">{selectedFileModal.file_path}</span>
              </div>
              <button onClick={() => setSelectedFileModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Purpose Summary</span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl">
                {selectedFileModal.purpose_summary}
              </p>
            </div>
            {selectedFileModal.excerpt && (
              <div className="flex-1 overflow-y-auto space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Code Excerpt</span>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-indigo-200 text-xs font-mono overflow-x-auto">
                  {selectedFileModal.excerpt}
                </pre>
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFileModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold"
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
