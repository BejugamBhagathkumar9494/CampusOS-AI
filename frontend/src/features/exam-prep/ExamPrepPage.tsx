import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  UploadCloud,
  FileText,
  Award,
  Layers,
  Zap,
  MessageSquare,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { examPrepService } from './services/examPrepService';
import {
  StudyCollection,
  StudyDocument,
  GeneratedMaterialsGroup,
  AnswerItem,
  ImportantQuestionItem,
  QuerySubjectResponse
} from './types';
import { PDFUploader } from './components/PDFUploader';
import { SubjectModal } from './components/SubjectModal';
import { AnswerCard } from './components/AnswerCard';
import { RevisionView } from './components/RevisionView';

type TabType =
  | 'upload'
  | 'subjects'
  | 'summary'
  | 'two_marks'
  | 'four_marks'
  | 'ten_marks'
  | 'important'
  | 'revision'
  | 'ask_ai';

export default function ExamPrepPage() {
  const { profile } = useAuth();

  const [collections, setCollections] = useState<StudyCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<StudyCollection | null>(null);
  const [collectionDocs, setCollectionDocs] = useState<StudyDocument[]>([]);
  const [materials, setMaterials] = useState<GeneratedMaterialsGroup>({
    summaries: [],
    two_mark_questions: [],
    four_mark_questions: [],
    ten_mark_questions: [],
    important_questions: [],
    one_day_revision: null,
    last_minute_revision: null
  });

  const [activeTab, setActiveTab] = useState<TabType>('subjects');
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ask AI Chat state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiMarkTarget, setAiMarkTarget] = useState<number | undefined>(undefined);
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [aiAnswerResult, setAiAnswerResult] = useState<QuerySubjectResponse | null>(null);

  // Load user collections on mount silently without screen flash
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const list = await examPrepService.getCollections();
        if (isMounted) {
          setCollections(list || []);
          if (list && list.length > 0 && !selectedCollection) {
            handleSelectCollection(list[0]);
          }
        }
      } catch (err: any) {
        console.warn('Silent collections load warning:', err);
      }
    }
    init();
    return () => { isMounted = false; };
  }, [profile?.id]);

  const loadCollections = async () => {
    try {
      const list = await examPrepService.getCollections();
      setCollections(list || []);
      if (list && list.length > 0 && !selectedCollection) {
        handleSelectCollection(list[0]);
      }
    } catch (err: any) {
      console.warn('Error loading collections:', err);
    }
  };

  const handleSelectCollection = async (col: StudyCollection) => {
    setSelectedCollection(col);
    try {
      const detail = await examPrepService.getCollectionDetail(col.id);
      setCollectionDocs(detail.documents || []);

      // Load generated materials
      const matRes = await examPrepService.getMaterials(col.id);
      if (matRes && matRes.materials) {
        setMaterials(matRes.materials);
      }
    } catch (err) {
      console.warn('Could not load collection materials:', err);
    }
  };

  const handleCreateCollection = async (data: {
    subject_name: string;
    course_code: string;
    semester: number;
    branch: string;
    academic_year: string;
  }) => {
    try {
      setIsLoading(true);
      const newCol = await examPrepService.createCollection(data);
      setCollections((prev) => [newCol, ...prev]);
      setSelectedCollection(newCol);
      setIsModalOpen(false);
      setActiveTab('upload');
      setStatusMessage({
        type: 'success',
        text: `Created study collection for '${newCol.subject_name}'. Please upload your unit PDF notes now.`
      });
    } catch (err: any) {
      alert(`Failed to create collection: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPDFs = async (files: File[]) => {
    if (!selectedCollection) return;
    try {
      setIsUploading(true);
      setStatusMessage({
        type: 'success',
        text: `Uploading & chunking ${files.length} PDF notes into knowledge vector index...`
      });
      const res = await examPrepService.uploadPDFs(selectedCollection.id, files);
      
      // Auto-generate complete exam prep suite (2-mark, 4-mark, 10-mark, summary & revision)
      setIsGenerating(true);
      setStatusMessage({
        type: 'success',
        text: `Uploaded ${res.files_uploaded_count} PDFs! AI is now generating 2-mark, 4-mark, 10-mark answers and chapter summaries...`
      });
      
      try {
        await examPrepService.generateExamNotes(selectedCollection.id);
        const matRes = await examPrepService.getMaterials(selectedCollection.id);
        if (matRes && matRes.materials) {
          setMaterials(matRes.materials);
        }
        setStatusMessage({
          type: 'success',
          text: `Success! Complete exam preparation notes (2-mark, 4-mark, 10-mark, summary) generated for ${selectedCollection.subject_name}!`
        });
        setActiveTab('summary');
      } catch (genErr) {
        console.warn('Auto-generation warning:', genErr);
        setStatusMessage({
          type: 'success',
          text: `Uploaded ${res.files_uploaded_count} PDFs (${res.total_chunks_indexed} indexed chunks)! Click 'Generate Exam Notes' to generate questions.`
        });
        setActiveTab('subjects');
      } finally {
        setIsGenerating(false);
      }

      await handleSelectCollection(selectedCollection);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateExamNotes = async () => {
    if (!selectedCollection) return;
    try {
      setIsGenerating(true);
      setStatusMessage(null);
      const res = await examPrepService.generateExamNotes(selectedCollection.id);
      setStatusMessage({
        type: 'success',
        text: `AI generated complete exam preparation suite for ${selectedCollection.subject_name}!`
      });
      // Refresh materials
      const matRes = await examPrepService.getMaterials(selectedCollection.id);
      if (matRes && matRes.materials) {
        setMaterials(matRes.materials);
      }
      setActiveTab('summary');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to generate exam notes. Verify Gemini API key.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCollection = async (colId: string) => {
    if (!confirm('Are you sure you want to delete this subject collection and all its exam notes?')) return;
    try {
      await examPrepService.deleteCollection(colId);
      setCollections((prev) => prev.filter((c) => c.id !== colId));
      if (selectedCollection?.id === colId) {
        const remaining = collections.filter((c) => c.id !== colId);
        if (remaining.length > 0) handleSelectCollection(remaining[0]);
        else setSelectedCollection(null);
      }
      setStatusMessage({ type: 'success', text: 'Collection deleted successfully.' });
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || !selectedCollection || isAiAnswering) return;

    try {
      setIsAiAnswering(true);
      const res = await examPrepService.querySubject({
        collection_id: selectedCollection.id,
        question: aiQuestion.trim(),
        marks: aiMarkTarget,
        unit: selectedUnit !== 'All' ? selectedUnit : undefined
      });
      setAiAnswerResult(res);
    } catch (err: any) {
      setAiAnswerResult({
        question: aiQuestion,
        answer: 'That information is not available in the uploaded study material.',
        sources: [],
        keywords: [],
        grounded: false
      });
    } finally {
      setIsAiAnswering(false);
    }
  };

  // Extract distinct units available
  const availableUnits = ['All', 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

  const filterByUnit = (items: AnswerItem[]) => {
    if (selectedUnit === 'All') return items;
    return items.filter((item) => item.unit?.toLowerCase().includes(selectedUnit.toLowerCase()));
  };

  return (
    <div className="space-y-7 animate-fade-in font-sans pb-12">
      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-[#FAF7F2] via-[#FDF2ED] to-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] p-7 sm:p-8 rounded-[32px] shadow-sm relative overflow-hidden">
        <div className="space-y-2.5 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0E9] text-[#C85A32] text-xs font-bold border border-[#EAE3D8]">
            <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" /> B.Tech Multi-Unit PDF Exam Generator
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C211F]">
            AI Exam Preparation from <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#C85A32] via-[#D9822B] to-[#786498]">Multiple PDF Notes</span> 🎓
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6763] font-medium leading-relaxed">
            Upload all unit PDFs for any engineering subject. CampusOS processes the entire lesson set as a single knowledge collection to generate complete summaries, 2-mark, 4-mark, 10-mark model answers, and revision sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-extrabold text-xs shadow-lg shadow-[#C85A32]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Subject Collection
          </button>
          {selectedCollection && (
            <button
              onClick={handleGenerateExamNotes}
              disabled={isGenerating || collectionDocs.length === 0}
              className="px-5 py-3 rounded-2xl bg-[#786498] hover:bg-[#786498]/90 text-white font-extrabold text-xs shadow-lg shadow-[#786498]/25 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Analyzing & Generating...' : 'Generate Exam Notes'}
            </button>
          )}
        </div>

        <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#FDF2ED] rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-[#F0F6F2] text-[#5E8C71] border border-[#5E8C71]/30'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#5E8C71] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[#8E9893] hover:text-[#1C211F]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Cards / Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5 sm:gap-3">
        {[
          { id: 'subjects', name: 'My Subjects', icon: BookOpen, count: collections.length },
          { id: 'upload', name: 'Upload Notes', icon: UploadCloud, count: collectionDocs.length },
          { id: 'summary', name: 'Summary', icon: FileText, count: materials.summaries.length },
          { id: 'two_marks', name: '2 Marks', icon: Award, count: materials.two_mark_questions.length },
          { id: 'four_marks', name: '4 Marks', icon: Layers, count: materials.four_mark_questions.length },
          { id: 'ten_marks', name: '10 Marks', icon: Award, count: materials.ten_mark_questions.length },
          { id: 'important', name: 'Important Qs', icon: Sparkles, count: materials.important_questions.length },
          { id: 'revision', name: 'Revision Mode', icon: Zap, count: materials.one_day_revision ? 1 : 0 },
          { id: 'ask_ai', name: 'Ask AI Notes', icon: MessageSquare }
        ].map((card) => {
          const Icon = card.icon;
          const isActive = activeTab === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setActiveTab(card.id as TabType)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-md shadow-[#C85A32]/20 scale-[1.02]'
                  : 'bg-white hover:bg-[#FAF7F2] text-[#2D3330] border-[#EAE3D8]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#C85A32]'}`} />
                {card.count !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#5E6763]'
                    }`}
                  >
                    {card.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold tracking-tight block truncate">{card.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subject Header & Unit Filter Bar */}
      {selectedCollection && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EAE3D8] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#C85A32] font-black flex items-center justify-center text-xs">
              {selectedCollection.course_code.substring(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#1C211F]">
                  {selectedCollection.subject_name}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-[#FDF2ED] text-[#C85A32] text-[10px] font-bold">
                  {selectedCollection.course_code}
                </span>
                <span className="text-[#8E9893] text-xs">• Sem {selectedCollection.semester} ({selectedCollection.branch})</span>
              </div>
              <p className="text-[11px] text-[#5E6763] font-medium">
                {collectionDocs.length} PDF files uploaded • Unified Exam Material Ready
              </p>
            </div>
          </div>

          {/* Unit Filter */}
          {['summary', 'two_marks', 'four_marks', 'ten_marks'].includes(activeTab) && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-[11px] font-bold text-[#8E9893] uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#C85A32]" /> Unit:
              </span>
              {availableUnits.map((u) => (
                <button
                  key={u}
                  onClick={() => setSelectedUnit(u)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedUnit === u
                      ? 'bg-[#C85A32] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#5E6763] hover:bg-[#F4EFEA]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: MY SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C85A32]" /> Your Subject Study Collections ({collections.length})
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#C85A32] text-white font-bold text-xs hover:bg-[#B44E27] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subject
            </button>
          </div>

          {collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {collections.map((col) => {
                const isSelected = selectedCollection?.id === col.id;
                return (
                  <div
                    key={col.id}
                    onClick={() => handleSelectCollection(col)}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#FDF2ED] to-[#FAF7F2] border-[#C85A32] shadow-md ring-2 ring-[#C85A32]/20'
                        : 'bg-white border-[#EAE3D8] hover:border-[#C85A32]/40 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 rounded-xl bg-[#FDF2ED] text-[#C85A32] text-xs font-extrabold font-mono">
                        {col.course_code}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(col.id);
                        }}
                        className="p-1.5 rounded-lg text-[#8E9893] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-base font-extrabold text-[#1C211F] line-clamp-1 mb-1">
                      {col.subject_name}
                    </h4>
                    <p className="text-xs text-[#5E6763] font-medium mb-4">
                      Semester {col.semester} • {col.branch} • {col.academic_year}
                    </p>

                    <div className="flex items-center justify-between border-t border-[#F3ECE2] pt-4 text-xs">
                      <div className="flex items-center gap-2 text-[#5E6763] font-bold">
                        <FileText className="w-4 h-4 text-[#C85A32]" />
                        <span>{col.documents_count} PDFs Uploaded</span>
                      </div>
                      <span className="text-[#C85A32] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Open Notes <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE3D8] space-y-4">
              <BookOpen className="w-12 h-12 text-[#8E9893] mx-auto" />
              <div>
                <h4 className="text-base font-extrabold text-[#1C211F]">No Subject Study Collections Yet</h4>
                <p className="text-xs text-[#5E6763] max-w-sm mx-auto mt-1">
                  Create a subject study collection (e.g. Database Management Systems, CS401) and upload your lesson PDFs to begin.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-[#C85A32] text-white font-bold text-xs hover:bg-[#B44E27] shadow-md shadow-[#C85A32]/20 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Subject Collection
              </button>
            </div>
          )}

          {/* Uploaded Documents in Selected Collection */}
          {selectedCollection && (
            <div className="bg-white rounded-3xl p-6 border border-[#EAE3D8] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-[#1C211F] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C85A32]" /> Uploaded Unit PDFs in {selectedCollection.subject_name} ({collectionDocs.length})
                </h4>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="text-xs font-bold text-[#C85A32] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload more PDFs
                </button>
              </div>

              {collectionDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {collectionDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-[#1C211F] truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8E9893] font-semibold mt-0.5">
                            <span className="text-[#C85A32] font-bold">{doc.unit_detected || 'Unit'}</span>
                            <span>•</span>
                            <span>{doc.page_count} Pages</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#F0F6F2] text-[#5E8C71] text-[10px] font-black shrink-0">
                        ✓ Processed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5E6763] py-3 text-center">
                  No PDFs uploaded yet in this collection.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOAD NOTES */}
      {activeTab === 'upload' && selectedCollection && (
        <div className="space-y-6">
          <PDFUploader
            onUpload={handleUploadPDFs}
            isUploading={isUploading}
            subjectName={selectedCollection.subject_name}
          />
        </div>
      )}

      {/* TAB 3: COMPLETE CHAPTER SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C85A32]" /> Complete Chapter Summaries (Unit-by-Unit)
            </h3>
            <span className="text-xs text-[#5E6763] font-semibold">
              Showing: {selectedUnit} ({filterByUnit(materials.summaries).length} Units)
            </span>
          </div>

          {filterByUnit(materials.summaries).length > 0 ? (
            <div className="space-y-6">
              {filterByUnit(materials.summaries).map((item) => (
                <AnswerCard key={item.id || item.unit} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EAE3D8]">
              <FileText className="w-12 h-12 text-[#8E9893] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1C211F]">No chapter summaries generated yet.</p>
              <p className="text-xs text-[#5E6763] mt-1">
                Click "Generate Exam Notes" at the top to generate full summaries for all units.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: 2-MARK QUESTIONS */}
      {activeTab === 'two_marks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#5E8C71]" /> 2-Mark Short Answer Questions & Answers
              </h3>
              <p className="text-xs text-[#8E9893] font-medium mt-0.5">
                Concise, keyword-rich answers structured with Definition + 2 Key Points (~3-5 sentences)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#F0F6F2] text-[#5E8C71] text-xs font-extrabold">
              {filterByUnit(materials.two_mark_questions).length} Questions
            </span>
          </div>

          {filterByUnit(materials.two_mark_questions).length > 0 ? (
            <div className="space-y-5">
              {filterByUnit(materials.two_mark_questions).map((item, idx) => (
                <AnswerCard key={item.id || idx} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EAE3D8]">
              <Award className="w-12 h-12 text-[#8E9893] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1C211F]">No 2-mark questions generated yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: 4-MARK QUESTIONS */}
      {activeTab === 'four_marks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C85A32]" /> 4-Mark Medium-Answer Questions & Answers
              </h3>
              <p className="text-xs text-[#8E9893] font-medium mt-0.5">
                Structured with 1. Definition, 2. Explanation, 3. 2-4 Points, 4. Example
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FDF2ED] text-[#C85A32] text-xs font-extrabold">
              {filterByUnit(materials.four_mark_questions).length} Questions
            </span>
          </div>

          {filterByUnit(materials.four_mark_questions).length > 0 ? (
            <div className="space-y-5">
              {filterByUnit(materials.four_mark_questions).map((item, idx) => (
                <AnswerCard key={item.id || idx} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EAE3D8]">
              <Layers className="w-12 h-12 text-[#8E9893] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1C211F]">No 4-mark questions generated yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: 10-MARK QUESTIONS */}
      {activeTab === 'ten_marks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#786498]" /> 10-Mark Complete University Long Answers
              </h3>
              <p className="text-xs text-[#8E9893] font-medium mt-0.5">
                Exhaustive 500-800 words: Intro, Concept, Working, Types, Example, Advantages, Limitations, Diagram citations & Conclusion
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#F4F1F8] text-[#786498] text-xs font-extrabold">
              {filterByUnit(materials.ten_mark_questions).length} Questions
            </span>
          </div>

          {filterByUnit(materials.ten_mark_questions).length > 0 ? (
            <div className="space-y-5">
              {filterByUnit(materials.ten_mark_questions).map((item, idx) => (
                <AnswerCard key={item.id || idx} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EAE3D8]">
              <Award className="w-12 h-12 text-[#8E9893] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1C211F]">No 10-mark questions generated yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: IMPORTANT QUESTIONS */}
      {activeTab === 'important' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#1C211F] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D9822B]" /> Most Important University Exam Questions
              </h3>
              <p className="text-xs text-[#8E9893] font-medium mt-0.5">
                Prioritized and ranked based on recurrence and technical depth in uploaded PDF notes
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FEF7ED] text-[#D9822B] text-xs font-extrabold">
              {materials.important_questions.length} Ranked Questions
            </span>
          </div>

          {materials.important_questions.length > 0 ? (
            <div className="space-y-4">
              {materials.important_questions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-[#EAE3D8] shadow-xs hover:border-[#D9822B]/50 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#FEF7ED] text-[#D9822B] text-xs font-black flex items-center justify-center">
                        #{q.priority_rank || idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F4F1F8] text-[#786498] text-xs font-bold">
                        {q.marks} Marks
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#5E6763] text-xs font-bold">
                        {q.unit}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#D9822B] bg-[#FEF7ED] px-2.5 py-1 rounded-full">
                      High priority based on uploaded notes
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#1C211F]">{q.question}</h4>

                  {q.priority_reason && (
                    <p className="text-xs text-[#5E6763] bg-[#FAF7F2] p-3 rounded-xl border border-[#EAE3D8] font-medium">
                      <strong className="text-[#1C211F]">Ranking Signal:</strong> {q.priority_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#EAE3D8]">
              <Sparkles className="w-12 h-12 text-[#8E9893] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1C211F]">No important questions generated yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: REVISION MODE */}
      {activeTab === 'revision' && selectedCollection && (
        <RevisionView
          oneDayData={materials.one_day_revision}
          lastMinuteData={materials.last_minute_revision}
          subjectName={selectedCollection.subject_name}
        />
      )}

      {/* TAB 9: ASK AI NOTES */}
      {activeTab === 'ask_ai' && selectedCollection && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D8] shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#F3ECE2] pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2ED] text-[#C85A32] flex items-center justify-center shadow-inner">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1C211F]">
                Ask Questions on {selectedCollection.subject_name}
              </h3>
              <p className="text-xs text-[#5E6763] font-medium">
                Strictly grounded in your uploaded PDF notes (Anti-Hallucination Verified)
              </p>
            </div>
          </div>

          {/* Prompt suggestions */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#8E9893]">Try asking:</span>
            {[
              'Explain this for 10 marks',
              'Give me a 4-mark answer',
              'What are the key definitions?',
              'Summarize Unit 1',
              'Explain the architecture diagram'
            ].map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAiQuestion(s)}
                className="px-3 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#FDF2ED] text-[#5E6763] hover:text-[#C85A32] text-xs font-semibold transition-colors border border-[#EAE3D8]"
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleAskAi} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder={`e.g. What is normalization? or Explain 2PL for 10 marks in ${selectedCollection.subject_name}`}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-[#EAE3D8] focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 text-sm font-medium outline-none transition-all shadow-inner text-[#1C211F]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={aiMarkTarget || ''}
                  onChange={(e) => setAiMarkTarget(e.target.value ? Number(e.target.value) : undefined)}
                  className="px-4 py-3.5 rounded-2xl border border-[#EAE3D8] text-xs font-bold text-[#5E6763] bg-white outline-none"
                >
                  <option value="">Auto Mark Format</option>
                  <option value="2">2-Mark Format</option>
                  <option value="4">4-Mark Format</option>
                  <option value="10">10-Mark Format</option>
                </select>

                <button
                  type="submit"
                  disabled={isAiAnswering || !aiQuestion.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-extrabold text-xs shadow-lg shadow-[#C85A32]/25 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
                >
                  {isAiAnswering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isAiAnswering ? 'Searching Notes...' : 'Ask AI'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* AI Result Card */}
          {aiAnswerResult && (
            <div className="pt-4 border-t border-[#F3ECE2]">
              <AnswerCard
                item={{
                  id: 9999,
                  material_type: (aiAnswerResult.marks ? `${aiAnswerResult.marks}_mark` : '10_mark') as any,
                  question: aiAnswerResult.question,
                  answer: aiAnswerResult.answer,
                  marks: aiAnswerResult.marks || 0,
                  unit: 'Uploaded Notes',
                  topic: 'AI Grounded Query',
                  keywords: aiAnswerResult.keywords || [],
                  sources: aiAnswerResult.sources || []
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal for creating a new subject collection */}
      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCollection}
        isSubmitting={isLoading}
      />
    </div>
  );
}
