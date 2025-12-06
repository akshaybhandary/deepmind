# Kokoro TTS Server Setup

## Quick Start

1. Get your DeepInfra API key from https://deepinfra.com/dash/api_keys

2. Install dependencies:
```bash
cd server
pip install -r requirements.txt
```

3. Set your API key:
```bash
export DEEPINFRA_API_KEY=your_key_here
```

4. Run the server:
```bash
python tts_server.py
```

Server runs on http://localhost:8765

## Pricing

DeepInfra Kokoro TTS pricing: ~$0.10 per 1000 characters
- 500 char snippet ≈ $0.05
- Very affordable for occasional use

## Voices Available

- `af_heart` - Heart (Female)
- `af_bella` - Bella (Female)
- `af_nicole` - Nicole (Female)
- `af_sarah` - Sarah (Female)
- `af_sky` - Sky (Female)
- `am_adam` - Adam (Male)
- `am_michael` - Michael (Male)
- `bf_emma` - Emma (British Female)
- `bm_george` - George (British Male)
