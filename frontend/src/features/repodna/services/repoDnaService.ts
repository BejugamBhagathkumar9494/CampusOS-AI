import { fetchWithAuth } from '../../../services/api';
import {
  StudyRepository,
  RepoAnalysisResponse,
  RepositoryFileItem,
  RepoQueryResponse
} from '../types';

export const repoDnaService = {
  /**
   * Starts scan and analysis for a public GitHub repository.
   */
  async analyzeRepository(githubUrl: string): Promise<RepoAnalysisResponse> {
    return await fetchWithAuth<RepoAnalysisResponse>('/repodna/analyze', {
      method: 'POST',
      body: JSON.stringify({ github_url: githubUrl })
    });
  },

  /**
   * Lists all repositories analyzed by the current student.
   */
  async getUserRepositories(): Promise<StudyRepository[]> {
    return await fetchWithAuth<StudyRepository[]>('/repodna/repositories');
  },

  /**
   * Fetches full analysis report and metadata for a repository.
   */
  async getRepositoryDetails(repositoryId: string): Promise<{ repository: StudyRepository; analysis: any }> {
    return await fetchWithAuth<{ repository: StudyRepository; analysis: any }>(`/repodna/repositories/${repositoryId}`);
  },

  /**
   * Deletes a repository and its vector indices.
   */
  async deleteRepository(repositoryId: string): Promise<{ message: string }> {
    return await fetchWithAuth<{ message: string }>(`/repodna/repositories/${repositoryId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Fetches analyzed source files for a repository.
   */
  async getRepositoryFiles(repositoryId: string): Promise<RepositoryFileItem[]> {
    return await fetchWithAuth<RepositoryFileItem[]>(`/repodna/repositories/${repositoryId}/files`);
  },

  /**
   * Queries the codebase using grounded RAG assistant.
   */
  async queryRepository(repositoryId: string, question: string): Promise<RepoQueryResponse> {
    return await fetchWithAuth<RepoQueryResponse>('/repodna/query', {
      method: 'POST',
      body: JSON.stringify({
        repository_id: repositoryId,
        question
      })
    });
  }
};
