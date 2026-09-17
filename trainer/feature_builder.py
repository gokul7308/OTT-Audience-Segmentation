import os
import json
import pandas as pd
import numpy as np

def build_features():
    print("Loading datasets...")
    users_cols = ['UserID', 'Gender', 'Age', 'Occupation', 'Zip-code']
    users = pd.read_csv('data/raw/users.dat', sep='::', engine='python', names=users_cols, encoding='latin-1')
    
    movies_cols = ['MovieID', 'Title', 'Genres']
    movies = pd.read_csv('data/raw/movies.dat', sep='::', engine='python', names=movies_cols, encoding='latin-1')
    
    ratings_cols = ['UserID', 'MovieID', 'Rating', 'Timestamp']
    ratings = pd.read_csv('data/raw/ratings.dat', sep='::', engine='python', names=ratings_cols, encoding='latin-1')

    # Data Quality Handling
    ratings = ratings.drop_duplicates()
    ratings = ratings.dropna(subset=['UserID', 'MovieID', 'Rating', 'Timestamp'])
    
    print("Joining datasets...")
    df = ratings.merge(movies[['MovieID', 'Genres']], on='MovieID', how='left')
    
    # Process Genres
    # Split genres into lists
    df['GenreList'] = df['Genres'].str.split('|')
    # Explode to get one row per genre per interaction (temporarily)
    # Actually, to get proportions per user efficiently:
    
    print("Computing engagement features...")
    # Basic numeric aggregation
    user_agg = df.groupby('UserID').agg(
        interaction_count=('Rating', 'count'),
        average_rating=('Rating', 'mean'),
        rating_std=('Rating', 'std'),
        min_timestamp=('Timestamp', 'min'),
        max_timestamp=('Timestamp', 'max')
    )
    # Fill NaN std dev (users with 1 rating)
    user_agg['rating_std'] = user_agg['rating_std'].fillna(0.0)

    print("Computing temporal features...")
    # Convert timestamps
    df['Datetime'] = pd.to_datetime(df['Timestamp'], unit='s')
    df['Date'] = df['Datetime'].dt.date
    df['DayOfWeek'] = df['Datetime'].dt.dayofweek
    df['IsWeekend'] = df['DayOfWeek'].isin([5, 6]).astype(int)

    temporal_agg = df.groupby('UserID').agg(
        active_days=('Date', 'nunique'),
        weekend_interactions=('IsWeekend', 'sum')
    )
    
    global_max_ts = df['Timestamp'].max()
    user_agg['activity_span_days'] = ((user_agg['max_timestamp'] - user_agg['min_timestamp']) / 86400).round(2)
    user_agg['recency_days'] = ((global_max_ts - user_agg['max_timestamp']) / 86400).round(2)
    user_agg = user_agg.drop(columns=['min_timestamp', 'max_timestamp'])

    # Merge
    features = user_agg.join(temporal_agg)
    features['interactions_per_active_day'] = (features['interaction_count'] / features['active_days']).round(2)
    features['weekend_interaction_ratio'] = (features['weekend_interactions'] / features['interaction_count']).round(4)
    features = features.drop(columns=['weekend_interactions'])

    print("Computing genre features...")
    # Explode genres for proportion calculation
    df_exploded = df.explode('GenreList')
    
    # Unique genres per user
    genre_diversity = df_exploded.groupby('UserID')['GenreList'].nunique().rename('unique_genre_count')
    features = features.join(genre_diversity)
    features['unique_genre_count'] = features['unique_genre_count'].fillna(0).astype(int)

    # Calculate genre proportions
    genre_counts = df_exploded.groupby(['UserID', 'GenreList']).size().unstack(fill_value=0)
    # Normalize by total *genre interactions* for that user
    genre_proportions = genre_counts.div(genre_counts.sum(axis=1), axis=0).round(4)
    def clean_genre(g):
        return g.lower().replace('-', '_').replace(' ', '_').replace("'", '')
    # Rename columns to indicate they are proportions
    genre_proportions.columns = [f"genre_prop_{clean_genre(g)}" for g in genre_proportions.columns]
    
    features = features.join(genre_proportions).fillna(0.0)
    
    print("Saving processed data...")
    os.makedirs('data/processed', exist_ok=True)
    
    features = features.reset_index()
    features.to_csv('data/processed/user_features.csv', index=False)
    
    print("Validating output...")
    print("Shape:", features.shape)
    print("\nFeature Names:")
    print(features.columns.tolist())
    print("\nFirst 5 rows:")
    print(features.head())
    print("\nMissing Values:")
    print(features.isnull().sum().sum(), "total missing values")
    
    # Verify no NaN/inf
    assert not features.isnull().any().any(), "Data contains NaN values"
    assert not np.isinf(features.select_dtypes(include=[np.number])).any().any(), "Data contains infinite values"
    print("\nBasic Statistics:")
    print(features.describe())
    
    # Metadata
    metadata = {
        "number_of_users": int(features.shape[0]),
        "number_of_features": int(features.shape[1] - 1),  # excluding UserID
        "feature_names": list(features.columns[1:]),
        "source_files": ["ratings.dat", "movies.dat"],
        "feature_descriptions": {
            "interaction_count": "Total ratings given by the user.",
            "average_rating": "Mean rating score.",
            "rating_std": "Standard deviation of ratings.",
            "activity_span_days": "Days between first and last interaction.",
            "recency_days": "Days since the user's last interaction relative to dataset max timestamp.",
            "active_days": "Number of unique days the user interacted.",
            "interactions_per_active_day": "Ratio of interactions to active days.",
            "weekend_interaction_ratio": "Proportion of interactions that occurred on a weekend.",
            "unique_genre_count": "Number of distinct genres engaged with.",
            "genre_prop_*": "Proportion of interactions involving this genre out of total genre-interactions."
        },
        "data_quality_notes": "NaN rating_std filled with 0. Duplicates dropped. No NaN or Infinite values in final matrix."
    }
    
    with open('data/processed/feature_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

if __name__ == "__main__":
    build_features()
