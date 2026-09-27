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
  HistoryItem,
} from '../types';
import { appLogger } from '../utils/logger';

// Follow the host used to open the frontend so LAN users reach the backend on the same machine.
// Override with VITE_API_URL when frontend and backend are deployed separately.
const runtimeApiBase = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:8000/api/v1`
  : 'http://127.0.0.1:8000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_URL || runtimeApiBase;

// crypto.randomUUID() is unavailable in some non-secure LAN contexts (HTTP).
// Keep request tracing working without blocking all API calls in those browsers.
function createRequestId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the compatible request ID format below.
  }
  return `thaiwrite-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get('X-Request-ID') || undefined;
  const payload = await response.json().catch(() => null) as { detail?: string } | null;
  return new ApiError(
    payload?.detail || `คำขอล้มเหลว (${response.status})`,
    response.status,
    requestId,
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const requestId = createRequestId();
  const headers = new Headers(init?.headers);
  headers.set('X-Request-ID', requestId);

  try {
    const response = await fetch(url, { ...init, headers });
    appLogger.info('api_request_completed', {
      method: init?.method || 'GET',
      url,
      status: response.status,
      requestId: response.headers.get('X-Request-ID') || requestId,
    });
    if (!response.ok) throw await parseError(response);
    return await response.json() as T;
  } catch (error) {
    appLogger.error('api_request_failed', { url, status: error instanceof ApiError ? error.status : undefined, requestId });
    if (error instanceof ApiError) throw error;
    const detail = error instanceof TypeError ? 'Backend ไม่ตอบสนองหรือถูกบล็อกโดยเบราว์เซอร์ (ตรวจ URL/CORS)' : 'ไม่สามารถเชื่อมต่อบริการตรวจภาษาได้';
    throw new ApiError(detail);
  }
}

export interface SubmitAnalysisParams {
  templateId: string;
  writingStyle: WritingStyle;
  inputMode: 'text' | 'file';
  userId?: string;
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
  error?: string;
  requestId?: string;
  engineVersion?: string;
  result?: AnalysisResponseData;
}

export interface ProfileStats {
  totalChecks: number;
  averageScore?: number;
  averageStructureScore?: number;
  totalIssues: number;
  engineVersion: string;
}

export interface CustomTemplateResponse {
  id: string;
  code: string;
  name: string;
  category: 'custom';
  description?: string;
  university?: string;
  isCustom: true;
  formattingRules: DocTemplate['formattingRules'];
  requiredSections: DocTemplate['requiredSections'];
}

/**
 * Fetch all standard templates from backend
 */
export async function fetchTemplates(): Promise<DocTemplate[]> {
  return fetchJson<DocTemplate[]>(`${API_BASE_URL}/templates`);
}

export async function fetchHistory(userId: string): Promise<HistoryItem[]> {
  return fetchJson<HistoryItem[]>(`${API_BASE_URL}/history?user_id=${encodeURIComponent(userId)}`);
}

export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  return fetchJson<ProfileStats>(`${API_BASE_URL}/profile/stats?user_id=${encodeURIComponent(userId)}`);
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await fetchJson<{ status: string }>(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload custom template file (.docx, .pdf)
 */
export async function uploadCustomTemplate(file: File): Promise<CustomTemplateResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return fetchJson(`${API_BASE_URL}/templates/upload`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Submit document analysis (Async Celery task)
 */
export async function submitAnalysis(params: SubmitAnalysisParams): Promise<JobStatusResponse> {
  const formData = new FormData();
  formData.append('template_id', params.templateId);
  formData.append('writing_style', params.writingStyle);
  formData.append('input_mode', params.inputMode);
  if (params.userId) formData.append('user_id', params.userId);

  if (params.inputMode === 'text' && params.text) {
    formData.append('text', params.text);
  } else if (params.inputMode === 'file' && params.file) {
    formData.append('file', params.file);
  }

  return fetchJson<JobStatusResponse>(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });
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
    const requestId = createRequestId();
    const res = await fetch(`${API_BASE_URL}/analyze/${jobId}`, {
      headers: { 'X-Request-ID': requestId },
    });
    appLogger.info('analysis_poll_completed', {
      jobId,
      status: res.status,
      requestId: res.headers.get('X-Request-ID') || requestId,
    });
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
