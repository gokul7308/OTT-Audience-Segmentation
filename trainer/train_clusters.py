import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.pipeline import Pipeline

RANDOM_SEED = 42

def assign_name_and_recs(cluster_mean, overall_mean):
    """
    Generates a deterministic, data-driven segment name and recommendation strategy
    based on how a cluster's features compare to the global average.
    """
    name_parts = []
    recs = []
    
    # 1. Activity Level
    if cluster_mean['interaction_count'] > overall_mean['interaction_count'] * 1.5:
        name_parts.append("High-Activity")
        recs.append("Promote broad discovery and back-catalog titles.")
    elif cluster_mean['interaction_count'] < overall_mean['interaction_count'] * 0.5:
        name_parts.append("Casual")
        recs.append("Highlight highly popular, easy-to-digest blockbusters.")
    else:
        name_parts.append("Regular")
        
    # 2. Genre Diversity
    if cluster_mean['unique_genre_count'] > overall_mean['unique_genre_count'] * 1.2:
        name_parts.append("Explorers")
        recs.append("Surface diverse, cross-genre recommendations.")
    elif cluster_mean['unique_genre_count'] < overall_mean['unique_genre_count'] * 0.8:
        name_parts.append("Focused Viewers")
        recs.append("Stick strictly to preferred genres.")
    else:
        name_parts.append("Viewers")
        recs.append("Mix preferred genres with mainstream hits.")
        
    # 3. Identify Top Genres for the cluster
    genre_cols = [c for c in cluster_mean.index if c.startswith('genre_prop_')]
    top_genres = cluster_mean[genre_cols].sort_values(ascending=False).head(2)
    top_genre_names = [g.replace('genre_prop_', '').title() for g in top_genres.index]
    
    # Compose final name
    name = f"{name_parts[0]} {name_parts[1]} ({', '.join(top_genre_names)})"
    
    # Add genre specific rec
    recs.insert(0, f"Prioritize titles in {top_genre_names[0]} and {top_genre_names[1]}.")
    
    return name, top_genre_names, recs

def train():
    print("Loading features...")
    df = pd.read_csv('data/processed/user_features.csv')
    
    user_ids = df['UserID'].values
    X = df.drop(columns=['UserID'])
    
    overall_mean = X.mean()
    
    n_samples = len(X)
    max_k = min(8, n_samples - 1)
    
    print("Evaluating K values...")
    best_k = 2
    best_silhouette = -1.0
    best_inertia = float('inf')
    
    metrics = {
        "tested_k": [],
        "silhouette_scores": {},
        "inertias": {}
    }
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    for k in range(2, max_k + 1):
        kmeans = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10)
        labels = kmeans.fit_predict(X_scaled)
        
        sil_score = silhouette_score(X_scaled, labels)
        inertia = kmeans.inertia_
        
        metrics["tested_k"].append(k)
        metrics["silhouette_scores"][k] = float(sil_score)
        metrics["inertias"][k] = float(inertia)
        
        print(f"K={k}: Silhouette={sil_score:.4f}, Inertia={inertia:.2f}")
        
        if sil_score > best_silhouette:
            best_silhouette = sil_score
            best_k = k
            best_inertia = inertia
            
    print(f"\nSelected best K: {best_k} (Silhouette: {best_silhouette:.4f})")
    
    print("Training final model...")
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('kmeans', KMeans(n_clusters=best_k, random_state=RANDOM_SEED, n_init=10))
    ])
    
    pipeline.fit(X)
    
    labels = pipeline.predict(X)
    df['Cluster'] = labels
    
    # Verify exactly one cluster per user
    assert df['Cluster'].isnull().sum() == 0
    assert len(df['Cluster']) == len(user_ids)
    
    print("Analyzing clusters...")
    segment_metadata = {
        "metadata": {
            "random_seed": RANDOM_SEED,
            "selected_k": best_k
        },
        "segments": {}
    }
    
    cluster_sizes = {}
    
    for cluster_id in range(best_k):
        cluster_data = df[df['Cluster'] == cluster_id]
        size = len(cluster_data)
        percentage = (size / n_samples) * 100
        cluster_sizes[cluster_id] = size
        
        # Calculate cluster means
        cluster_mean = cluster_data.drop(columns=['UserID', 'Cluster']).mean()
        
        # Determine human-readable name and strategy
        name, top_genres, recs = assign_name_and_recs(cluster_mean, overall_mean)
        
        segment_metadata["segments"][str(cluster_id)] = {
            "segment_id": cluster_id,
            "segment_name": name,
            "cluster_size": size,
            "percentage_of_users": round(percentage, 2),
            "dominant_genres": top_genres,
            "recommendation_strategy": recs,
            "key_characteristics": {
                "avg_interaction_count": round(cluster_mean['interaction_count'], 2),
                "avg_unique_genres": round(cluster_mean['unique_genre_count'], 2),
                "avg_activity_span_days": round(cluster_mean['activity_span_days'], 2),
                "avg_rating": round(cluster_mean['average_rating'], 2)
            }
        }
        print(f"Cluster {cluster_id}: {name} ({percentage:.1f}%)")
    
    model_dir = os.environ.get('MODEL_DIR', 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    print("Persisting pipeline and metadata...")
    joblib.dump(pipeline, os.path.join(model_dir, 'clustering_pipeline.pkl'))
    
    with open(os.path.join(model_dir, 'segment_metadata.json'), 'w') as f:
        json.dump(segment_metadata, f, indent=2)
        
    metrics.update({
        "random_seed": RANDOM_SEED,
        "selected_k": best_k,
        "final_silhouette": best_silhouette,
        "final_inertia": best_inertia,
        "cluster_sizes": cluster_sizes
    })
    
    with open(os.path.join(model_dir, 'clustering_metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)
        
    print("Step 3 & 4 Completed Successfully.")

if __name__ == "__main__":
    train()
