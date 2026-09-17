# Trainer Service

## Purpose
ML training service. It handles data loading, preprocessing, feature engineering, K-Means clustering, and model persistence.

## Workflow
1. **Dataset Discovery:** Automatically finds the CSV dataset in `/data/raw`. Handles empty datasets and data quality issues.
2. **Feature Detection:** Dynamically inspects the dataset schema. Numeric columns are treated as behavioral features and string columns as genres. ID/Target columns are excluded based on simple heuristics.
3. **Preprocessing:** Uses `ColumnTransformer` with `StandardScaler` for numeric features and `OneHotEncoder` for categoricals. Handles missing data safely.
4. **K-Means Clustering:** Evaluates multiple K values (from 2 up to 8) and selects the best one using the **Silhouette Score**.
5. **Cluster Analysis:** Extracts defining features of each cluster (e.g., highly above-average watch time) and auto-generates segment names (e.g., "High Watch Time Audience").
6. **Persistence:** Saves the entire inference pipeline (preprocessor + model) to `/models/clustering_pipeline.pkl`. Saves `segment_metadata.json` and `training_metrics.json`.

## Safety Constraints
The application will safely abort and log an error if no dataset is found. It NEVER fabricates data, trains fake models, or generates fake metrics.
