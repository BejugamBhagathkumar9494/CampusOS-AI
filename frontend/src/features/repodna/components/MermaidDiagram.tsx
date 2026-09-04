import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Code, Eye, ZoomIn, ZoomOut, RotateCcw, Copy, Check, AlertCircle } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [scale, setScale] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(true);

  // Clean raw chart content (strip backticks, extra labels)
  const sanitizeChart = (raw: string): string => {
    let clean = raw.trim();
    if (clean.startsWith('```mermaid')) {
      clean = clean.replace(/^```mermaid\s*/, '').replace(/```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```$/, '');
    }
    // Remove headers like "MERMAID SYSTEM DIAGRAM CODE:" if present
    clean = clean.replace(/^[#\s]*mermaid\s*(?:system\s*)?(?:diagram\s*)?(?:code)?[:\s]*/i, '').trim();
    return clean;
  };

  useEffect(() => {
    let isMounted = true;
    const cleanChart = sanitizeChart(chart);

    if (!cleanChart) {
      setError('No diagram syntax provided');
      setIsRendering(false);
      return;
    }

    const renderChart = async () => {
      setIsRendering(true);
      setError(null);
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#FAF0E9',
            primaryTextColor: '#1C211F',
            primaryBorderColor: '#C85A32',
            lineColor: '#C85A32',
            secondaryColor: '#FAF7F2',
            tertiaryColor: '#FFFFFF',
            edgeLabelBackground: '#FFFFFF',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif'
          },
          securityLevel: 'loose'
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart);

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
          setIsRendering(false);
        }
      } catch (err: any) {
        console.warn('Mermaid rendering error:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to render architecture diagram');
          setIsRendering(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sanitizeChart(chart));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 2.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.6));
  const handleResetZoom = () => setScale(1);

  return (
    <div className={`rounded-2xl border border-[#EAE3D8] bg-[#FFFFFF] overflow-hidden shadow-xs ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE3D8] bg-[#FAF7F2] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('diagram')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'diagram'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-[#5E6763] hover:text-[#1C211F] hover:bg-[#FAF0E9]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual Diagram
          </button>
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'code'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'text-[#5E6763] hover:text-[#1C211F] hover:bg-[#FAF0E9]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Mermaid Code
          </button>
        </div>

        <div className="flex items-center gap-1">
          {viewMode === 'diagram' && (
            <div className="flex items-center gap-1 mr-2 border-r border-[#EAE3D8] pr-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded-md text-[#5E6763] hover:text-[#C85A32] hover:bg-[#FAF0E9] transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-[#5E6763] w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded-md text-[#5E6763] hover:text-[#C85A32] hover:bg-[#FAF0E9] transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 rounded-md text-[#5E6763] hover:text-[#C85A32] hover:bg-[#FAF0E9] transition-all"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5E6763] hover:text-[#C85A32] hover:bg-[#FAF0E9] transition-all"
            title="Copy Diagram Syntax"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#5E8C71]" />
                <span className="text-[#5E8C71]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'diagram' ? (
        <div className="p-6 overflow-x-auto min-h-[320px] flex items-center justify-center bg-[#FFFFFF]">
          {isRendering ? (
            <div className="text-center py-12 space-y-2 text-[#8E9893]">
              <div className="w-6 h-6 border-2 border-[#C85A32] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-medium">Generating visual system diagram...</p>
            </div>
          ) : error ? (
            <div className="text-center p-6 space-y-3 max-w-md">
              <AlertCircle className="w-8 h-8 text-[#D9822B] mx-auto" />
              <p className="text-xs text-[#5E6763]">
                Diagram rendering fallback. You can inspect or copy the full system flow below:
              </p>
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-left font-mono text-xs text-[#2D3330] overflow-x-auto">
                <pre>{sanitizeChart(chart)}</pre>
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </div>
      ) : (
        <div className="p-4 bg-[#1C211F] text-[#FAF7F2] font-mono text-xs overflow-x-auto">
          <pre className="text-[#FDF2ED] leading-relaxed">{sanitizeChart(chart)}</pre>
        </div>
      )}
    </div>
  );
};
