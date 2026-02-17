from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    class_name: str
    review_text: str
    rating: int


class ReviewResponse(BaseModel):
    id: int
    class_name: str
    review_text: str
    rating: int
    username: str
    created_at: datetime

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_name: Optional[str] = None

    class Config:
        orm_mode = True
