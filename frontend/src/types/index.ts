export interface UserRecord {
  user_id: string;
  row_index?: number;
  segment_id: number;
  segment_name: string;
  distance_to_centroid: number;
  watch_time_hours: number;
  avg_session_mins: number;
  sessions_per_week: number;
  completion_rate: number;
  weekend_usage_ratio: number;
  genre_diversity: number;
  top_genres: string[];
  recommendations: string[];
  match_explanation?: string;
}

export interface SegmentDistributionItem {
  segment_id: number;
  segment_name: string;
  description: string;
  count: number;
  percentage: number;
  avg_watch_time: number;
  avg_session_mins: number;
  avg_completion_rate: number;
  avg_sessions_per_week: number;
  recommended_genres: string[];
  recommendation_strategy?: string;
}

export interface BatchSummary {
  batch_id: string;
  filename: string;
  created_at: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  processed_rows: number;
  processing_duration_ms: number;
  status: string;
  segment_counts: Record<string, number>;
  segment_percentages: Record<string, number>;
}

export interface CSVValidationError {
  row_index: number;
  user_id: string;
  column: string;
  error: string;
}

export interface CSVValidationResponse {
  status: 'valid' | 'invalid';
  filename: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  errors: CSVValidationError[];
  preview_rows: any[];
}

export interface AnalyticsOverview {
  batch_id: string | null;
  filename: string;
  created_at: string;
  total_users_analyzed: number;
  num_segments: number;
  avg_completion_rate: number;
  avg_watch_time: number;
  avg_session_mins: number;
  model_status: 'ok' | 'unhealthy';
  segment_distribution: SegmentDistributionItem[];
  genre_distribution: Record<string, number>;
  recent_batches: BatchSummary[];
}

export interface SegmentMetadata {
  segment_id: number;
  segment_name: string;
  description: string;
  recommendation_strategy: string;
  recommended_genres: string[];
  cluster_size?: number;
  percentage_of_users?: number;
  centroid_stats?: {
    watch_time_hours: number;
    avg_session_mins: number;
    sessions_per_week: number;
    completion_rate: number;
    weekend_usage_ratio: number;
    genre_diversity: number;
  };
}

export interface SystemHealth {
  status: string;
  model_loaded: boolean;
  model_dir?: string;
  total_batches?: number;
}
