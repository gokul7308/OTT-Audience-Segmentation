# OTT Audience Intelligence Frontend

This is a lightweight, professional frontend dashboard for the OTT Audience Segmentation and Personalization Service. It connects directly to the FastAPI backend to provide real-time segmentation and rule-based recommendations.

## Technology Stack
- **React 18** (UI Library)
- **TypeScript** (Type safety)
- **Vite** (Build Tool)
- **Tailwind CSS v4** (Styling)
- **Lucide React** (Icons)
- **Axios** (API Client)

## Prerequisites
- Node.js (v18+)
- The backend FastAPI service must be running (usually on `http://localhost:8000`).

## Configuration
The dashboard communicates with the backend via the `VITE_API_URL` environment variable. By default, it expects the backend at `http://localhost:8000`.

To customize the URL, copy the example environment file:
```bash
cp .env.example .env
```
And update `VITE_API_URL` inside `.env`. No API keys are required.

## Installation
From the `frontend/` directory, install dependencies:
```bash
npm install
```

## Running the Application
To run the dashboard in development mode:
```bash
npm run dev
```
Navigate to the provided localhost URL (e.g., `http://localhost:5173`) in your browser.

To build for production:
```bash
npm run build
```

## How It Works
1. **API Status**: Automatically polls `GET /health` to ensure the ML model and API are online.
2. **Behavioral Profile**: Enter 27 user behavior fields (or use a built-in Preset).
3. **Inference**: Click "Analyze Audience" to hit `POST /recommend`.
4. **Results**: View the exact unsupervised segment ID, name, centroid distance, and rule-based recommendations dynamically calculated by the backend.
