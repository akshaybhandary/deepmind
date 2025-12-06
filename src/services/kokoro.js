// Kokoro TTS Service - Using free HuggingFace Spaces Gradio API
// No API key required!

const KOKORO_SPACE_URL = 'https://hexgrad-kokoro-tts.hf.space';

// Available voices
export const KOKORO_VOICES = {
    'af_heart': { name: 'Heart (Female)', lang: 'en-us' },
    'af_bella': { name: 'Bella (Female)', lang: 'en-us' },
    'af_nicole': { name: 'Nicole (Female)', lang: 'en-us' },
    'af_sarah': { name: 'Sarah (Female)', lang: 'en-us' },
    'af_sky': { name: 'Sky (Female)', lang: 'en-us' },
    'am_adam': { name: 'Adam (Male)', lang: 'en-us' },
    'am_michael': { name: 'Michael (Male)', lang: 'en-us' },
    'bf_emma': { name: 'Emma (British Female)', lang: 'en-gb' },
    'bm_george': { name: 'George (British Male)', lang: 'en-gb' },
};

/**
 * Generate speech using Kokoro TTS via HuggingFace Spaces
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice ID (default: af_heart)
 * @param {number} speed - Speech speed (0.5-2.0, default: 1.0)
 * @returns {Promise<Blob>} Audio blob
 */
export async function generateSpeech(text, voice = 'af_heart', speed = 1.0) {
    // Clean text for TTS
    const cleanText = text
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links
        .replace(/[-*+]\s/g, '') // Remove list markers
        .replace(/\n{2,}/g, '. ') // Replace multiple newlines
        .replace(/\n/g, ' ') // Replace single newlines
        .trim()
        .slice(0, 500); // Limit length to avoid timeouts

    // Step 1: Queue the request using Gradio's API format
    const queueResponse = await fetch(`${KOKORO_SPACE_URL}/call/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: [cleanText, voice, speed, true]
        })
    });

    if (!queueResponse.ok) {
        throw new Error(`Kokoro queue error: ${queueResponse.status}`);
    }

    const queueResult = await queueResponse.json();
    const eventId = queueResult.event_id;

    if (!eventId) {
        throw new Error('No event ID returned from Kokoro');
    }

    // Step 2: Get the result using SSE
    const resultResponse = await fetch(`${KOKORO_SPACE_URL}/call/generate/${eventId}`);

    if (!resultResponse.ok) {
        throw new Error(`Kokoro result error: ${resultResponse.status}`);
    }

    // Parse SSE response
    const responseText = await resultResponse.text();
    const lines = responseText.split('\n');

    let audioUrl = null;
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            try {
                const data = JSON.parse(line.slice(6));
                // The audio URL is typically in data[0] or data[0].url
                if (Array.isArray(data) && data[0]) {
                    if (typeof data[0] === 'string') {
                        audioUrl = data[0];
                    } else if (data[0].url) {
                        audioUrl = data[0].url;
                    } else if (data[0].path) {
                        audioUrl = `${KOKORO_SPACE_URL}/file=${data[0].path}`;
                    }
                }
            } catch (e) {
                // Skip non-JSON lines
            }
        }
    }

    if (!audioUrl) {
        throw new Error('No audio URL in Kokoro response');
    }

    // Make URL absolute if needed
    if (!audioUrl.startsWith('http')) {
        audioUrl = `${KOKORO_SPACE_URL}/file=${audioUrl}`;
    }

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
        throw new Error('Failed to fetch audio file');
    }

    return await audioResponse.blob();
}

/**
 * Check if Kokoro API is available
 * @returns {Promise<boolean>}
 */
export async function isKokoroAvailable() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${KOKORO_SPACE_URL}/info`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Generate speech for long text by chunking
 * @param {string} text - Full text
 * @param {string} voice - Voice ID
 * @param {number} speed - Speed
 * @param {Function} onProgress - Progress callback (0-1)
 * @returns {Promise<Blob[]>} Array of audio blobs
 */
export async function generateLongSpeech(text, voice = 'af_heart', speed = 1.0, onProgress) {
    // Split into sentences/paragraphs for chunking
    const chunks = text
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 0);

    // Group chunks into reasonable sizes (max ~500 chars each)
    const groups = [];
    let currentGroup = '';

    for (const chunk of chunks) {
        if (currentGroup.length + chunk.length > 500) {
            if (currentGroup) groups.push(currentGroup.trim());
            currentGroup = chunk;
        } else {
            currentGroup += ' ' + chunk;
        }
    }
    if (currentGroup.trim()) groups.push(currentGroup.trim());

    // Generate audio for each group
    const audioBlobs = [];
    for (let i = 0; i < groups.length; i++) {
        const blob = await generateSpeech(groups[i], voice, speed);
        audioBlobs.push(blob);
        onProgress?.((i + 1) / groups.length);
    }

    return audioBlobs;
}

export default { generateSpeech, generateLongSpeech, isKokoroAvailable, KOKORO_VOICES };
