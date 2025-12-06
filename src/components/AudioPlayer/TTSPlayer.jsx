import { useState, useEffect, useRef } from 'react';
import { TTS_SPEEDS } from '../../utils/constants';

const TTS_SERVER_URL = 'http://localhost:8765';
const CHUNK_SIZE = 450; // Characters per chunk (leaving buffer for API limits)

// Kokoro voices from Python server
const KOKORO_VOICES = {
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

function TTSPlayer({ content }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [serverAvailable, setServerAvailable] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('af_heart');
    const [error, setError] = useState(null);
    const [currentChunk, setCurrentChunk] = useState(0);
    const [totalChunks, setTotalChunks] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const audioRef = useRef(null);
    const audioUrlRef = useRef(null);
    const progressRef = useRef(null);
    const chunksRef = useRef([]);
    const stopRequestedRef = useRef(false);
    const voiceRef = useRef('af_heart');
    const speedRef = useRef(1);

    // Check server availability on mount
    useEffect(() => {
        checkServer();
    }, []);

    const checkServer = async () => {
        try {
            const response = await fetch(`${TTS_SERVER_URL}/health`, {
                signal: AbortSignal.timeout(3000)
            });
            setServerAvailable(response.ok);
            if (!response.ok) {
                setError('TTS server not running');
            }
        } catch {
            setServerAvailable(false);
            setError('TTS server offline');
        }
    };

    // Clean and split text into chunks
    const prepareChunks = (text) => {
        const cleanedText = text
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[-*+]\s/g, '')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Split into chunks at sentence boundaries
        const sentences = cleanedText.split(/(?<=[.!?])\s+/);
        const chunks = [];
        let currentChunkText = '';

        for (const sentence of sentences) {
            if ((currentChunkText + ' ' + sentence).length <= CHUNK_SIZE) {
                currentChunkText = currentChunkText ? currentChunkText + ' ' + sentence : sentence;
            } else {
                if (currentChunkText) {
                    chunks.push(currentChunkText.trim());
                }
                // If single sentence is too long, split it
                if (sentence.length > CHUNK_SIZE) {
                    const words = sentence.split(' ');
                    let wordChunk = '';
                    for (const word of words) {
                        if ((wordChunk + ' ' + word).length <= CHUNK_SIZE) {
                            wordChunk = wordChunk ? wordChunk + ' ' + word : word;
                        } else {
                            if (wordChunk) chunks.push(wordChunk.trim());
                            wordChunk = word;
                        }
                    }
                    if (wordChunk) currentChunkText = wordChunk;
                } else {
                    currentChunkText = sentence;
                }
            }
        }
        if (currentChunkText) {
            chunks.push(currentChunkText.trim());
        }

        return chunks.filter(c => c.length > 0);
    };

    useEffect(() => {
        if (content) {
            const chunks = prepareChunks(content);
            chunksRef.current = chunks;
            setTotalChunks(chunks.length);
            // Estimate duration based on word count
            const words = content.split(/\s+/).length;
            setDuration(Math.ceil((words / 150) * 60 / speed));
        }

        return () => {
            stopRequestedRef.current = true;
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
        };
    }, [content, speed]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const generateChunkAudio = async (text) => {
        // Use refs to get current values (avoids stale closure issues in async callbacks)
        const currentVoice = voiceRef.current;
        const currentSpeed = speedRef.current;
        console.log('Generating audio with voice:', currentVoice, 'speed:', currentSpeed);
        const response = await fetch(`${TTS_SERVER_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voice: currentVoice,
                speed: currentSpeed
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const rawBlob = await response.blob();
        return new Blob([rawBlob], { type: 'audio/wav' });
    };

    const playChunk = async (chunkIndex) => {
        if (stopRequestedRef.current || chunkIndex >= chunksRef.current.length) {
            handleEnd();
            return;
        }

        setCurrentChunk(chunkIndex);
        setIsLoading(chunkIndex === 0);

        try {
            const audioBlob = await generateChunkAudio(chunksRef.current[chunkIndex]);

            if (stopRequestedRef.current) {
                handleEnd();
                return;
            }

            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
            audioUrlRef.current = URL.createObjectURL(audioBlob);

            audioRef.current = new Audio(audioUrlRef.current);
            audioRef.current.playbackRate = speed;

            audioRef.current.onended = () => {
                if (!stopRequestedRef.current) {
                    playChunk(chunkIndex + 1);
                }
            };

            audioRef.current.onerror = () => {
                setError('Audio playback failed');
                handleEnd();
            };

            audioRef.current.ontimeupdate = () => {
                if (audioRef.current && chunksRef.current.length > 0) {
                    const chunkProgress = audioRef.current.currentTime / audioRef.current.duration;
                    const overallProgress = (chunkIndex + chunkProgress) / chunksRef.current.length;
                    setProgress(overallProgress);
                }
            };

            await audioRef.current.play();
            setIsPlaying(true);
            setIsPaused(false);
            setIsLoading(false);
        } catch (err) {
            console.error('TTS error:', err);
            setError(err.message || 'TTS generation failed');
            setIsLoading(false);
        }
    };

    const handlePlayPause = async () => {
        if (!serverAvailable) {
            setError('TTS server not running');
            return;
        }

        if (isPlaying && !isPaused) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setIsPaused(true);
            return;
        }

        if (isPaused) {
            if (audioRef.current) {
                audioRef.current.play();
            }
            setIsPaused(false);
            return;
        }

        // Start fresh
        stopRequestedRef.current = false;
        setError(null);
        await playChunk(0);
    };

    const handleEnd = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setCurrentTime(0);
        setCurrentChunk(0);
        setIsLoading(false);
        stopRequestedRef.current = false;
    };

    const handleStop = () => {
        stopRequestedRef.current = true;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        handleEnd();
    };

    const handleSpeedChange = () => {
        const currentIndex = TTS_SPEEDS.indexOf(speed);
        const nextIndex = (currentIndex + 1) % TTS_SPEEDS.length;
        const newSpeed = TTS_SPEEDS[nextIndex];
        setSpeed(newSpeed);
        speedRef.current = newSpeed; // Update ref for async callbacks

        if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
        }
    };

    const handleProgressClick = (e) => {
        // For chunked audio, seeking is more complex - skip for now
        // Could implement by calculating which chunk to jump to
    };

    const handleVoiceChange = (e) => {
        const newVoice = e.target.value;
        setSelectedVoice(newVoice);
        voiceRef.current = newVoice; // Update ref for async callbacks
        // Stop playback and clear cached audio so new voice is used
        if (isPlaying) {
            handleStop();
        }
        // Clear any cached audio to force regeneration
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
        console.log('Voice changed to:', newVoice);
    };

    // Combine WAV files (simple concatenation for PCM data)
    const combineWavBlobs = async (blobs) => {
        if (blobs.length === 0) return null;
        if (blobs.length === 1) return blobs[0];

        // Read all blobs as array buffers
        const arrayBuffers = await Promise.all(
            blobs.map(blob => blob.arrayBuffer())
        );

        // For WAV files, we need to:
        // 1. Keep header from first file
        // 2. Concatenate audio data from all files
        // 3. Update the file size in header

        const WAV_HEADER_SIZE = 44;

        // Calculate total audio data size (excluding headers from subsequent files)
        let totalDataSize = 0;
        for (let i = 0; i < arrayBuffers.length; i++) {
            if (i === 0) {
                totalDataSize += arrayBuffers[i].byteLength - WAV_HEADER_SIZE;
            } else {
                totalDataSize += arrayBuffers[i].byteLength - WAV_HEADER_SIZE;
            }
        }

        // Create combined buffer
        const combinedBuffer = new ArrayBuffer(WAV_HEADER_SIZE + totalDataSize);
        const combinedView = new Uint8Array(combinedBuffer);

        // Copy header from first file
        const firstHeader = new Uint8Array(arrayBuffers[0], 0, WAV_HEADER_SIZE);
        combinedView.set(firstHeader, 0);

        // Copy audio data from all files
        let offset = WAV_HEADER_SIZE;
        for (let i = 0; i < arrayBuffers.length; i++) {
            const audioData = new Uint8Array(arrayBuffers[i], WAV_HEADER_SIZE);
            combinedView.set(audioData, offset);
            offset += audioData.length;
        }

        // Update file size in header (bytes 4-7)
        const dataView = new DataView(combinedBuffer);
        dataView.setUint32(4, combinedBuffer.byteLength - 8, true); // File size - 8
        dataView.setUint32(40, totalDataSize, true); // Data chunk size

        return new Blob([combinedBuffer], { type: 'audio/wav' });
    };

    const handleDownload = async () => {
        if (!serverAvailable || isDownloading) return;

        setIsDownloading(true);
        setDownloadProgress(0);
        setError(null);

        try {
            const chunks = chunksRef.current;
            const audioBlobs = [];

            for (let i = 0; i < chunks.length; i++) {
                const blob = await generateChunkAudio(chunks[i]);
                audioBlobs.push(blob);
                setDownloadProgress(((i + 1) / chunks.length) * 100);
            }

            // Combine all audio chunks
            const combinedBlob = await combineWavBlobs(audioBlobs);

            if (combinedBlob) {
                // Create download link
                const url = URL.createObjectURL(combinedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audio_${Date.now()}.wav`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Download error:', err);
            setError(err.message || 'Download failed');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    if (!content) return null;

    // Server not available
    if (serverAvailable === false) {
        return (
            <div className="audio-player audio-player-error">
                <span style={{
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🔇 TTS server offline
                    <button
                        className="btn btn-ghost"
                        onClick={checkServer}
                        style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px' }}
                    >
                        Retry
                    </button>
                </span>
            </div>
        );
    }

    // Checking server
    if (serverAvailable === null) {
        return (
            <div className="audio-player">
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    Checking TTS server...
                </span>
            </div>
        );
    }

    return (
        <div className="audio-player">
            <div className="audio-controls">
                <button
                    className="audio-play-btn"
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    title={isLoading ? 'Loading...' : (isPlaying && !isPaused ? 'Pause' : 'Play')}
                >
                    {isLoading ? '⏳' : (isPlaying && !isPaused ? '⏸' : '▶')}
                </button>
                {isPlaying && (
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={handleStop}
                        title="Stop"
                    >
                        ⏹
                    </button>
                )}
            </div>

            <div className="audio-progress">
                <div
                    className="audio-progress-bar"
                    ref={progressRef}
                    onClick={handleProgressClick}
                >
                    <div
                        className="audio-progress-fill"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
                <span className="audio-time">
                    {totalChunks > 0 && isPlaying ? `${currentChunk + 1}/${totalChunks}` : formatTime(duration)}
                </span>
            </div>

            <button
                className="audio-speed"
                onClick={handleSpeedChange}
                title="Change speed"
            >
                {speed}x
            </button>

            <select
                className="audio-voice-select"
                value={selectedVoice}
                onChange={handleVoiceChange}
                title="Select voice"
            >
                {Object.entries(KOKORO_VOICES).map(([id, voice]) => (
                    <option key={id} value={id}>{voice.name}</option>
                ))}
            </select>

            <button
                className="btn btn-ghost btn-icon"
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
                title={isDownloading ? `Downloading ${Math.round(downloadProgress)}%` : 'Download full audio'}
                style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }}
            >
                {isDownloading ? `${Math.round(downloadProgress)}%` : '⬇️'}
            </button>

            <div className="audio-engine" title="Kokoro TTS">
                🎙️
            </div>

            {error && (
                <span className="audio-error" style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>
                    {error}
                </span>
            )}
        </div>
    );
}

export default TTSPlayer;
