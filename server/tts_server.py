# TTS Server using DeepInfra Kokoro API
# Requires DeepInfra API key

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import httpx
import os
import uvicorn
import base64

app = FastAPI(title="Kokoro TTS Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DeepInfra API config
DEEPINFRA_API_URL = "https://api.deepinfra.com/v1/inference/hexgrad/Kokoro-82M"
DEEPINFRA_API_KEY = os.getenv("DEEPINFRA_API_KEY", "")

class TTSRequest(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1.0

KOKORO_VOICES = {
    "af_heart": {"name": "Heart (Female)", "lang": "en-us"},
    "af_bella": {"name": "Bella (Female)", "lang": "en-us"},
    "af_nicole": {"name": "Nicole (Female)", "lang": "en-us"},
    "af_sarah": {"name": "Sarah (Female)", "lang": "en-us"},
    "af_sky": {"name": "Sky (Female)", "lang": "en-us"},
    "am_adam": {"name": "Adam (Male)", "lang": "en-us"},
    "am_michael": {"name": "Michael (Male)", "lang": "en-us"},
    "bf_emma": {"name": "Emma (British Female)", "lang": "en-gb"},
    "bm_george": {"name": "George (British Male)", "lang": "en-gb"},
}

@app.get("/health")
async def health():
    if not DEEPINFRA_API_KEY:
        return {"status": "error", "message": "DEEPINFRA_API_KEY not set"}
    return {"status": "ok", "service": "deepinfra-kokoro"}

@app.get("/voices")
async def get_voices():
    return KOKORO_VOICES

@app.post("/generate")
async def generate_speech(request: TTSRequest):
    """Generate speech using DeepInfra Kokoro API"""
    if not DEEPINFRA_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="DEEPINFRA_API_KEY environment variable not set"
        )
    
    try:
        clean_text = request.text.strip()
        if not clean_text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        print(f"Generating TTS via DeepInfra: {clean_text[:50]}... (voice: {request.voice})")
        
        # Call DeepInfra API with correct parameters
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                DEEPINFRA_API_URL,
                headers={
                    "Authorization": f"Bearer {DEEPINFRA_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "text": clean_text,  # DeepInfra Kokoro expects "text"
                    "voice": request.voice,
                    "speed": request.speed if request.speed != 1.0 else None,  # Only send if not default
                    "response_format": "wav"  # Request WAV format
                }
            )
            
            if response.status_code != 200:
                error_msg = response.text
                print(f"DeepInfra API error ({response.status_code}): {error_msg}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"DeepInfra API error: {error_msg}"
                )
            
            # The response is JSON with audio in base64 or data URL format
            result = response.json()
            if "audio" in result:
                audio_data_raw = result["audio"]
                # Handle data URL format: data:audio/wav;base64,XXXX
                if audio_data_raw.startswith("data:"):
                    # Strip the data URL prefix
                    audio_data_raw = audio_data_raw.split(",", 1)[1]
                # Decode base64 audio
                audio_data = base64.b64decode(audio_data_raw)
                return Response(
                    content=audio_data,
                    media_type="audio/wav",
                    headers={"Content-Disposition": "attachment; filename=speech.wav"}
                )
            else:
                # Binary audio response
                return Response(
                    content=response.content,
                    media_type="audio/wav",
                    headers={"Content-Disposition": "attachment; filename=speech.wav"}
                )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"TTS Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    if not DEEPINFRA_API_KEY:
        print("⚠️  WARNING: DEEPINFRA_API_KEY environment variable not set!")
        print("Set it with: export DEEPINFRA_API_KEY=your_key_here")
        print()
    
    print("Starting Kokoro TTS Server (DeepInfra)...")
    print("API docs at: http://localhost:8765/docs")
    uvicorn.run(app, host="0.0.0.0", port=8765)
