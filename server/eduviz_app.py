from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from typing import List
import asyncio

# Import models and pipeline
from eduviz_models import Book, ProcessingRequest
from pipeline import EduVizPipeline

app = FastAPI(title="EduViz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for now (will move to file storage later)
books_db = {}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "eduviz-backend"}

@app.post("/upload/text")
async def upload_text(request: ProcessingRequest):
    """
    Start processing a raw text input into a Visual Textbook
    """
    book = Book(
        title=request.title,
        original_source="text_input",
        target_audience=request.audience,
        visual_style=request.style,
        status="queued"
    )
    books_db[book.id] = book
    
    # Trigger background processing task
    pipeline = EduVizPipeline()
    asyncio.create_task(pipeline.process_book(book, request.text))
    
    return book

@app.get("/books/{book_id}")
async def get_book(book_id: str):
    if book_id not in books_db:
        raise HTTPException(status_code=404, detail="Book not found")
    return books_db[book_id]

@app.get("/books")
async def list_books():
    return list(books_db.values())

if __name__ == "__main__":
    print("Starting EduViz Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
