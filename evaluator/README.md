# Evaluator Service

## Purpose
Independent evaluation service to test the Audience Segmentation API behavior, edge cases, clustering quality, and generate `metrics.json`.

## Responsibilities
1. **Health Readiness Check:** Waits and retries until the API `GET /health` endpoint is available before starting tests.
2. **Valid API Tests:** Sends representative user profiles (with numeric values and genres, empty genres, zero watch times) to ensure the API correctly generates recommendations and preserves the user ID.
3. **Edge-Case Tests:** Sends malformed profiles (missing fields, negative values, wrong data types) to ensure the API robustly rejects them with correct HTTP errors (e.g., 422 Unprocessable Entity) without exposing stack traces.
4. **Metrics Generation:** Automatically generates a structured `metrics.json` report containing API test results, robustness checks, and clustering metrics.

## Current Limitation (No Fabricated Metrics)
The clustering metrics (`silhouette_score`, `inertia`) in `metrics.json` are strictly set to `null` and marked as `pending_dataset`. 
No fabricated ML ground-truth labels or fake cluster performances are generated. These fields will be populated only when the trainer service actually runs on a real dataset and passes real metrics.
