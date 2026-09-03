export interface StudyRepository {
  id: string;
  owner: string;
  repo_name: string;
  github_url: string;
  default_branch: string;
  description: string;
  stars_count: number;
  forks_count: number;
  primary_language: string;
  file_count: number;
  status: 'pending' | 'scanning' | 'analyzed' | 'failed';
  created_at: string;
}

export interface TechItem {
  name: string;
  evidence: string;
}

export interface TechStackMap {
  Frontend?: TechItem[];
  Backend?: TechItem[];
  Database?: TechItem[];
  'AI & ML'?: TechItem[];
  Authentication?: TechItem[];
  'Deployment & DevOps'?: TechItem[];
  [key: string]: TechItem[] | undefined;
}

export interface FolderExplanation {
  folder: string;
  explanation: string;
}

export interface ApplicationFlow {
  flow_name: string;
  steps: string[];
}

export interface DbTableInfo {
  name: string;
  purpose: string;
  fields: string[];
  source_file?: string;
}

export interface DatabaseAnalysis {
  detected_db: string;
  tables_or_collections: DbTableInfo[];
  connection_file?: string;
}

export interface ApiEndpointItem {
  method: string;
  endpoint: string;
  purpose: string;
  source_file: string;
  controller: string;
}

export interface AuthenticationAnalysis {
  detected: boolean;
  mechanism: string;
  login_flow: string;
  protected_routes: string[];
  source_files: string[];
}

export interface ProjectHealth {
  organization_score?: number;
  strengths: string[];
  tests_present: boolean;
  documentation_quality: string;
}

export interface ImprovementItem {
  area: string;
  recommendation: string;
  evidence: string;
}

export interface InterviewQuestionItem {
  question: string;
  answer: string;
}

export interface RepositoryAnalysis {
  one_line_desc: string;
  short_summary: string;
  detailed_overview: string;
  beginner_explanation: string;
  interview_pitch: string;
  architecture: {
    pattern?: string;
    summary?: string;
    mermaid?: string;
  };
  tech_stack: TechStackMap;
  project_structure: FolderExplanation[];
  application_flows: ApplicationFlow[];
  database_analysis: DatabaseAnalysis;
  api_analysis: ApiEndpointItem[];
  authentication_analysis: AuthenticationAnalysis;
  project_health: ProjectHealth;
  improvements: ImprovementItem[];
  interview_questions: InterviewQuestionItem[];
}

export interface RepositoryFileItem {
  id: string;
  file_path: string;
  file_type: string;
  language: string;
  file_size_bytes: number;
  purpose_summary: string;
  excerpt: string;
  imports: string[];
  exports: string[];
}

export interface RepoAnalysisResponse {
  message: string;
  repository: StudyRepository;
  analysis: RepositoryAnalysis;
}

export interface RepoQueryResponse {
  answer: string;
  sources: { file_path: string }[];
  confidence: number;
}
