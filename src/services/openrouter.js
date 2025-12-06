// OpenRouter API Service
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
    const retryableMessages = [
        'network',
        'fetch',
        'timeout',
        'ECONNRESET',
        'ETIMEDOUT',
        'socket hang up',
        '429', // Rate limit
        '500', // Server error
        '502', // Bad gateway
        '503', // Service unavailable
        '504'  // Gateway timeout
    ];
    const errorStr = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorStr.includes(msg.toLowerCase()));
}

/**
 * Make a streaming completion request to OpenRouter with retry logic
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model ID
 * @param {Array} messages - Chat messages
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {AbortSignal} signal - Optional abort signal
 * @param {number} maxTokens - Max tokens (default 4096)
 * @returns {Promise<string>} Complete response text
 */
export async function streamCompletion(apiKey, model, messages, onChunk, signal, maxTokens = 4096) {
    let lastError;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            if (signal?.aborted) throw new Error('Analysis cancelled');

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'DeepMind Analysis'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: maxTokens
                }),
                signal
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errMsg = error.error?.message || `API error: ${response.status}`;

                // Check if we should retry
                if (response.status >= 500 || response.status === 429) {
                    throw new Error(`${response.status}: ${errMsg}`);
                }
                throw new Error(errMsg);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) {
                                    fullText += content;
                                    onChunk?.(content);
                                }
                            } catch (e) {
                                // Skip malformed JSON
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            return fullText;

        } catch (error) {
            lastError = error;

            // Don't retry if cancelled
            if (error.message === 'Analysis cancelled' || signal?.aborted) {
                throw error;
            }

            // Check if retryable
            if (isRetryableError(error) && attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
                console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms:`, error.message);
                await sleep(delay);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

/**
 * Make a non-streaming completion request with retry
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model ID
 * @param {Array} messages - Chat messages
 * @returns {Promise<string>} Response text
 */
export async function getCompletion(apiKey, model, messages) {
    let lastError;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'DeepMind Analysis'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 8192
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errMsg = error.error?.message || `API error: ${response.status}`;

                if (response.status >= 500 || response.status === 429) {
                    throw new Error(`${response.status}: ${errMsg}`);
                }
                throw new Error(errMsg);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';

        } catch (error) {
            lastError = error;

            if (isRetryableError(error) && attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
                console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms:`, error.message);
                await sleep(delay);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

/**
 * Test API key validity
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<boolean>} Whether the key is valid
 */
export async function testApiKey(apiKey) {
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'DeepMind Test'
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 1
            })
        });

        return response.ok;
    } catch {
        return false;
    }
}

