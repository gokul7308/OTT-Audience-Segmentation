# OTT Audience Segmentation & Personalization Service

## Problem
Over-the-top (OTT) media services need to understand their users' viewing habits to provide accurate recommendations. This project implements a containerized, unsupervised Machine Learning pipeline to segment viewers based on behavioral data and provide transparent content recommendations via a REST API.

## Dataset Assumption
**Note**: The official problem statement referenced a "supplied" dataset which was not provided. As a working prototype, this system uses the public **MovieLens 1M** dataset (`users.dat`, `movies.dat`, `ratings.dat`) as a proxy for OTT viewing data. No features or metrics are fabricated; everything is derived computationally from these files.

## Solution Architecture
The system consists of three Dockerized microservices connected via Docker Compose:
1. **Trainer**: An offline Python script that reads the raw dataset, builds a 27-feature behavioral matrix, determines the optimal K for a KMeans clustering model (using Silhouette/Inertia), profiles the segments, and persists the artifacts to a shared volume.
2. **API**: A FastAPI web server that loads the trained model artifacts and serves live, deterministic, rule-based recommendations via a `/recommend` endpoint.
3. **Evaluator**: An independent Python script that waits for the API to boot, tests it against valid and invalid payloads, extracts the ML clustering metrics, and generates a final `metrics.json` report.

## Setup & Execution

### Prerequisites
- Docker & Docker Compose
- Ensure `data/raw/` contains the MovieLens 1M files (`ratings.dat`, `movies.dat`, `users.dat`).

### Running the Pipeline
Run the entire end-to-end pipeline with a single command:
```bash
docker compose up --build
```
This will:
1. Boot the `trainer`, process the data, train the model, and exit.
2. Boot the `api` serving on `http://localhost:8000`.
3. Boot the `evaluator`, run the automated tests against the API, generate `metrics.json` on your host machine, and exit.

## API Documentation

### `POST /recommend`
Evaluates a user's behavioral matrix and assigns them a segment and recommendations.

**Example Request:**
```json
{
  "user_id": "USR-1001",
  "interaction_count": 50.0,
  "average_rating": 4.5,
  "rating_std": 0.5,
  "activity_span_days": 300.0,
  "recency_days": 2.0,
  "active_days": 100.0,
  "interactions_per_active_day": 5.0,
  "weekend_interaction_ratio": 0.3,
  "unique_genre_count": 5,
  "genre_prop_action": 0.5,
  "genre_prop_comedy": 0.5,
  "genre_prop_adventure": 0.0,
  "genre_prop_animation": 0.0,
  "genre_prop_childrens": 0.0,
  "genre_prop_crime": 0.0,
  "genre_prop_documentary": 0.0,
  "genre_prop_drama": 0.0,
  "genre_prop_fantasy": 0.0,
  "genre_prop_film_noir": 0.0,
  "genre_prop_horror": 0.0,
  "genre_prop_musical": 0.0,
  "genre_prop_mystery": 0.0,
  "genre_prop_romance": 0.0,
  "genre_prop_sci_fi": 0.0,
  "genre_prop_thriller": 0.0,
  "genre_prop_war": 0.0,
  "genre_prop_western": 0.0
}
```

**Example Response:**
```json
{
  "user_id": "USR-1001",
  "segment_id": 1,
  "segment_name": "Segment 1 - Action/Comedy Fans",
  "recommendations": [
    "Popular in Action",
    "Popular in Comedy",
    "Trending Content"
  ],
  "distance_to_centroid": 1.452
}
```

## Evaluation
The success of the model and API is validated by `evaluator/evaluate.py`, which produces `metrics.json` detailing API health, schema robustness, and unsupervised ML metrics (Silhouette score & Inertia).

For deep technical details on ML methodologies, refer to `REPORT.md`.
