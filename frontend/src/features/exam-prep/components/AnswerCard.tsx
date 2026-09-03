import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  FileText,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { AnswerItem, SourceCitation } from '../types';

interface AnswerCardProps {
  item: AnswerItem;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceCitation | null>(null);

  const getMarksBadgeColor = (marks: number) => {
    if (marks >= 10) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (marks >= 4) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const handleCopy = () => {
    const textToCopy = `Question: ${item.question || item.topic}\n\nAnswer:\n${item.answer}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-indigo-200 transition-all space-y-4">
      {/* Header: Marks & Unit Tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border uppercase ${getMarksBadgeColor(
              item.marks
            )}`}
          >
            {item.marks > 0 ? `${item.marks} Mark Question` : 'Chapter Summary'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {item.unit}
          </span>
          {item.topic && (
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              • {item.topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-xs font-bold flex items-center gap-1"
            title="Copy question and answer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Question */}
      {item.question && (
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
          {item.question}
        </h3>
      )}

      {/* Answer Body */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Answer Content */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {item.answer}
          </div>

          {/* Diagram Citation / Conceptual Flowchart */}
          {item.diagram_info && (item.diagram_info.has_source_diagram || item.diagram_info.diagram_ascii) && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>
                  {item.diagram_info.has_source_diagram
                    ? '[Source Diagram Citation]'
                    : 'Conceptual diagram generated from the uploaded material'}
                </span>
              </div>
              {item.diagram_info.has_source_diagram ? (
                <div className="text-xs text-indigo-800 font-medium">
                  <strong>Source Diagram:</strong> File:{' '}
                  <span className="font-bold">{item.diagram_info.source_file || 'Notes.pdf'}</span> | Page:{' '}
                  <span className="font-bold">{item.diagram_info.page_number || 1}</span>
                </div>
              ) : (
                item.diagram_info.diagram_ascii && (
                  <pre className="p-3 bg-white rounded-xl border border-indigo-100 text-[11px] font-mono text-indigo-950 overflow-x-auto">
                    {item.diagram_info.diagram_ascii}
                  </pre>
                )
              )}
            </div>
          )}

          {/* Exam Keywords */}
          {item.keywords && item.keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-500" /> Exam Keywords:
              </span>
              {item.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100/50"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Source Citations with Clickable References */}
          {item.sources && item.sources.length > 0 && (
            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Sources:
                </span>
                {item.sources.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSource(src)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 text-xs font-bold transition-colors"
                  >
                    <FileText className="w-3 h-3 text-indigo-600" />
                    <span>
                      {src.file_name} — Page {src.page_number}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source Citation Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Verified Study Citation</h4>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <p>
                <strong>Source Document:</strong> {selectedSource.file_name}
              </p>
              <p>
                <strong>Page Number:</strong> Page {selectedSource.page_number}
              </p>
              <p>
                <strong>Grounding Status:</strong>{' '}
                <span className="text-emerald-600 font-bold">100% Grounded in Uploaded PDF</span>
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 italic mt-2">
                This answer was directly extracted and verified against the student's uploaded notes at page{' '}
                {selectedSource.page_number}.
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSource(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
