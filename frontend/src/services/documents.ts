export async function fetchDocumentsByRole(role: string): Promise<any[]> {
  try {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE}/api/v1/ai/knowledge/list?role=${role}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error('[DocumentsService] Failed to fetch documents:', error);
    return [];
  }
}

export async function uploadDocument(file: File, role: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', role);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE}/api/v1/ai/knowledge/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.detail || 'Upload failed' };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Document indexed successfully',
      document: data.document
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Document upload failed' };
  }
}
