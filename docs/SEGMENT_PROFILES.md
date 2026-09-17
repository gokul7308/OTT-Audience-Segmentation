# Segment Profiles

## Methodology Overview
A KMeans clustering model was trained over the derived user behavior feature matrix, utilizing standard scaling and a fixed random seed (42).

K selection was primarily driven by Silhouette Score and Inertia evaluation. K values from 2 to 8 were tested. **K=3** was selected due to providing the strongest Silhouette Score (0.1192) while maintaining robust, balanced cluster sizes.

## Segment Profiles (K=3)

### Segment 0: High-Activity Viewers (Drama, Comedy)
*   **Cluster Size:** 656 users (10.86%)
*   **Defining Features:**
    *   **Extremely High Engagement:** Averages 404.93 interactions per user, which is roughly 2.5-4x higher than regular viewers.
    *   **Long-Term Activity Span:** Average activity span stretches to nearly 670 days, indicating highly loyal and tenured users.
    *   **High Genre Exploration:** Highest unique genre count (17.38).
*   **Dominant Genres:** Drama, Comedy
*   **Recommendation Strategy:**
    *   Prioritize titles in Drama and Comedy.
    *   Promote broad discovery and back-catalog titles to satisfy high volume needs.
    *   Mix preferred genres with mainstream hits.

### Segment 1: Regular Viewers (Action, Comedy)
*   **Cluster Size:** 2,422 users (40.10%)
*   **Defining Features:**
    *   **Action Preference:** Distinctively leans heavily toward Action features as their primary differentiator alongside Comedy.
    *   **Moderate Engagement:** Averages 169.25 interactions over relatively short bursts of activity (average span ~22.5 days).
    *   **Slightly Lower Rating:** Slightly more critical average rating of 3.62.
*   **Dominant Genres:** Action, Comedy
*   **Recommendation Strategy:**
    *   Prioritize titles in Action and Comedy.
    *   Mix preferred genres with mainstream hits to capture short-term burst behavior.

### Segment 2: Regular Viewers (Drama, Comedy)
*   **Cluster Size:** 2,962 users (49.04%)
*   **Defining Features:**
    *   **Highest Sentiment:** Maintains the highest average rating in the dataset (3.78).
    *   **Casual Engagement Volume:** Averages 109.61 interactions, the lowest volume among all segments.
    *   **Traditional Tastes:** Heavily concentrated on classic Drama/Comedy combinations.
*   **Dominant Genres:** Drama, Comedy
*   **Recommendation Strategy:**
    *   Prioritize titles in Drama and Comedy.
    *   Mix preferred genres with mainstream hits as they are less exploratory.

## Verification
-   The artifact (`models/clustering_pipeline.pkl`) loads correctly.
-   `models/segment_metadata.json` maps 1:1 with the K=3 cluster IDs.
-   Recommendations are entirely deterministic and rule-based derived directly from the observed metrics. No external LLMs were utilized.
