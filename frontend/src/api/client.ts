import {
  AnalyticsOverview,
  BatchSummary,
  CSVValidationResponse,
  SegmentMetadata,
  SystemHealth,
  UserRecord,
} from '../types';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errorDetail = `Request failed with status ${res.status}`;
        try {
          const errorJson = await res.json();
          if (errorJson && errorJson.detail) {
            errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
          }
        } catch (_) {
          // ignore parsing error
        }
        throw new Error(errorDetail);
      }
      return await res.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(`Unable to connect to Streamly API at ${this.baseUrl}. Check if the backend service is running.`);
      }
      throw err;
    }
  }

  async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/health');
  }

  async getAnalyticsOverview(batchId?: string): Promise<AnalyticsOverview> {
    const q = batchId ? `?batch_id=${encodeURIComponent(batchId)}` : '';
    return this.request<AnalyticsOverview>(`/analytics/overview${q}`);
  }

  async getSegments(): Promise<{ segments: SegmentMetadata[] }> {
    return this.request<{ segments: SegmentMetadata[] }>('/segments');
  }

  async getEvaluationMetrics(): Promise<any> {
    return this.request<any>('/evaluation/metrics');
  }

  async listBatches(): Promise<{ batches: BatchSummary[]; count: number }> {
    return this.request<{ batches: BatchSummary[]; count: number }>('/segment/batches');
  }

  async initReferenceBatch(): Promise<{ status: string; summary: BatchSummary }> {
    return this.request<{ status: string; summary: BatchSummary }>('/segment/init-reference-batch', {
      method: 'POST',
    });
  }

  async validateCSV(file: File, duplicatePolicy: string = 'keep_first'): Promise<CSVValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicate_policy', duplicatePolicy);

    return this.request<CSVValidationResponse>('/segment/validate', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadAndProcessBatch(
    file: File,
    duplicatePolicy: string = 'keep_first'
  ): Promise<{ summary: BatchSummary; preview_users: UserRecord[]; validation_errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicate_policy', duplicatePolicy);

    return this.request<{ summary: BatchSummary; preview_users: UserRecord[]; validation_errors: any[] }>(
      '/segment/batch',
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async getBatchDetails(
    batchId: string,
    params: {
      segment_id?: number | null;
      genre?: string | null;
      search?: string | null;
      sort_by?: string;
      sort_desc?: boolean;
      page?: number;
      page_size?: number;
    } = {}
  ): Promise<{
    summary: BatchSummary;
    total_matched: number;
    page: number;
    page_size: number;
    total_pages: number;
    users: UserRecord[];
  }> {
    const query = new URLSearchParams();
    if (params.segment_id !== undefined && params.segment_id !== null) {
      query.append('segment_id', String(params.segment_id));
    }
    if (params.genre) query.append('genre', params.genre);
    if (params.search) query.append('search', params.search);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_desc !== undefined) query.append('sort_desc', String(params.sort_desc));
    if (params.page) query.append('page', String(params.page));
    if (params.page_size) query.append('page_size', String(params.page_size));

    return this.request(`/segment/batch/${encodeURIComponent(batchId)}?${query.toString()}`);
  }

  getExportUrl(batchId: string, segmentId?: number): string {
    const query = segmentId !== undefined ? `?segment_id=${segmentId}` : '';
    return `${this.baseUrl}/segment/batch/${encodeURIComponent(batchId)}/export${query}`;
  }

  getErrorsExportUrl(batchId: string): string {
    return `${this.baseUrl}/segment/batch/${encodeURIComponent(batchId)}/errors/export`;
  }

  getSampleCSVUrl(): string {
    return `${this.baseUrl}/segment/sample-csv`;
  }

  async getSingleRecommendation(payload: {
    user_id: string;
    watch_time_hours: number;
    avg_session_mins: number;
    top_genres: string[];
    sessions_per_week?: number;
    completion_rate?: number;
    weekend_usage_ratio?: number;
    genre_diversity?: number;
  }): Promise<{
    user_id: string;
    segment_id: number;
    segment_name: string;
    recommendations: string[];
    distance_to_centroid: number;
  }> {
    return this.request('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
