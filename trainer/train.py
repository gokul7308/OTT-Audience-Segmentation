import os
import json
import joblib
import pandas as pd
import numpy as np
from data_loader import find_dataset, load_data
from feature_engineering import FeatureEngineer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import warnings
warnings.filterwarnings('ignore')

RANDOM_SEED = 42
DATA_DIR = os.environ.get("DATA_DIR", "../data/raw")
MODEL_DIR = os.environ.get("MODEL_DIR", "../models")

def analyze_clusters(df, fe, kmeans, processed_data):
    """Analyze the clusters and generate metadata/metrics."""
    labels = kmeans.labels_
    df_analyzed = df.copy()
    df_analyzed['segment_id'] = labels
    
    cluster_sizes = df_analyzed['segment_id'].value_counts().to_dict()
    cluster_sizes = {int(k): int(v) for k, v in cluster_sizes.items()}
    
    # Calculate means of numerical features per cluster to determine characteristics
    segment_metadata = {}
    
    if fe.numerical_features:
        means = df_analyzed.groupby('segment_id')[fe.numerical_features].mean()
        overall_means = df_analyzed[fe.numerical_features].mean()
        
        for cluster_id in range(kmeans.n_clusters):
            c_means = means.loc[cluster_id]
            # Identify defining features (significantly higher or lower than average)
            high_features = [feat for feat in fe.numerical_features if c_means[feat] > overall_means[feat] * 1.2]
            low_features = [feat for feat in fe.numerical_features if c_means[feat] < overall_means[feat] * 0.8]
            
            # Generate a data-driven name based on highest distinguishing feature
            name = f"Segment {cluster_id}"
            if high_features:
                feat_name = high_features[0].replace('_', ' ').title()
                name = f"High {feat_name} Audience"
            elif low_features:
                feat_name = low_features[0].replace('_', ' ').title()
                name = f"Low {feat_name} Audience"
                
            segment_metadata[int(cluster_id)] = {
                "name": name,
                "size": cluster_sizes.get(cluster_id, 0),
                "defining_high_features": high_features,
                "defining_low_features": low_features,
                "default_recs": [f"Trending in {name}"] # Placeholder for API recommender
            }
    else:
        for cluster_id in range(kmeans.n_clusters):
            segment_metadata[int(cluster_id)] = {
                "name": f"Segment {cluster_id}",
                "size": cluster_sizes.get(cluster_id, 0),
                "default_recs": ["Trending Content"]
            }
            
    return cluster_sizes, segment_metadata

def main():
    print("Starting ML Training Pipeline...")
    
    # 1. Dataset Discovery
    try:
        dataset_path = find_dataset(DATA_DIR)
        df = load_data(dataset_path)
    except (FileNotFoundError, ValueError) as e:
        print(f"\nERROR: {e}")
        # Exit cleanly without creating fake metrics if dataset is absent
        return
        
    # 2. Feature Detection & Preprocessing
    fe = FeatureEngineer()
    try:
        fe.configure(df)
        processed_data = fe.fit_transform(df)
    except Exception as e:
        print(f"\nERROR during feature engineering: {e}")
        return
        
    # Safeguard: Empty feature matrix
    if processed_data.shape[1] == 0:
        print("\nERROR: Feature engineering resulted in an empty feature matrix. No usable data.")
        return

    # 3. K Selection and KMeans
    print(f"\nEvaluating KMeans models (seed: {RANDOM_SEED})...")
    
    n_samples = processed_data.shape[0]
    
    # Safeguard: fewer than 3 usable samples
    if n_samples < 3:
        print(f"ERROR: Only {n_samples} valid samples remaining. Need at least 3 for meaningful clustering.")
        return
        
    # Safeguard: K >= number of samples
    max_k = min(8, n_samples - 1)
    
    best_k = 2
    best_score = -1.0
    best_model = None
    best_inertia = None
    
    for k in range(2, max_k + 1):
        model = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init='auto')
        labels = model.fit_predict(processed_data)
        inertia = model.inertia_
        
        # Silhouette score requires >1 clusters and < n_samples
        if 1 < len(np.unique(labels)) < n_samples:
            score = silhouette_score(processed_data, labels)
        else:
            score = -1.0
            
        print(f" - K={k}: Silhouette={score:.4f}, Inertia={inertia:.2f}")
        
        if score > best_score:
            best_score = score
            best_k = k
            best_model = model
            best_inertia = inertia

    if best_model is None:
        print("ERROR: Failed to fit a valid clustering model.")
        return
        
    print(f"\nSelected K={best_k} (Silhouette Score: {best_score:.4f})")
    
    # 4. Cluster Analysis
    cluster_sizes, segment_metadata = analyze_clusters(df, fe, best_model, processed_data)
    
    # 5. Model Persistence
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    pipeline_path = os.path.join(MODEL_DIR, "clustering_pipeline.pkl")
    pipeline_artifact = {
        'feature_engineer': fe,
        'model': best_model
    }
    joblib.dump(pipeline_artifact, pipeline_path)
    print(f"\nModel pipeline saved to {pipeline_path}")
    
    metadata_path = os.path.join(MODEL_DIR, "segment_metadata.json")
    
    # Include reproducibility metadata at the root level of segment metadata
    segment_metadata_output = {
        "metadata": {
            "random_seed": RANDOM_SEED,
            "selected_k": best_k
        },
        "segments": segment_metadata
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(segment_metadata_output, f, indent=2)
    print(f"Segment metadata saved to {metadata_path}")
    
    # 6. Training Metrics
    metrics_path = os.path.join(MODEL_DIR, "training_metrics.json")
    metrics = {
        "random_seed": RANDOM_SEED,
        "selected_k": best_k,
        "silhouette_score": float(best_score),
        "inertia": float(best_inertia),
        "cluster_sizes": cluster_sizes,
        "features": {
            "numerical": fe.numerical_features,
            "categorical": fe.categorical_features
        },
        "status": "trained"
    }
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Training metrics saved to {metrics_path}")
    
    print("\nTraining complete.")

if __name__ == "__main__":
    main()
