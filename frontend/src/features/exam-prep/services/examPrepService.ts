import { fetchWithAuth, getApiBaseUrl, getAuthToken } from '../../../services/api';
import {
  StudyCollection,
  StudyDocument,
  GeneratedMaterialsGroup,
  QuerySubjectResponse
} from '../types';

export const examPrepService = {
  // Collections
  async getCollections(): Promise<StudyCollection[]> {
    return fetchWithAuth<StudyCollection[]>('/exam-prep/collections');
  },

  async createCollection(data: {
    subject_name: string;
    course_code: string;
    semester: number;
    branch: string;
    academic_year: string;
  }): Promise<StudyCollection> {
    return fetchWithAuth<StudyCollection>('/exam-prep/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCollectionDetail(collectionId: string): Promise<{
    id: string;
    subject_name: string;
    course_code: string;
    semester: number;
    branch: string;
    academic_year: string;
    created_at: string;
    documents: StudyDocument[];
  }> {
    return fetchWithAuth(`/exam-prep/collections/${collectionId}`);
  },

  async deleteCollection(collectionId: string): Promise<{ status: string; message: string }> {
    return fetchWithAuth(`/exam-prep/collections/${collectionId}`, {
      method: 'DELETE',
    });
  },

  // Multi-PDF Upload
  async uploadPDFs(collectionId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const token = await getAuthToken();
    const API_URL = getApiBaseUrl();
    const res = await fetch(`${API_URL}/exam-prep/collections/${collectionId}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to upload PDF files.');
    }

    return res.json();
  },

  // Generate complete exam notes
  async generateExamNotes(collectionId: string): Promise<{
    status: string;
    message: string;
    data: any;
  }> {
    return fetchWithAuth(`/exam-prep/collections/${collectionId}/generate`, {
      method: 'POST',
    });
  },

  // Get generated materials
  async getMaterials(collectionId: string, materialType?: string): Promise<{
    collection_id: string;
    subject_name: string;
    course_code: string;
    materials: GeneratedMaterialsGroup;
  }> {
    const url = materialType
      ? `/exam-prep/collections/${collectionId}/materials?material_type=${materialType}`
      : `/exam-prep/collections/${collectionId}/materials`;
    return fetchWithAuth(url);
  },

  // Subject Grounded Query
  async querySubject(payload: {
    collection_id: string;
    question: string;
    marks?: number;
    unit?: string;
  }): Promise<QuerySubjectResponse> {
    return fetchWithAuth<QuerySubjectResponse>('/exam-prep/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};
