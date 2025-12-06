// OpenRouter model configurations - Updated December 2025
export const MODELS = [
    {
        id: 'anthropic/claude-opus-4.5',
        name: 'Claude Opus 4.5',
        provider: 'Anthropic',
        type: 'analysis',
        description: 'Frontier reasoning, agentic workflows'
    },
    {
        id: 'openai/gpt-5.1',
        name: 'GPT-5.1',
        provider: 'OpenAI',
        type: 'creative',
        description: 'Latest frontier model, enhanced reasoning'
    },
    {
        id: 'google/gemini-3-pro-preview',
        name: 'Gemini 3 Pro Preview',
        provider: 'Google',
        type: 'reasoning',
        description: 'Flagship multimodal, 1M context'
    },
    {
        id: 'meta-llama/llama-4-scout',
        name: 'Llama 4 Scout',
        provider: 'Meta',
        type: 'expansion',
        description: 'Multimodal, 10M context window'
    },
    {
        id: 'meta-llama/llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'Meta',
        type: 'general',
        description: 'MoE architecture, 1M context'
    },
    {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        provider: 'Anthropic',
        type: 'analysis',
        description: 'Fast and capable analysis'
    },
    {
        id: 'openai/gpt-5-pro',
        name: 'GPT-5 Pro',
        provider: 'OpenAI',
        type: 'reasoning',
        description: 'Complex tasks, step-by-step reasoning'
    },
    {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        type: 'general',
        description: 'Fast workhorse with 1M context'
    },
    {
        id: 'mistralai/mistral-large-2411',
        name: 'Mistral Large',
        provider: 'Mistral',
        type: 'general',
        description: 'Latest Mistral flagship'
    },
    {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3',
        provider: 'DeepSeek',
        type: 'general',
        description: 'Strong open-weight model'
    }
];

// Depth level configurations
export const DEPTH_LEVELS = [
    {
        id: 'quick',
        name: 'Quick',
        description: 'High-level overview',
        taskCount: { min: 2, max: 3 },
        detailLevel: 'brief',
        estimatedTime: '~30s'
    },
    {
        id: 'standard',
        name: 'Standard',
        description: 'Balanced analysis',
        taskCount: { min: 3, max: 4 },
        detailLevel: 'moderate',
        estimatedTime: '~1min'
    },
    {
        id: 'deep',
        name: 'Deep',
        description: 'Comprehensive research',
        taskCount: { min: 4, max: 6 },
        detailLevel: 'detailed',
        estimatedTime: '~2min'
    },
    {
        id: 'exhaustive',
        name: 'Exhaustive',
        description: 'Maximum depth',
        taskCount: { min: 10, max: 15 },
        detailLevel: 'exhaustive',
        estimatedTime: '~8-10min'
    },
    {
        id: 'book',
        name: 'Book',
        description: 'Book-length treatise',
        taskCount: { min: 20, max: 30 },
        detailLevel: 'book',
        estimatedTime: '~15-20min'
    }
];

// Agent types and their default models
export const AGENT_TYPES = {
    coordinator: {
        name: 'Coordinator',
        icon: '🧭',
        description: 'Analyzes prompts and creates task plans',
        defaultModel: 'anthropic/claude-opus-4.5',
        color: 'coordinator'
    },
    researcher: {
        name: 'Researcher',
        icon: '🔍',
        description: 'Gathers information and explores topics',
        defaultModel: 'google/gemini-3-pro-preview',
        color: 'researcher'
    },
    analyst: {
        name: 'Analyst',
        icon: '📊',
        description: 'Deep dives and finds patterns',
        defaultModel: 'openai/gpt-5.1',
        color: 'analyst'
    },
    critic: {
        name: 'Critic',
        icon: '🎯',
        description: 'Challenges assumptions and finds gaps',
        defaultModel: 'anthropic/claude-3.7-sonnet',
        color: 'critic'
    },
    expander: {
        name: 'Expander',
        icon: '🌱',
        description: 'Elaborates on points and adds details',
        defaultModel: 'meta-llama/llama-4-scout',
        color: 'expander'
    },
    synthesizer: {
        name: 'Synthesizer',
        icon: '✨',
        description: 'Combines outputs into cohesive results',
        defaultModel: 'anthropic/claude-opus-4.5',
        color: 'synthesizer'
    }
};

// Local storage keys
export const STORAGE_KEYS = {
    API_KEY: 'deepmind_api_key',
    ANALYSES: 'deepmind_analyses',
    SETTINGS: 'deepmind_settings'
};

// TTS speeds
export const TTS_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
