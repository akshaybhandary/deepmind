from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from uuid import uuid4
from datetime import datetime

class ImagePrompt(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    style_preset: Optional[str] = "scientific_illustration"

class GeneratedImage(BaseModel):
    url: str
    local_path: Optional[str] = None
    prompt_used: str
    generated_at: datetime = Field(default_factory=datetime.now)

class Page(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    page_number: int
    original_text_chunk: str
    simplified_text: str
    key_terms: List[str] = []
    illustration_prompt: Optional[ImagePrompt] = None
    illustration: Optional[GeneratedImage] = None

class Chapter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    order: int
    pages: List[Page] = []

class Book(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    original_source: str  # Filename or URL
    target_audience: str = "General Audience"
    visual_style: str = "Scientific Illustration"
    created_at: datetime = Field(default_factory=datetime.now)
    chapters: List[Chapter] = []
    status: str = "processing"  # processing, completed, error
    
class ProcessingRequest(BaseModel):
    text: str
    title: str
    audience: str = "High School Student"
    style: str = "Pixar 3D"
