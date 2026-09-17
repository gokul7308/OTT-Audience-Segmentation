from pydantic import BaseModel, Field
from typing import List, Optional

class RecommendRequest(BaseModel):
    user_id: str
    interaction_count: float = Field(ge=0, description="Total ratings given by the user")
    average_rating: float = Field(ge=0, le=5, description="Mean rating score")
    rating_std: float = Field(ge=0, description="Standard deviation of ratings")
    activity_span_days: float = Field(ge=0, description="Days between first and last interaction")
    recency_days: float = Field(ge=0, description="Days since last interaction")
    active_days: float = Field(ge=0, description="Number of unique days interacted")
    interactions_per_active_day: float = Field(ge=0, description="Ratio of interactions to active days")
    weekend_interaction_ratio: float = Field(ge=0, le=1, description="Proportion of interactions on weekends")
    unique_genre_count: float = Field(ge=0, description="Number of distinct genres engaged with")
    genre_prop_action: float = Field(ge=0, le=1)
    genre_prop_adventure: float = Field(ge=0, le=1)
    genre_prop_animation: float = Field(ge=0, le=1)
    genre_prop_childrens: float = Field(ge=0, le=1)
    genre_prop_comedy: float = Field(ge=0, le=1)
    genre_prop_crime: float = Field(ge=0, le=1)
    genre_prop_documentary: float = Field(ge=0, le=1)
    genre_prop_drama: float = Field(ge=0, le=1)
    genre_prop_fantasy: float = Field(ge=0, le=1)
    genre_prop_film_noir: float = Field(ge=0, le=1)
    genre_prop_horror: float = Field(ge=0, le=1)
    genre_prop_musical: float = Field(ge=0, le=1)
    genre_prop_mystery: float = Field(ge=0, le=1)
    genre_prop_romance: float = Field(ge=0, le=1)
    genre_prop_sci_fi: float = Field(ge=0, le=1)
    genre_prop_thriller: float = Field(ge=0, le=1)
    genre_prop_war: float = Field(ge=0, le=1)
    genre_prop_western: float = Field(ge=0, le=1)

class RecommendResponse(BaseModel):
    user_id: str
    segment_id: int
    segment_name: str
    recommendations: List[str]
    distance_to_centroid: Optional[float] = None
