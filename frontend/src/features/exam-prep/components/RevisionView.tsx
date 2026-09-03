import React, { useState } from 'react';
import {
  Zap,
  Clock,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  FileCheck,
  Bookmark,
  Printer
} from 'lucide-react';
import { OneDayRevisionData, LastMinuteRevisionData } from '../types';

interface RevisionViewProps {
  oneDayData: OneDayRevisionData | null;
  lastMinuteData: LastMinuteRevisionData | null;
  subjectName: string;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  oneDayData,
  lastMinuteData,
  subjectName
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'one_day' | 'last_minute'>('one_day');

  return (
    <div className="space-y-6">
      {/* Subtab Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('one_day')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 ${
              activeSubTab === 'one_day'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" /> One-Day Complete Revision
          </button>
          <button
            onClick={() => setActiveSubTab('last_minute')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 ${
              activeSubTab === 'last_minute'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" /> Last-Minute High-Yield Sheet
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" /> Print / Save PDF
        </button>
      </div>

      {/* ONE-DAY REVISION MODE */}
      {activeSubTab === 'one_day' && (
        <div className="space-y-6 animate-fade-in">
          {oneDayData && oneDayData.units && oneDayData.units.length > 0 ? (
            oneDayData.units.map((u, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center text-sm">
                      U{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{u.unit}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{subjectName} Core Revision</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                    One-Day Focus
                  </span>
                </div>

                {/* 10 Key Concepts */}
                {u.key_concepts && u.key_concepts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> 10 Key Concepts
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {u.key_concepts.map((concept, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {cIdx + 1}
                          </span>
                          <span>{concept}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Definitions */}
                {u.important_definitions && u.important_definitions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-purple-600" /> Essential Definitions
                    </h4>
                    <div className="space-y-2">
                      {u.important_definitions.map((def, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-slate-800"
                        >
                          <strong className="text-purple-900">{def.term}:</strong> {def.definition}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Questions */}
                {u.top_questions && u.top_questions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Top Expected Examination Questions
                    </h4>
                    <ul className="space-y-2">
                      {u.top_questions.map((q, qIdx) => (
                        <li
                          key={qIdx}
                          className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs font-bold text-emerald-950"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No One-Day Revision notes generated yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "Generate Exam Notes" above to create comprehensive revision sheets.
              </p>
            </div>
          )}
        </div>
      )}

      {/* LAST-MINUTE REVISION MODE */}
      {activeSubTab === 'last_minute' && (
        <div className="space-y-6 animate-fade-in">
          {lastMinuteData ? (
            <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-amber-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-extrabold flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {lastMinuteData.title || 'Last-Minute High-Yield Revision Sheet'}
                    </h3>
                    <p className="text-xs text-amber-800 font-medium">
                      High-value compact sheet strictly derived from your uploaded notes
                    </p>
                  </div>
                </div>
              </div>

              {/* Essential High-Value Points */}
              {lastMinuteData.essential_points && lastMinuteData.essential_points.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" /> Must-Know Exam Principles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lastMinuteData.essential_points.map((pt, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3.5 rounded-2xl bg-white border border-amber-100 shadow-xs text-xs font-semibold text-slate-800 flex items-start gap-2.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Exam Traps & Tips */}
              {lastMinuteData.quick_exam_traps_and_tips && (
                <div className="p-5 rounded-2xl bg-white border border-amber-200/80 space-y-2">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" /> Professor's Exam Traps & Key Reminders
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {lastMinuteData.quick_exam_traps_and_tips.map((tip, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2 font-medium">
                        <span className="text-amber-600 font-bold">⚠️</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No Last-Minute Revision sheet generated yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
