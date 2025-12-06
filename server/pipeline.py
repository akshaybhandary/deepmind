import os
import asyncio
import httpx
from typing import List, Dict
from eduviz_models import Book, Chapter, Page, ImagePrompt, GeneratedImage

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DEEPINFRA_API_KEY = os.getenv("DEEPINFRA_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEEPINFRA_IMAGE_URL = "https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX-1-schnell"

async def call_llm(prompt: str, system_prompt: str, model: str = "anthropic/claude-3.5-sonnet") -> str:
    """Generic LLM caller via OpenRouter"""
    if not OPENROUTER_API_KEY:
        print("Warning: OPENROUTER_API_KEY not set")
        return "Simulated LLM response"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=60.0
        )
        if response.status_code != 200:
            print(f"LLM Error: {response.text}")
            return f"Error: {response.status_code}"
            
        data = response.json()
        return data['choices'][0]['message']['content']

async def generate_image(prompt: str) -> str:
    """Generate image via DeepInfra (Flux)"""
    if not DEEPINFRA_API_KEY:
        print("Warning: DEEPINFRA_API_KEY not set")
        return "https://via.placeholder.com/1024x1024?text=Simulated+Image"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            DEEPINFRA_IMAGE_URL,
            headers={
                "Authorization": f"Bearer {DEEPINFRA_API_KEY}",
                "Content-Type": "application/json"
            },
            json={"prompt": prompt},
            timeout=30.0
        )
        if response.status_code != 200:
            print(f"Image Gen Error: {response.text}")
            return "https://via.placeholder.com/1024x1024?text=Error"
            
        data = response.json()
        # DeepInfra returns base64 or URL depending on model/config
        # Flux usually returns a list of images with base64 or url
        if 'images' in data and len(data['images']) > 0:
            # Assuming it returns a URL or we handle base64 later
            # For now, let's assume it returns a URL or we mock it if complex
            return data['images'][0] 
        return "https://via.placeholder.com/1024x1024?text=No+Image"

class EduVizPipeline:
    def __init__(self):
        pass

    async def simplify_text(self, text: str, audience: str) -> str:
        system_prompt = f"You are an expert teacher. Rewrite the following text to be easily understood by a {audience}. Use analogies and simple language. Keep it concise."
        return await call_llm(text, system_prompt)

    async def create_image_prompt(self, text: str, style: str) -> str:
        system_prompt = f"You are an expert illustrator. Create a detailed image generation prompt for the following text. The style should be {style}. Describe the visual elements clearly."
        return await call_llm(text, system_prompt)

    async def process_book(self, book: Book, raw_text: str):
        """Main pipeline orchestration"""
        print(f"Processing book: {book.title}")
        book.status = "processing"
        
        # 1. Chunking (Simple paragraph split for now)
        chunks = [p for p in raw_text.split('\n\n') if len(p) > 50]
        
        # Limit to first 3 chunks for demo/testing
        chunks = chunks[:3]
        
        chapter = Chapter(title="Chapter 1", order=1)
        
        for i, chunk in enumerate(chunks):
            print(f"Processing chunk {i+1}/{len(chunks)}")
            
            # 2. Simplify
            simplified = await self.simplify_text(chunk, book.target_audience)
            
            # 3. Visual Ideation
            img_prompt_text = await self.create_image_prompt(simplified, book.visual_style)
            
            # 4. Generate Image
            img_url = await generate_image(img_prompt_text)
            
            # Create Page
            page = Page(
                page_number=i+1,
                original_text_chunk=chunk,
                simplified_text=simplified,
                illustration_prompt=ImagePrompt(prompt=img_prompt_text),
                illustration=GeneratedImage(url=img_url, prompt_used=img_prompt_text)
            )
            chapter.pages.append(page)
            
        book.chapters.append(chapter)
        book.status = "completed"
        print(f"Book completed: {book.title}")
        return book
