# Dataset Source Documentation

## Dataset Information
- **Dataset Name:** MovieLens 1M Dataset
- **Source:** GroupLens Research (University of Minnesota)
- **Source URL:** https://files.grouplens.org/datasets/movielens/ml-1m.zip

## Why It Is Being Used
The official hackathon problem statement mandated the use of a "supplied tabular user activity dataset" to build a "Containerized Audience Segmentation & Personalization Service." However, **the hackathon organizers did not actually provide the referenced dataset** with the problem statement or materials. 

To proceed with building a legitimate, functioning prototype without fabricating synthetic data or artificial labels, we have integrated the public MovieLens 1M dataset. This serves as an authentic proxy for OTT audience behavior. 

## Files Obtained
The dataset was downloaded and extracted into `data/raw/` with zero modifications to the original files:
- `users.dat` (6,040 records)
- `movies.dat` (3,883 records) 
- `ratings.dat` (1,000,209 records)

## Actual Schema Discovered
The files use a `::` delimiter with no headers. The schema is defined as:
- **users.dat:** `UserID::Gender::Age::Occupation::Zip-code`
- **movies.dat:** `MovieID::Title::Genres` (Genres are pipe-separated, e.g., `Animation|Children's|Comedy`)
- **ratings.dat:** `UserID::MovieID::Rating::Timestamp`

## Potential Behavioral Features
**Important:** The dataset *does not* contain explicit duration metrics like `watch_time_hours` or `avg_session_mins` originally presumed in the problem statement. 

Instead of fabricating these columns, we will legitimately derive the following behavioral features directly from the user interaction logs (`ratings.dat` joined with `movies.dat`):
1. **Interaction Count:** Total number of ratings submitted by the user.
2. **Average Rating:** The user's mean satisfaction score.
3. **Genre Preference Distribution:** The proportion of interactions per genre (e.g., % Action, % Comedy), revealing categorical viewing behavior.
4. **Genre Diversity:** The absolute number of unique genres the user engages with.
5. **Activity Span (Recency/Frequency):** Temporal patterns derived from the `Timestamp` column (e.g., days between first and last rating, interaction frequency).

## Statement of Integrity
No synthetic data, artificial columns, or fake ML labels are being created. The machine learning pipeline will cluster users entirely based on the mathematical realities of the authentic MovieLens dataset.
