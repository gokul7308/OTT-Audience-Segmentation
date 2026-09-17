from model_loader import model_loader

class SegmentRecommender:
    def get_segment_metadata(self, segment_id: int):
        """Retrieve segment name and default recommendations given an ID from actual trained metadata."""
        # Use the dynamically loaded metadata from the trained model
        metadata = model_loader.get_segment_metadata()
        
        # Access the "segments" dictionary within the metadata file
        segments = metadata.get("segments", {})
        
        # Keys in JSON might be loaded as strings, so safely handle str/int keys
        seg_data = segments.get(str(segment_id)) or segments.get(segment_id)
        
        if seg_data:
            return seg_data
            
        # Safe fallback if segment ID is somehow missing
        return {"segment_name": f"Segment {segment_id} (Unknown)", "recommendation_strategy": ["Trending Content"]}

    def generate_recommendations(self, segment_id: int, top_genres: list):
        """
        Generate lightweight recommendations based on segment and genres.
        Keep it rule-based and transparent.
        """
        metadata = self.get_segment_metadata(segment_id)
        recs = metadata.get("recommendation_strategy", ["Trending Content"]).copy()
        
        # Return top 3 transparently
        return recs[:3]
