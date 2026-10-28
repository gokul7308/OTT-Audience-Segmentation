# Streamly — Enterprise OTT Audience Intelligence Platform

A containerized machine learning and audience intelligence platform that transforms raw OTT user activity telemetry into normalized behavioral clusters, discovers 5 viewer segments using unsupervised $K$-Means clustering, and provides bulk CSV processing, segmented viewer explorers, spreadsheet-safe exports, and personalized content recommendations.

---

## 🏗 Architecture Overview

```
                                [ User Activity CSV / Telemetry ]
                                                │
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │             STREAMLY FRONTEND APP             │
                        │  • React 18, TypeScript, Tailwind CSS, Vite   │
                        │  • Enterprise B2B SaaS design system          │
                        │  • Audience Overview & Interactive Recharts   │
                        │  • 5 Segment Viewer Explorer with Tabs        │
                        │  • CSV Import, Pre-flight validation preview  │
                        │  • Full CSV Exports (All + Individual Segs)   │
                        └───────────────────────┬───────────────────────┘
                                                │  (HTTP / Port 3000 / 5173)
                                                ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│            TRAINER SERVICE            │   │              API SERVICE              │
│  • Deduplication & median imputation  │   │  • FastAPI + Uvicorn + Pydantic       │
│  • 15-Feature Engineering (6 num + 9) │   │  • Vectorized batch inference (K=5)   │
│  • StandardScaler normalization       │   │  • Isolated batch storage (CSV/JSON)  │
│  • KMeans clustering (K=5 selected)   ├──►│  • Spreadsheet-safe formula defense   │
│  • Serializes pipeline to /models     │   │  • Transparent recommendation engine  │
└───────────────────────────────────────┘   └───────────────────┬───────────────────┘
                    ▲                                           │
                    │ (models_volume)                           │  (service_healthy)
                    └───────────────────────────────────────────┤
                                                                ▼
                                            ┌───────────────────────────────────────┐
                                            │           EVALUATOR SERVICE           │
                                            │  • Polls /health until ready          │
                                            │  • Tests 5 behavioral archetypes      │
                                            │  • Tests 10 hostile & edge-case inputs│
                                            │  • Verifies zero-drift determinism    │
                                            │  • Outputs authoritative metrics.json │
                                            └───────────────────────────────────────┘
```

---

## 🛠 Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend API:** FastAPI, Uvicorn, Pydantic, Python 3.11/3.12, python-multipart
- **Machine Learning:** Scikit-Learn 1.6.1 (`StandardScaler`, `KMeans`), NumPy, Pandas, Joblib
- **Testing & Verification:** Pytest (29 unit & integration tests), HTTPX
- **Infrastructure:** Docker, Docker Compose, Nginx reverse proxy

---

## 📁 Project Structure

```
Hackathon 3hours/
│
├── docker-compose.yml          # Orchestrates trainer, api, and evaluator services
├── README.md                   # Quickstart guide, API documentation, and instructions
├── REPORT.md                   # Detailed technical evaluation report
├── metrics.json                # Authoritative evaluation results generated automatically
├── kmeans_experiments.csv      # K=2 through K=8 inertia and silhouette score log
├── .dockerignore               # Docker build exclusions
├── .gitignore                  # Git tracking exclusions
│
├── data/
│   └── dataset.csv             # OTT user activity telemetry dataset
│
├── trainer/
│   ├── Dockerfile              # Trainer container build definition
│   ├── requirements.txt        # Pinned trainer dependencies
│   ├── train.py                # Model training, K-selection, and artifact serializer
│   └── preprocessing.py        # Scikit-learn custom preprocessor transformer
│
├── api/
│   ├── Dockerfile              # FastAPI container build definition
│   ├── requirements.txt        # Pinned API dependencies
│   ├── main.py                 # FastAPI endpoints (/health, /recommend), validation
│   ├── preprocessing.py        # Preprocessing transformer for inference
│   └── recommendations.py      # Transparent rule-based recommendation engine
│
├── evaluator/
│   ├── Dockerfile              # Evaluator container build definition
│   ├── requirements.txt        # Pinned evaluator dependencies
│   └── evaluate.py             # Healthcheck poller, test suite, and metrics.json generator
│
├── models/                     # Shared model volume mount directory
│   ├── preprocessor.joblib     # Persisted fitted preprocessor
│   ├── kmeans_model.joblib     # Persisted fitted KMeans model (K=5)
│   ├── segment_metadata.json   # Discovered cluster profiles and strategies
│   ├── cluster_profiles.csv    # Cluster summaries table
│   └── training_results.json   # Training experiments and metrics log
│
├── samples/
│   ├── request.json            # Sample API request payload
│   └── response.json           # Sample API response payload
│
├── frontend/                   # Enterprise React + Vite + Tailwind B2B SaaS web app
│   ├── src/
│   │   ├── api/client.ts       # Centralized typed API client
│   │   ├── components/         # Reusable design system (cards, charts, tables, dropzone, drawers)
│   │   └── pages/              # 8 dedicated intelligence views
│   ├── nginx.conf              # SPA routing & API reverse proxy
│   └── Dockerfile              # Multi-stage production container build
│
├── models/                     # Shared model volume mount directory
│   ├── preprocessor.joblib     # Persisted fitted preprocessor
│   ├── kmeans_model.joblib     # Persisted fitted KMeans model (K=5)
│   ├── segment_metadata.json   # Discovered cluster profiles and strategies
│   ├── cluster_profiles.csv    # Cluster summaries table
│   └── training_results.json   # Training experiments and metrics log
│
├── samples/
│   ├── request.json            # Sample API request payload
│   └── response.json           # Sample API response payload
│
└── tests/
    ├── test_api.py             # Single-user API & contract test suite
    └── test_batch_processing.py# Batch CSV, validation, exports & determinism test suite
```

---

## 🚀 Quickstart & Startup Instructions

### Option A: Run with Docker Compose (Recommended for Production)

Run the entire platform (trainer + API + evaluator + enterprise web frontend):

```bash
docker compose down -v && docker compose up --build
```

- **Frontend Application:** Access the Streamly SaaS UI at `http://localhost:3000`
- **FastAPI Backend:** Access direct REST API & Swagger docs at `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

### Option B: Run Locally (Fast Development Workflow)

1. **Backend:**
```bash
# Set up Python virtual environment
uv venv && uv pip install -r api/requirements.txt pytest httpx python-multipart

# Start the FastAPI inference service
.venv/bin/uvicorn main:app --app-dir api --host 127.0.0.1 --port 8000
```

2. **Frontend:**
```bash
cd frontend
npm install
npm run dev
# Access the web app at http://localhost:5173
```

3. **Run Automated Test Suite:**
```bash
# Run all 29 backend integration tests
.venv/bin/pytest tests/

# Run independent evaluator
API_URL=http://127.0.0.1:8000 .venv/bin/python evaluator/evaluate.py
```

---

## 📡 API Usage & Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service and model loaded status |
| `POST` | `/segment/validate` | Pre-flight CSV schema, numeric, and duplicate validation |
| `POST` | `/segment/batch` | Vectorized K-Means inference on CSV, recommendations, and persistence |
| `GET` | `/segment/batch/{id}` | Query batch viewers with segment, genre, search, sort, and pagination |
| `GET` | `/segment/batch/{id}/export` | Download processed results (complete or filtered by `?segment_id=0..4`) |
| `GET` | `/segment/batch/{id}/errors/export` | Download rejected CSV rows with row-level validation reasons |
| `GET` | `/segment/batches` | List all historical processed batches |
| `GET` | `/segment/sample-csv` | Download sample CSV template matching schema |
| `POST` | `/segment/init-reference-batch`| Initialize `data/dataset.csv` as a baseline reference batch |
| `GET` | `/analytics/overview` | Compute KPIs, audience share, viewing comparisons, and genre affinities |
| `GET` | `/segments` | Retrieve the 5 audience personas and centroid metrics |
| `GET` | `/evaluation/metrics` | Authoritative ML benchmarks, silhouette score, and test suite results |
| `POST` | `/recommend` | Individual profile scoring and personalized catalog titles |

---

### 2. Personalized Recommendation (`POST /recommend`)
Ingests user metrics and returns the assigned audience segment, distance to centroid, and tailored content titles.

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USR-8192",
    "watch_time_hours": 32.5,
    "avg_session_mins": 85.0,
    "top_genres": ["Action", "Thriller"]
  }'
```

**Response (`200 OK`):**
```json
{
  "user_id": "USR-8192",
  "segment_id": 3,
  "segment_name": "Focused Drama & Story Viewers",
  "recommendations": [
    "Midnight Intrigue",
    "Silent Witness",
    "The Blind Spot",
    "Frenzy Point"
  ],
  "distance_to_centroid": 1.7198
}
```

---

## 🧪 Discovered Audience Segments ($K=5$)

| ID | Segment Name | Share (%) | Key Characteristics | Strategy |
| :---: | :--- | :---: | :--- | :--- |
| **0** | **Heavy Action & Sci-Fi Power Viewers** | 21.5% | High watch time (44.9h), 94.5m sessions, Action/Sci-Fi/Thriller | Prioritize blockbuster releases & high-octane franchises |
| **1** | **Casual Low-Activity Weekend Viewers** | 20.6% | Low watch time (5.7h), 71.9% weekend usage, Comedy/Drama | Surface trending comedies & quick highlights |
| **2** | **High-Diversity Genre Explorers** | 19.9% | Broad taste (6.4 genres), 30.1h watch time, Thriller/Romance/Sci-Fi/Doc | Recommend cross-genre discovery bundles |
| **3** | **Focused Drama & Story Viewers** | 15.4% | High completion (80.7%), long sessions (75.1m), Drama/Romance | Prioritize character-driven narratives & serialized dramas |
| **4** | **Short-Session Animation & Family Viewers** | 22.6% | Bite-sized sessions (27.3m), Animation/Family/Comedy | Recommend animated features & kid-friendly episodic content |

---

## 📊 Evaluation & `metrics.json`

The automated evaluator runs independent verification against the live containerized API and produces `metrics.json`.

**Summary of Measured Results:**
- **Clustering:** $K=5$, Silhouette Score = `0.3240`, Inertia = `2261.83`, Features = `15`, Samples = `1000`.
- **Cluster Balance Ratio:** `0.6814` (Min cluster = 154, Max cluster = 226).
- **API Correctness:** `5 / 5` representative profile archetypes passed.
- **Edge-Case Validation:** `10 / 10` boundary cases passed (including empty genres, unseen genres, negative values, type mismatches, and malformed JSON).
- **Inference Stability:** Zero drift across repeated requests.
- **Overall Status:** **`PASS`**.

---

## 🛑 Stopping the Services

To stop containers and clean up the shared network and volumes:

```bash
docker compose down -v
```

---

## ⚠️ Limitations

1. **Synthetic Telemetry:** Telemetry data represents a synthetic benchmark rather than live user logs.
2. **KMeans Geometry:** Assumes spherical cluster variances; complex non-linear structures could benefit from GMM or Density-Based Clustering in future iterations.
3. **Rule-Based Title Catalog:** Recommendations are mapped from segment-level genre priorities rather than a collaborative filtering matrix.
