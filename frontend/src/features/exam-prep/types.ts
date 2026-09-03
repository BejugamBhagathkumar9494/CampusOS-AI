export interface StudyCollection {
  id: string;
  subject_name: string;
  course_code: string;
  semester: number;
  branch: string;
  academic_year: string;
  created_at: string;
  documents_count: number;
  chunks_count?: number;
  has_generated_materials?: boolean;
}

export interface StudyDocument {
  id: string;
  file_name: string;
  file_size_bytes: number;
  page_count: number;
  unit_detected?: string;
  processing_status: 'pending' | 'processing' | 'processed' | 'failed';
  error_message?: string;
  created_at?: string;
}

export interface SourceCitation {
  file_name: string;
  page_number: number;
  relevance?: number;
}

export interface DiagramInfo {
  has_source_diagram?: boolean;
  source_file?: string;
  page_number?: number;
  diagram_type?: string;
  diagram_ascii?: string;
}

export interface AnswerItem {
  id: number;
  material_type: '2_mark' | '4_mark' | '10_mark' | 'summary' | 'important_q';
  question?: string;
  answer: string;
  marks: number;
  unit: string;
  topic: string;
  keywords: string[];
  diagram_info?: DiagramInfo;
  sources: SourceCitation[];
  priority_rank?: number;
}

export interface ImportantQuestionItem {
  id: number;
  question: string;
  marks: number;
  unit: string;
  topic: string;
  priority_rank: number;
  priority_reason?: string;
  keywords: string[];
  sources: SourceCitation[];
}

export interface OneDayUnitRevision {
  unit: string;
  key_concepts: string[];
  important_definitions: { term: string; definition: string }[];
  important_formulas: string[];
  key_diagrams: string[];
  top_questions: string[];
}

export interface OneDayRevisionData {
  title: string;
  units: OneDayUnitRevision[];
}

export interface LastMinuteRevisionData {
  title: string;
  essential_points: string[];
  must_know_definitions: { term: string; summary: string }[];
  critical_formulas: string[];
  quick_exam_traps_and_tips: string[];
}

export interface GeneratedMaterialsGroup {
  summaries: AnswerItem[];
  two_mark_questions: AnswerItem[];
  four_mark_questions: AnswerItem[];
  ten_mark_questions: AnswerItem[];
  important_questions: ImportantQuestionItem[];
  one_day_revision: OneDayRevisionData | null;
  last_minute_revision: LastMinuteRevisionData | null;
}

export interface QuerySubjectResponse {
  question: string;
  marks?: number | null;
  answer: string;
  sources: SourceCitation[];
  keywords: string[];
  grounded: boolean;
}
