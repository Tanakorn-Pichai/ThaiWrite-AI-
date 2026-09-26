/**
 * ThaiWrite AI - Backend API Client
 *
 * Connects the React frontend to the FastAPI backend service
 * with support for fallback to local mock generators if backend is offline.
 */

import {
  AnalysisResult,
  StructureResult,
  DocTemplate,
  WritingStyle,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface SubmitAnalysisParams {
  templateId: string;
  writingStyle: WritingStyle;
  inputMode: 'text' | 'file';
  text?: string;
  file?: File;
}

export interface AnalysisResponseData {
  jobId: string;
  documentName: string;
  languageResult: AnalysisResult;
  structureResult: StructureResult;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  step?: string;
  result?: AnalysisResponseData;
}

/**
 * Fetch all standard templates from backend
 */
export async function fetchTemplates(): Promise<DocTemplate[]> {
  const res = await fetch(`${API_BASE_URL}/templates`);
  if (!res.ok) {
    throw new Error(`Failed to fetch templates: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Upload custom template file (.docx, .pdf)
 */
export async function uploadCustomTemplate(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/templates/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload template: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Submit document analysis (Async Celery task)
 */
export async function submitAnalysis(params: SubmitAnalysisParams): Promise<JobStatusResponse> {
  const formData = new FormData();
  formData.append('template_id', params.templateId);
  formData.append('writing_style', params.writingStyle);
  formData.append('input_mode', params.inputMode);

  if (params.inputMode === 'text' && params.text) {
    formData.append('text', params.text);
  } else if (params.inputMode === 'file' && params.file) {
    formData.append('file', params.file);
  }

  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'การส่งเอกสารตรวจสอบล้มเหลว');
  }

  return res.json();
}

/**
 * Poll job status until complete or failed
 */
export async function pollAnalysisJob(
  jobId: string,
  onProgress?: (step: string) => void,
  intervalMs = 1500,
  maxAttempts = 40
): Promise<AnalysisResponseData> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${API_BASE_URL}/analyze/${jobId}`);
    if (!res.ok) {
      throw new Error(`Polling error: ${res.statusText}`);
    }

    const data: JobStatusResponse = await res.json();

    if (data.status === 'completed' && data.result) {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new Error('การประมวลผลเอกสารล้มเหลว กรุณาลองใหม่อีกครั้ง');
    }

    if (data.step && onProgress) {
      onProgress(data.step);
    }

    // Wait before next poll
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('หมดเวลาการรอผลลัพธ์ (Timeout)');
}
