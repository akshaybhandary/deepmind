# DeepMind AI Analysis Platform

A multi-agent AI research analysis platform that transforms any topic into comprehensive, expertly-written reports.

## Features

- 🤖 **Multi-Agent Analysis**: Orchestrates multiple AI agents for deep research
- 🔊 **Text-to-Speech**: Listen to your reports with Kokoro TTS voices
- 📄 **PDF Export**: Download full reports as formatted PDFs
- 📚 **Library**: Save and manage your analysis history
- 📖 **EduViz**: Visual textbook mode for educational content

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Python FastAPI (TTS Server)
- **AI**: OpenRouter API for LLM access
- **TTS**: DeepInfra Kokoro-82M

## Local Development

### Frontend
```bash
npm install
npm run dev
```

### TTS Server
```bash
cd server
pip install -r requirements.txt
export DEEPINFRA_API_KEY=your_key_here
python tts_server.py
```

## Environment Variables

- `DEEPINFRA_API_KEY`: Required for TTS functionality
- OpenRouter API key is configured in the Settings page

## Deployment

This project includes a `render.yaml` for easy deployment to Render.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## License

MIT
