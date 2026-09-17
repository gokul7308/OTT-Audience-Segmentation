# Backend API Service

## Purpose
REST API service to serve Audience Segmentation models and personalized recommendations.

## Endpoints

### GET `/health`
Checks API readiness and whether the trained clustering model is loaded into memory.
```json
{
  "status": "ok",
  "model_loaded": false
}
```

### POST `/recommend`
Accepts a user profile, determines their audience segment using the trained model, and generates rule-based recommendations.

**Request Example:**
```json
{
  "user_id": "USR-8192",
  "watch_time_hours": 32.5,
  "top_genres": ["Action", "Thriller"],
  "avg_session_mins": 85.0
}
```

**Response Example:**
```json
{
  "user_id": "USR-8192",
  "segment_id": 1,
  "segment_name": "Segment B (Unknown)",
  "recommendations": ["Popular in Action", "Trending Movie 2", "Trending Show 2"],
  "distance_to_centroid": 1.25
}
```

## Model Loading Behavior
The API loads the ML pipeline ONCE at startup from the shared `/models` directory (configurable via `MODEL_DIR` env var). 
It NEVER retrains during inference. If the model is unavailable, the API starts safely but `/recommend` will return a `503 Service Unavailable` error until the model is ready.

## Current Limitation
The actual trained model is currently unavailable until the dataset is supplied and the trainer service runs. 
