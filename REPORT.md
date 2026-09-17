# OTT Audience Segmentation & Personalization Service - Final Report

## 1. Problem Understanding
The hackathon problem statement requires an end-to-end Machine Learning pipeline to segment OTT (Over-The-Top) media viewers based on behavioral data, enabling targeted and transparent content recommendations. The solution requires a containerized architecture containing a training pipeline, an inference API, and an independent evaluator script.

## 2. Dataset Source & Assumption
**IMPORTANT NOTICE**: The official problem statement referenced a "supplied tabular user activity dataset", but no such dataset was provided. To fulfill the requirements and build a functional prototype, we assumed the use of the public **MovieLens 1M** dataset as a proxy for OTT viewing behavior. 

## 3. Dataset Description
The MovieLens 1M dataset contains:
- `users.dat`: Demographic information for 6,040 users.
- `movies.dat`: Metadata (titles, genres) for 3,900 movies.
- `ratings.dat`: 1,000,209 interactions (1-5 ratings and timestamps).

## 4. Feature Engineering
Since the challenge strictly forbids fabricating features like "watch_time_hours" without data, we engineered 27 purely derived behavioral features per user:
- **Engagement**: `interaction_count`, `average_rating`, `rating_std`.
- **Temporal**: `activity_span_days`, `recency_days`, `active_days`, `interactions_per_active_day`, `weekend_interaction_ratio`.
- **Content Preferences**: `unique_genre_count` and 18 individual proportional genre features (`genre_prop_action`, `genre_prop_comedy`, etc.) calculated by exploding the genre strings.

## 5. Preprocessing
We utilized `StandardScaler` from `scikit-learn` to standardize all 27 features to zero mean and unit variance. This ensures that large-magnitude features (like `interaction_count`) do not dominate the clustering algorithm.

## 6. KMeans Model
We applied an unsupervised `KMeans` clustering algorithm. KMeans was chosen because it is deterministic, computationally lightweight (CPU-friendly), and produces clear centroids that can be mapped to human-readable rules.

## 7. Hyperparameters
- `init='k-means++'`
- `n_init=10`
- `max_iter=300`
- `random_state=42` (Fixed for reproducibility)

## 8. K Selection
K selection was evaluated dynamically from K=2 to K=8. The selection algorithm prioritizes the highest **Silhouette Score**, with Inertia used as a secondary elbow-curve heuristic. 

## 9. Actual Results
Based on the dynamic evaluation, **K=3** was selected.
- **Silhouette Score**: 0.1192
- **Inertia**: 136,133.98
- **Cluster Sizes**: 
  - Segment 0: 656 users
  - Segment 1: 2422 users
  - Segment 2: 2962 users

## 10 & 11. Cluster Profiles & Segment Naming
The trainer dynamically analyzes the mean feature values of each cluster to assign human-readable names:
- **Segment 0 ("High-Activity Enthusiasts")**: Highest interaction counts, longest activity spans.
- **Segment 1 ("Casual/Recent Viewers")**: Lower interaction counts, highly recent interactions.
- **Segment 2 ("Weekend/Niche Viewers")**: Moderate interaction, heavy weekend ratios, specific genre biases.

## 12. Recommendation Logic
The recommendation logic is strictly **rule-based and transparent**. 
1. The API infers the user's segment via the trained ML model.
2. It looks up the dynamic JSON `segment_metadata.json` for base rules ("recommendation_strategy").
3. It applies runtime heuristics by identifying the user's top genres from their input matrix and prepending them to the response.

## 13. API Design
The API is built with **FastAPI**.
- `GET /health`: Indicates if the model is loaded safely.
- `POST /recommend`: Accepts the 27-feature matrix via a strict Pydantic schema, transforms it via the loaded Pipeline, and returns the segment ID, name, distance to centroid, and recommendations. If the model is absent, it degrades gracefully to a `503 Service Unavailable`.

## 14. Docker Architecture
The system uses Docker Compose with three services mapped via a shared volume (`models`):
- **trainer**: Reads `/data`, trains, saves artifacts to `/models`, and exits.
- **api**: Mounts `/models` as read-only. Exposes port 8000.
- **evaluator**: Mounts `/models`, waits for the API to report healthy, runs tests against the API, and outputs `metrics.json` via a bind mount to the host.

## 15. Evaluator Methodology
The evaluator uses a resilient retry-loop to wait for the API's `/health` endpoint. Once ready, it runs:
- **Valid Requests**: Fully populated matrices to test end-to-end scaling, inference, and centroid distance calculation.
- **Invalid Requests**: Tests Pydantic boundaries (negative counts, wrong types, missing fields).
It then reads the offline `models/clustering_metrics.json` and safely merges it with the API test results into `metrics.json`.

## 16. Actual Evaluation Results
- **Valid API Tests**: 2/2 passed.
- **Robustness Tests**: 4/4 passed (all correctly rejected as 422).
- **Overall Status**: Passed.

## 17. Edge Cases Handled
- **Missing Dataset**: The trainer exits gracefully if `data/raw/` is missing.
- **Missing Model**: The API falls back to degraded mode (503) without crashing.
- **Malformed Inputs**: Pydantic strictly blocks invalid numerical schemas.
- **Zero Standard Deviation**: NaN std-devs from single-rating users are filled safely with 0.0.

## 18. Limitations
- **Cold Start**: As implemented, the API requires a pre-aggregated feature matrix. In a real environment, an upstream streaming engine or Feature Store would compute these 27 features in real-time.
- **Data Proxy**: MovieLens is a proxy. True OTT data would have actual session lengths and watch times.

## 19. Reproducibility
- Base image: `python:3.11-slim`
- All dependencies pinned in `requirements.txt`.
- Random seed (42) enforced across `KMeans` training.
- Non-root user `appuser` enforced in Dockerfiles.

## 20. What was tried/changed
- Shifted from fake watch-time assumptions to a strict, derivations-only feature matrix (27 features).
- Refactored `docker-compose.yml` to rely entirely on shared named volumes instead of local directory binds for the `models` artifacts, preventing cross-platform host permission issues.
- Shifted away from `cat/sed` bash scripts to robust Python JSON merging in the Evaluator.
