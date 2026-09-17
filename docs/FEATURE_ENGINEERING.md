# User Behavior Feature Engineering

## Objective
Convert raw interaction logs into a user-level behavioral matrix suitable for unsupervised audience segmentation (K-Means clustering). 

## Data Transformation
The original MovieLens dataset records distinct interaction events (`ratings.dat`). Since clustering requires independent variables (users) with structured numerical profiles, the data was grouped by `UserID` and aggregated. 

## Feature Categories

### 1. Engagement Features
*   **`interaction_count`**: Total volume of ratings. Reflects raw engagement level (e.g., casual viewers vs. power users).
*   **`average_rating`**: Mean rating score. Reflects overall sentiment and critical strictness.
*   **`rating_std`**: Standard deviation of ratings. Indicates rating variance (e.g., consistent raters vs. polarized raters).

### 2. Temporal/Activity Features
*   **`activity_span_days`**: Days between first and last interaction. Differentiates long-term subscribers from short-term binge users.
*   **`active_days`**: Number of unique days the user logged an interaction. 
*   **`interactions_per_active_day`**: Session density. Indicates how much a user consumes in a single sitting/day.
*   **`weekend_interaction_ratio`**: Proportion of interactions occurring on Saturdays/Sundays. Helps identify weekend-only audiences.
*   **`recency_days`**: Days since the user's last interaction (relative to the dataset's global max timestamp). Indicates churn risk.

### 3. Genre Behavior Features
*   **`unique_genre_count`**: Number of distinct genres engaged with. Differentiates niche audiences from generalists.
*   **`genre_prop_*`**: Proportion of interactions involving a specific genre. Directly quantifies taste profiles without assuming predefined labels.

## Missing Data Limitations
The problem statement assumed the presence of `watch_time_hours` and `avg_session_mins`. The MovieLens dataset does not contain duration logs. 

**Workaround:** We successfully proxied these concepts using authentic interaction timestamps:
*   `watch_time_hours` → proxied by `interaction_count` and `active_days`
*   `avg_session_mins` → proxied by `interactions_per_active_day`

## Statement of Integrity
No synthetic behavioral values were generated, nor were artificial cluster labels assigned. Every feature in the matrix is mathematically derived from an authentic user interaction in the dataset.
