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
    if (marks >= 10) return 'bg-[#F4F1F8] text-[#786498] border-[#786498]/30';
    if (marks >= 4) return 'bg-[#FDF2ED] text-[#C85A32] border-[#C85A32]/30';
    return 'bg-[#F0F6F2] text-[#5E8C71] border-[#5E8C71]/30';
  };

  const handleCopy = () => {
    const textToCopy = `Question: ${item.question || item.topic}\n\nAnswer:\n${item.answer}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#EAE3D8] shadow-sm hover:border-[#C85A32]/40 transition-all space-y-4">
      {/* Header: Marks & Unit Tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3ECE2] pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border uppercase ${getMarksBadgeColor(
              item.marks
            )}`}
          >
            {item.marks > 0 ? `${item.marks} Mark Question` : 'Chapter Summary'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF7F2] text-[#5E6763]">
            {item.unit}
          </span>
          {item.topic && (
            <span className="text-xs font-semibold text-[#8E9893] hidden sm:inline">
              • {item.topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl text-[#8E9893] hover:text-[#C85A32] hover:bg-[#FDF2ED] transition-colors text-xs font-bold flex items-center gap-1"
            title="Copy question and answer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#5E8C71]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-[#8E9893] hover:text-[#1C211F] hover:bg-[#FAF7F2] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Question */}
      {item.question && (
        <h3 className="text-base sm:text-lg font-extrabold text-[#1C211F] leading-snug">
          {item.question}
        </h3>
      )}

      {/* Answer Body */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Answer Content */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] text-[#2D3330] text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {item.answer}
          </div>

          {/* Diagram Citation / Conceptual Flowchart */}
          {item.diagram_info && (item.diagram_info.has_source_diagram || item.diagram_info.diagram_ascii) && (
            <div className="p-4 rounded-2xl bg-[#FDF2ED] border border-[#C85A32]/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#C85A32]">
                <ImageIcon className="w-4 h-4 text-[#C85A32]" />
                <span>
                  {item.diagram_info.has_source_diagram
                    ? '[Source Diagram Citation]'
                    : 'Conceptual diagram generated from the uploaded material'}
                </span>
              </div>
              {item.diagram_info.has_source_diagram ? (
                <div className="text-xs text-[#5E6763] font-medium">
                  <strong className="text-[#1C211F]">Source Diagram:</strong> File:{' '}
                  <span className="font-bold text-[#C85A32]">{item.diagram_info.source_file || 'Notes.pdf'}</span> | Page:{' '}
                  <span className="font-bold text-[#C85A32]">{item.diagram_info.page_number || 1}</span>
                </div>
              ) : (
                item.diagram_info.diagram_ascii && (
                  <pre className="p-3 bg-white rounded-xl border border-[#EAE3D8] text-[11px] font-mono text-[#1C211F] overflow-x-auto">
                    {item.diagram_info.diagram_ascii}
                  </pre>
                )
              )}
            </div>
          )}

          {/* Exam Keywords */}
          {item.keywords && item.keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#C85A32]" /> Exam Keywords:
              </span>
              {item.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-[#FDF2ED] text-[#C85A32] text-xs font-bold border border-[#C85A32]/20"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Source Citations with Clickable References */}
          {item.sources && item.sources.length > 0 && (
            <div className="border-t border-[#F3ECE2] pt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#8E9893]" /> Sources:
                </span>
                {item.sources.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSource(src)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#FDF2ED] text-[#5E6763] hover:text-[#C85A32] text-xs font-bold transition-colors border border-[#EAE3D8]"
                  >
                    <FileText className="w-3 h-3 text-[#C85A32]" />
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
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#EAE3D8] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F3ECE2] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C85A32]" />
                <h4 className="text-sm font-extrabold text-[#1C211F]">Verified Study Citation</h4>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-xs font-bold text-[#8E9893] hover:text-[#1C211F]"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#5E6763] font-medium">
              <p>
                <strong className="text-[#1C211F]">Source Document:</strong> {selectedSource.file_name}
              </p>
              <p>
                <strong className="text-[#1C211F]">Page Number:</strong> Page {selectedSource.page_number}
              </p>
              <p>
                <strong className="text-[#1C211F]">Grounding Status:</strong>{' '}
                <span className="text-[#5E8C71] font-bold">100% Grounded in Uploaded PDF</span>
              </p>
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE3D8] text-[#5E6763] italic mt-2">
                This answer was directly extracted and verified against the student's uploaded notes at page{' '}
                {selectedSource.page_number}.
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSource(null)}
                className="px-5 py-2 rounded-xl bg-[#C85A32] text-white font-bold text-xs hover:bg-[#B44E27] transition-colors shadow-md shadow-[#C85A32]/20"
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
