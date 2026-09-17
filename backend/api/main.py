import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import pandas as pd

from schemas import RecommendRequest, RecommendResponse
from model_loader import model_loader
from recommender import SegmentRecommender

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audience Segmentation API")
recommender = SegmentRecommender()

@app.on_event("startup")
async def startup_event():
    """Load model ONCE at API startup."""
    model_loader.load_model()

@app.get("/health")
async def health_check():
    """Health check endpoint required by Evaluator."""
    return {
        "status": "ok",
        "model_loaded": model_loader.is_loaded
    }

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    """Generate segment and recommendations for a user."""
    # 1. Validation is handled automatically by Pydantic (RecommendRequest schema)
    
    # 2. Check model loaded
    if not model_loader.is_loaded:
        raise HTTPException(
            status_code=503, 
            detail="Service Unavailable: Clustering model is not ready."
        )
        
    try:
        # 3. Apply persisted preprocessing/model
        pipeline = model_loader.get_pipeline()
        
        # Convert request to DataFrame format expected by the pipeline
        input_data = pd.DataFrame([request.model_dump(exclude={"user_id"})])
        
        # Determine cluster directly via pipeline (handles scaling + kmeans)
        segment_id = int(pipeline.predict(input_data)[0])
        
        # To get distance to centroid, we need to apply scaling then transform
        scaler = pipeline.named_steps['scaler']
        kmeans = pipeline.named_steps['kmeans']
        
        processed_input = scaler.transform(input_data)
        distances = kmeans.transform(processed_input)
        distance = float(distances[0][segment_id])
            
        # 4. Map cluster to segment metadata and generate recommendations
        # Extract top genres heuristically from the input for rule-based layer
        genre_props = {k: v for k, v in request.model_dump().items() if k.startswith("genre_prop_")}
        top_genres_keys = sorted(genre_props, key=genre_props.get, reverse=True)[:2]
        top_genres = [k.replace("genre_prop_", "").title() for k in top_genres_keys if genre_props[k] > 0]
        
        metadata = recommender.get_segment_metadata(segment_id)
        recs = recommender.generate_recommendations(segment_id, top_genres)
        
        # 5. Return response
        return RecommendResponse(
            user_id=request.user_id,
            segment_id=segment_id,
            segment_name=metadata["segment_name"],
            recommendations=recs,
            distance_to_centroid=distance
        )
        
    except Exception as e:
        # Never expose internal stack traces. Log internally, return generic error.
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Internal Server Error during recommendation generation."
        )

# Global exception handler for validation errors to ensure clean responses
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid input parameters", "errors": exc.errors()}
    )
