import os
import joblib
import json
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self):
        # Allow configuration of model path
        self.model_dir = os.environ.get("MODEL_DIR", "../models") # Default to relative path for local testing
        self.model_path = os.path.join(self.model_dir, "clustering_pipeline.pkl")
        self.metadata_path = os.path.join(self.model_dir, "segment_metadata.json")
        self.pipeline = None
        self.segment_metadata = {}
        self.is_loaded = False

    def load_model(self):
        """Load the persisted preprocessing + clustering pipeline and metadata."""
        if not os.path.exists(self.model_path) or not os.path.exists(self.metadata_path):
            logger.warning(f"Model or metadata file not found at {self.model_dir}. Service will run in degraded mode.")
            return False
            
        try:
            # Load it ONCE when the API starts
            self.pipeline = joblib.load(self.model_path)
            
            with open(self.metadata_path, 'r') as f:
                self.segment_metadata = json.load(f)
                
            self.is_loaded = True
            logger.info("Model pipeline and metadata loaded successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to load model artifacts: {str(e)}")
            self.is_loaded = False
            return False
            
    def get_pipeline(self):
        return self.pipeline
        
    def get_segment_metadata(self):
        return self.segment_metadata

# Create a singleton instance to be loaded at startup
model_loader = ModelLoader()
