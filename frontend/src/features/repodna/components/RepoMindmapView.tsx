import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Search,
  Layers, Code2, Database, ShieldCheck, Cpu, FileCode,
  Sparkles, ExternalLink, MessageSquare, ArrowRight, Compass,
  ChevronRight, Filter, Info, X
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
  category: 'root' | 'layer' | 'module' | 'file' | 'api' | 'db';
  level: number; // 0 = root, 1 = layer, 2 = module, 3 = file/endpoint
  angle?: number;
  radius?: number;
  x?: number;
  y?: number;
  color: string;
  bgColor: string;
  borderColor: string;
  details?: {
    path?: string;
    purpose?: string;
    tech?: string[];
    endpoints?: string[];
    models?: string[];
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'radial' | 'tree'>('radial');

  // Build Hierarchical Mindmap Graph Data
  const graphData = useMemo<MindmapNode>(() => {
    const rootName = `${repository.owner}/${repository.repo_name}`;
    const layers: MindmapNode[] = [];

    // 1. Frontend Layer
    const frontendFiles = files.filter(f => 
      f.file_path.toLowerCase().includes('front') || 
      f.file_path.toLowerCase().includes('src/') || 
      f.file_path.endsWith('.tsx') || 
      f.file_path.endsWith('.jsx')
    );
    const frontendTech = analysis?.tech_stack?.frontend || ['React', 'TypeScript', 'TailwindCSS'];
    
    layers.push({
      id: 'layer-frontend',
      name: 'Frontend UI & Client',
      category: 'layer',
      level: 1,
      color: '#06b6d4',
      bgColor: '#ecfeff',
      borderColor: '#a5f3fc',
      details: {
        purpose: 'Client application layer handling UI views, responsive state management, and user interactions.',
        tech: frontendTech,
        connections: ['layer-apis', 'layer-state']
      },
      children: frontendFiles.slice(0, 8).map(f => ({
        id: `file-${f.id || f.file_path}`,
        name: f.file_path.split('/').pop() || f.file_path,
        category: 'file',
        level: 2,
        color: '#0891b2',
        bgColor: '#f0fdfa',
        borderColor: '#99f6e4',
        details: {
          path: f.file_path,
          purpose: f.purpose_summary || 'Component handling user experience and interactive views.',
          tech: [f.language || 'TypeScript']
        }
      }))
    });

    // 2. Backend API & Services Layer
    const backendFiles = files.filter(f => 
      f.file_path.toLowerCase().includes('back') || 
      f.file_path.toLowerCase().includes('api') || 
      f.file_path.toLowerCase().includes('server') ||
      f.file_path.endsWith('.py') || 
      f.file_path.endsWith('.go')
    );
    const backendTech = analysis?.tech_stack?.backend || ['FastAPI', 'Python', 'Uvicorn'];
    const apis = analysis?.api_analysis || [];

    layers.push({
      id: 'layer-backend',
      name: 'Backend & APIs',
      category: 'layer',
      level: 1,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      details: {
        purpose: 'Server-side application processing HTTP requests, executing business logic, and routing data.',
        tech: backendTech,
        endpoints: apis.map(a => `${a.method} ${a.endpoint}`),
        connections: ['layer-database', 'layer-auth']
      },
      children: [
        ...apis.slice(0, 5).map((a, i) => ({
          id: `api-${i}`,
          name: `${a.method} ${a.endpoint}`,
          category: 'api' as const,
          level: 2,
          color: '#7c3aed',
          bgColor: '#faf5ff',
          borderColor: '#e9d5ff',
          details: {
            path: a.source_file,
            purpose: a.purpose || 'REST API endpoint',
            tech: [a.method]
          }
        })),
        ...backendFiles.slice(0, 5).map(f => ({
          id: `file-${f.id || f.file_path}`,
          name: f.file_path.split('/').pop() || f.file_path,
          category: 'file' as const,
          level: 2,
          color: '#6d28d9',
          bgColor: '#f5f3ff',
          borderColor: '#ddd6fe',
          details: {
            path: f.file_path,
            purpose: f.purpose_summary || 'Backend business logic and handler.',
            tech: [f.language || 'Python']
          }
        }))
      ]
    });

    // 3. Database & Storage Layer
    const dbTech = analysis?.tech_stack?.database || ['PostgreSQL', 'Supabase', 'SQLAlchemy'];
    const models = analysis?.database_analysis?.models || [];
    layers.push({
      id: 'layer-database',
      name: 'Database & Schemas',
      category: 'layer',
      level: 1,
      color: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      details: {
        purpose: analysis?.database_analysis?.orm_or_driver 
          ? `Data layer managed by ${analysis.database_analysis.orm_or_driver}.` 
          : 'Relational data modeling, table schemas, and persistence layer.',
        tech: dbTech,
        models: models.map(m => m.name),
        connections: ['layer-backend']
      },
      children: models.slice(0, 6).map((m, i) => ({
        id: `model-${i}`,
        name: m.name,
        category: 'db' as const,
        level: 2,
        color: '#059669',
        bgColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        details: {
          path: m.source_file,
          purpose: m.purpose || 'Database entity schema and relation',
          tech: m.fields || ['id', 'created_at']
        }
      }))
    });

    // 4. Security & Authentication Layer
    const authInfo = analysis?.authentication_analysis;
    layers.push({
      id: 'layer-auth',
      name: 'Security & Auth',
      category: 'layer',
      level: 1,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      details: {
        purpose: authInfo?.type 
          ? `Authentication system using ${authInfo.type}.` 
          : 'Identity verification, token validation, and role-based access control.',
        tech: [authInfo?.type || 'JWT / Supabase Auth', ...(authInfo?.protected_routes || ['OAuth2', 'RBAC'])],
        connections: ['layer-backend', 'layer-frontend']
      },
      children: (authInfo?.key_files || ['auth/context', 'deps.py']).map((kf, i) => ({
        id: `auth-${i}`,
        name: kf.split('/').pop() || kf,
        category: 'module' as const,
        level: 2,
        color: '#d97706',
        bgColor: '#fffdf5',
        borderColor: '#fef08a',
        details: {
          path: kf,
          purpose: 'Authentication verification, session guards, and access token validation.',
          tech: ['Security', 'Tokens']
        }
      }))
    });

    // 5. System Architecture & Workflows
    const flows = analysis?.application_flows || [];
    layers.push({
      id: 'layer-flows',
      name: 'Workflows & Logic',
      category: 'layer',
      level: 1,
      color: '#ec4899',
      bgColor: '#fdf2f8',
      borderColor: '#fbcfe8',
      details: {
        purpose: 'End-to-end data processing pipelines, user execution lifecycle, and service integrations.',
        tech: ['Pipelines', 'Async Jobs', 'RAG'],
        connections: ['layer-backend', 'layer-frontend']
      },
      children: flows.slice(0, 5).map((fl, i) => ({
        id: `flow-${i}`,
        name: fl.flow_name,
        category: 'module' as const,
        level: 2,
        color: '#db2777',
        bgColor: '#fff1f2',
        borderColor: '#fecdd3',
        details: {
          purpose: fl.description || 'Application sequence workflow.',
          tech: fl.steps || []
        }
      }))
    });

    return {
      id: 'root-repo',
      name: rootName,
      category: 'root',
      level: 0,
      color: '#6366f1',
      bgColor: '#e0e7ff',
      borderColor: '#818cf8',
      details: {
        purpose: analysis?.one_line_desc || repository.description || 'Full-Stack Software Architecture',
        tech: [repository.primary_language || 'TypeScript', `${files.length} Analyzed Files`]
      },
      children: layers
    };
  }, [repository, analysis, files]);

  // Position nodes radially around the center
  const layoutGraph = useMemo(() => {
    const width = 1100;
    const height = 900;
    const centerX = width / 2;
    const centerY = height / 2;

    const positionedNodes: (MindmapNode & { x: number; y: number; parentX?: number; parentY?: number })[] = [];
    const links: { source: { x: number; y: number }; target: { x: number; y: number }; color: string }[] = [];

    // Root
    positionedNodes.push({
      ...graphData,
      x: centerX,
      y: centerY
    });

    if (layoutMode === 'radial') {
      // Concentric Orbit Rings
      const layerCount = graphData.children?.length || 1;
      const layerRadius = 240;

      graphData.children?.forEach((layer, lIdx) => {
        const angle = (lIdx / layerCount) * 2 * Math.PI - Math.PI / 2;
        const lx = centerX + layerRadius * Math.cos(angle);
        const ly = centerY + layerRadius * Math.sin(angle);

        positionedNodes.push({
          ...layer,
          x: lx,
          y: ly,
          parentX: centerX,
          parentY: centerY
        });

        links.push({
          source: { x: centerX, y: centerY },
          target: { x: lx, y: ly },
          color: layer.color
        });

        // Children of Layer
        const childCount = layer.children?.length || 0;
        const childRadius = 140;
        const spreadAngle = 0.9; // Radians

        layer.children?.forEach((child, cIdx) => {
          const childAngle = childCount === 1 
            ? angle 
            : angle - spreadAngle / 2 + (cIdx / (childCount - 1)) * spreadAngle;

          const cx = lx + childRadius * Math.cos(childAngle);
          const cy = ly + childRadius * Math.sin(childAngle);

          positionedNodes.push({
            ...child,
            x: cx,
            y: cy,
            parentX: lx,
            parentY: ly
          });

          links.push({
            source: { x: lx, y: ly },
            target: { x: cx, y: cy },
            color: child.color
          });
        });
      });
    } else {
      // Tree / Flow Layout
      const layerCount = graphData.children?.length || 1;
      const spacingY = height / (layerCount + 1);

      graphData.children?.forEach((layer, lIdx) => {
        const lx = centerX + 180;
        const ly = spacingY * (lIdx + 1);

        positionedNodes.push({
          ...layer,
          x: lx,
          y: ly,
          parentX: centerX - 250,
          parentY: centerY
        });

        links.push({
          source: { x: centerX - 250, y: centerY },
          target: { x: lx, y: ly },
          color: layer.color
        });

        // Children
        const childCount = layer.children?.length || 0;
        layer.children?.forEach((child, cIdx) => {
          const cx = lx + 240;
          const cy = ly - 30 + cIdx * 35;

          positionedNodes.push({
            ...child,
            x: cx,
            y: cy,
            parentX: lx,
            parentY: ly
          });

          links.push({
            source: { x: lx, y: ly },
            target: { x: cx, y: cy },
            color: child.color
          });
        });
      });
    }

    return { nodes: positionedNodes, links, width, height, centerX, centerY };
  }, [graphData, layoutMode]);

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
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // Filtered nodes highlighting
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim() && activeCategoryFilter === 'all') return null;
    const q = searchQuery.toLowerCase();
    const matching = new Set<string>();

    layoutGraph.nodes.forEach(n => {
      const matchSearch = !q || n.name.toLowerCase().includes(q) || n.details?.purpose?.toLowerCase().includes(q);
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
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[750px]'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Starry Orbit Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* TOP CONTROLS & SEARCH BAR */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search components, APIs, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-52 sm:w-72 shadow-lg"
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
              <Layers className="w-3.5 h-3.5" /> System Tree
            </button>
          </div>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 shadow-lg">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
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
                r={240}
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                className="opacity-40 animate-spin-slow"
              />
              <circle
                cx={layoutGraph.centerX}
                cy={layoutGraph.centerY}
                r={380}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2 4"
                className="opacity-30"
              />
            </>
          )}

          {/* Animated Connecting Links */}
          {layoutGraph.links.map((link, idx) => (
            <path
              key={idx}
              d={`M ${link.source.x} ${link.source.y} Q ${(link.source.x + link.target.x) / 2} ${(link.source.y + link.target.y) / 2 - 10} ${link.target.x} ${link.target.y}`}
              fill="none"
              stroke={link.color}
              strokeWidth="2"
              strokeOpacity="0.45"
              className="transition-all duration-300 hover:stroke-opacity-100 hover:stroke-width-3"
            />
          ))}

          {/* Graph Nodes */}
          {layoutGraph.nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isDimmed = filteredNodeIds && !filteredNodeIds.has(node.id);
            const isRoot = node.level === 0;
            const isLayer = node.level === 1;

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
                    r="44"
                    fill={node.color}
                    className="opacity-20 animate-ping"
                  />
                )}
                {isSelected && (
                  <circle
                    r={isRoot ? '48' : isLayer ? '34' : '22'}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node Bubble */}
                <circle
                  r={isRoot ? '36' : isLayer ? '26' : '14'}
                  fill={node.bgColor}
                  stroke={node.borderColor}
                  strokeWidth={isRoot ? '3.5' : '2.5'}
                  className="shadow-xl"
                  style={{ filter: `drop-shadow(0 0 12px ${node.color}55)` }}
                />

                {/* Node Icon / Visual Center */}
                {isRoot ? (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#1e1b4b"
                    fontSize="18"
                    fontWeight="bold"
                  >
                    🧬
                  </text>
                ) : isLayer ? (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={node.color}
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {node.name.slice(0, 2).toUpperCase()}
                  </text>
                ) : (
                  <circle r="4" fill={node.color} />
                )}

                {/* Node Label Text */}
                <text
                  y={isRoot ? 48 : isLayer ? 38 : 22}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#cbd5e1'}
                  fontSize={isRoot ? '13' : isLayer ? '11' : '9.5'}
                  fontWeight={isRoot ? '800' : isLayer ? '700' : '500'}
                  className="pointer-events-none drop-shadow-md"
                >
                  {node.name.length > 22 ? `${node.name.slice(0, 20)}...` : node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* FLOATING INSPECTOR SIDEBAR / DRAWER */}
      {selectedNode && (
        <div className="absolute right-4 top-20 bottom-4 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/80 p-6 shadow-2xl z-30 flex flex-col justify-between animate-fade-in pointer-events-auto">
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-md"
                  style={{ backgroundColor: selectedNode.bgColor, color: selectedNode.color, border: `1px solid ${selectedNode.borderColor}` }}
                >
                  {selectedNode.category.toUpperCase().slice(0, 3)}
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white leading-tight">
                    {selectedNode.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium capitalize">
                    {selectedNode.category} Node • Level {selectedNode.level}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Purpose / Summary */}
            {selectedNode.details?.purpose && (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <span className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">
                  Purpose & Functionality
                </span>
                {selectedNode.details.purpose}
              </div>
            )}

            {/* Path */}
            {selectedNode.details?.path && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs font-mono text-indigo-300">
                <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">{selectedNode.details.path}</span>
              </div>
            )}

            {/* Tech & Tags */}
            {selectedNode.details?.tech && selectedNode.details.tech.length > 0 && (
              <div>
                <span className="block text-[10px] uppercase font-extrabold text-slate-500 mb-2">
                  Technologies / Frameworks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.details.tech.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 text-[11px] font-bold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Endpoints / Schemas */}
            {selectedNode.details?.endpoints && selectedNode.details.endpoints.length > 0 && (
              <div>
                <span className="block text-[10px] uppercase font-extrabold text-slate-500 mb-2">
                  Exposed API Endpoints
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedNode.details.endpoints.map((ep, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] font-mono text-emerald-400"
                    >
                      {ep}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Database Models */}
            {selectedNode.details?.models && selectedNode.details.models.length > 0 && (
              <div>
                <span className="block text-[10px] uppercase font-extrabold text-slate-500 mb-2">
                  Managed Database Entities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.details.models.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-[11px] font-bold"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Ask AI Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (onAskAI) {
                  onAskAI(`Explain how ${selectedNode.name} works in this repository, its architectural role, and key functions.`);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Ask AI About This Node
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM LEGEND & HELPER BAR */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-xs text-slate-400">
        <span className="font-bold text-slate-300 flex items-center gap-1.5 mr-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" /> Interactive Mindmap:
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Frontend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Backend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Database
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Security
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Pipelines
        </span>
      </div>
    </div>
  );
};
