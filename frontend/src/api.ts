import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RecommendRequest {
  user_id: string;
  interaction_count: number;
  average_rating: number;
  rating_std: number;
  activity_span_days: number;
  recency_days: number;
  active_days: number;
  interactions_per_active_day: number;
  weekend_interaction_ratio: number;
  unique_genre_count: number;
  genre_prop_action: number;
  genre_prop_adventure: number;
  genre_prop_animation: number;
  genre_prop_childrens: number;
  genre_prop_comedy: number;
  genre_prop_crime: number;
  genre_prop_documentary: number;
  genre_prop_drama: number;
  genre_prop_fantasy: number;
  genre_prop_film_noir: number;
  genre_prop_horror: number;
  genre_prop_musical: number;
  genre_prop_mystery: number;
  genre_prop_romance: number;
  genre_prop_sci_fi: number;
  genre_prop_thriller: number;
  genre_prop_war: number;
  genre_prop_western: number;
}

export interface RecommendResponse {
  user_id: string;
  segment_id: number;
  segment_name: string;
  recommendations: string[];
  distance_to_centroid: number;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await axios.get(`${API_URL}/health`);
  return response.data;
};

export const getRecommendations = async (data: RecommendRequest): Promise<RecommendResponse> => {
  const response = await axios.post(`${API_URL}/recommend`, data);
  return response.data;
};
