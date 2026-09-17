# OTT Audience Segmentation & Personalization

A machine learning project that automatically groups OTT users based on their viewing behavior and provides personalized recommendations.

## Problem

OTT platforms have large amounts of user activity data. It is difficult to manually identify different types of viewers.

Our solution automatically identifies audience segments using machine learning and provides recommendations through an API.

## Solution

The system follows this pipeline:

Dataset → Data Processing → KMeans Clustering → Audience Segment → Recommendations

## Tech Stack

- Python
- Pandas
- NumPy
- Scikit-learn
- KMeans
- FastAPI
- Docker
- Docker Compose

## Architecture

The project contains 3 main services:

1. **Trainer** – Processes the dataset and trains the KMeans model.
2. **API** – Predicts the user's audience segment and provides recommendations.
3. **Evaluator** – Tests the API and generates evaluation metrics.

## Project Structure

```text
OTT-AUDIENCE-SEGMENTATION/
├── backend/
│   └── api/
├── trainer/
├── evaluator/
├── data/
│   └── raw/
├── models/
├── docs/
├── docker-compose.yml
├── README.md
├── REPORT.md
└── metrics.json
