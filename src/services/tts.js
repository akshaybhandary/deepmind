// Text-to-Speech Service using Web Speech API

class TTSService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPaused = false;
        this.isPlaying = false;
        this.currentPosition = 0;
        this.chunks = [];
        this.currentChunkIndex = 0;
        this.rate = 1;
        this.voice = null;
        this.onProgressCallback = null;
        this.onEndCallback = null;

        // Load voices
        this.voices = [];
        this.loadVoices();

        // Some browsers load voices asynchronously
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        // Prefer English voices, prioritize better quality ones
        const preferred = ['Google', 'Microsoft', 'Samantha', 'Daniel', 'Karen'];

        for (const name of preferred) {
            const found = this.voices.find(v =>
                v.name.includes(name) && v.lang.startsWith('en')
            );
            if (found) {
                this.voice = found;
                break;
            }
        }

        // Fallback to any English voice
        if (!this.voice) {
            this.voice = this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
        }
    }

    /**
     * Prepare text for TTS by splitting into manageable chunks
     * @param {string} text - Full text to speak
     */
    prepare(text) {
        // Remove markdown formatting for cleaner speech
        const cleanText = text
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
            .replace(/\*([^*]+)\*/g, '$1') // Remove italic
            .replace(/`([^`]+)`/g, '$1') // Remove code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links
            .replace(/[-*+]\s/g, '') // Remove list markers
            .replace(/\n{2,}/g, '. ') // Replace multiple newlines with pause
            .replace(/\n/g, ' ') // Replace single newlines
            .trim();

        // Split into sentences for better chunking
        this.chunks = cleanText
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 0);

        this.currentChunkIndex = 0;
        this.currentPosition = 0;
    }

    /**
     * Start or resume speaking
     * @param {Function} onProgress - Progress callback (0-1)
     * @param {Function} onEnd - Completion callback
     */
    play(onProgress, onEnd) {
        if (this.chunks.length === 0) return;

        this.onProgressCallback = onProgress;
        this.onEndCallback = onEnd;

        if (this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
            this.isPlaying = true;
            return;
        }

        this.speakNextChunk();
    }

    speakNextChunk() {
        if (this.currentChunkIndex >= this.chunks.length) {
            this.isPlaying = false;
            this.onEndCallback?.();
            return;
        }

        const text = this.chunks[this.currentChunkIndex];
        this.utterance = new SpeechSynthesisUtterance(text);

        if (this.voice) {
            this.utterance.voice = this.voice;
        }
        this.utterance.rate = this.rate;
        this.utterance.pitch = 1;

        this.utterance.onend = () => {
            this.currentChunkIndex++;
            this.currentPosition = this.currentChunkIndex / this.chunks.length;
            this.onProgressCallback?.(this.currentPosition);

            if (this.isPlaying && !this.isPaused) {
                this.speakNextChunk();
            }
        };

        this.utterance.onerror = (event) => {
            console.error('TTS error:', event);
            // Try to continue with next chunk
            if (event.error !== 'interrupted' && event.error !== 'canceled') {
                this.currentChunkIndex++;
                if (this.isPlaying) {
                    this.speakNextChunk();
                }
            }
        };

        this.isPlaying = true;
        this.synth.speak(this.utterance);
    }

    /**
     * Pause speaking
     */
    pause() {
        if (this.isPlaying) {
            this.synth.pause();
            this.isPaused = true;
        }
    }

    /**
     * Stop speaking completely
     */
    stop() {
        this.synth.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentChunkIndex = 0;
        this.currentPosition = 0;
    }

    /**
     * Set playback rate
     * @param {number} rate - Playback rate (0.5 to 2)
     */
    setRate(rate) {
        this.rate = Math.max(0.5, Math.min(2, rate));
        // If currently playing, restart current chunk with new rate
        if (this.isPlaying && !this.isPaused) {
            this.synth.cancel();
            this.speakNextChunk();
        }
    }

    /**
     * Skip to a specific position
     * @param {number} position - Position (0-1)
     */
    seekTo(position) {
        const targetChunk = Math.floor(position * this.chunks.length);
        this.currentChunkIndex = Math.max(0, Math.min(targetChunk, this.chunks.length - 1));
        this.currentPosition = position;

        if (this.isPlaying) {
            this.synth.cancel();
            this.speakNextChunk();
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            position: this.currentPosition,
            rate: this.rate,
            totalChunks: this.chunks.length,
            currentChunk: this.currentChunkIndex
        };
    }

    /**
     * Get available voices
     */
    getVoices() {
        return this.voices.filter(v => v.lang.startsWith('en'));
    }

    /**
     * Set voice by name
     */
    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.voice = voice;
        }
    }

    /**
     * Estimate reading time in seconds
     * @param {string} text - Text to estimate
     * @returns {number} Estimated seconds
     */
    estimateTime(text) {
        // Average speaking rate is about 150 words per minute
        const words = text.split(/\s+/).length;
        return Math.ceil((words / 150) * 60 / this.rate);
    }
}

// Singleton instance
export const ttsService = new TTSService();
export default ttsService;
