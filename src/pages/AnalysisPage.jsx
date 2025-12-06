import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import useAnalysisStore from '../stores/analysisStore';
import useSettingsStore from '../stores/settingsStore';
import backgroundRunner from '../services/backgroundRunner';
import { DEPTH_LEVELS, AGENT_TYPES } from '../utils/constants';
import TTSPlayer from '../components/AudioPlayer/TTSPlayer';

function AnalysisPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [depth, setDepth] = useState('standard');

    const { apiKey } = useSettingsStore();
    const {
        currentAnalysis,
        isAnalyzing,
        progress,
        agentStates,
        currentAgent,
        loadAnalysis,
        clearCurrentAnalysis
    } = useAnalysisStore();

    // Load saved analysis if ID provided
    useEffect(() => {
        if (id) {
            loadAnalysis(id);
        } else {
            clearCurrentAnalysis();
        }
    }, [id]);

    const handleAnalyze = () => {
        if (!prompt.trim() || !apiKey) {
            if (!apiKey) navigate('/settings');
            return;
        }

        // Start analysis in background - continues even if user navigates away
        backgroundRunner.startAnalysis(prompt, depth);
    };

    const handleCancel = () => {
        backgroundRunner.cancel();
        clearCurrentAnalysis();
    };

    const handleNewAnalysis = () => {
        clearCurrentAnalysis();
        setPrompt('');
        navigate('/');
    };

    // Render completed analysis
    if (currentAnalysis?.status === 'complete' && currentAnalysis.result) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">{currentAnalysis.result.title}</h1>
                        <p className="results-meta">
                            {new Date(currentAnalysis.completedAt).toLocaleDateString('en-US', {
                                month: 'long', day: 'numeric', year: 'numeric'
                            })} • {currentAnalysis.depth.charAt(0).toUpperCase() + currentAnalysis.depth.slice(1)} depth • {currentAnalysis.result.meta.tasksCompleted} agents used
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={async () => {
                                const { exportAsPDF } = await import('../utils/export');
                                await exportAsPDF({
                                    prompt: currentAnalysis.prompt,
                                    depth: currentAnalysis.depth,
                                    createdAt: currentAnalysis.completedAt,
                                    result: currentAnalysis.result.content
                                });
                            }}
                            title="Download as PDF"
                        >
                            📄 Save PDF
                        </button>
                        <button className="btn btn-primary" onClick={handleNewAnalysis}>
                            ✨ New Analysis
                        </button>
                    </div>
                </div>

                <div className="page-content">
                    <TTSPlayer content={currentAnalysis.result.content} />

                    <div className="results-container mt-lg">
                        <div
                            className="results-content markdown-content"
                            dangerouslySetInnerHTML={{ __html: marked(currentAnalysis.result.content) }}
                        />
                    </div>

                    {/* Agent Work Sections */}
                    <div className="mt-xl">
                        <h3 style={{ marginBottom: 'var(--space-lg)' }}>🔍 Agent Work Details</h3>
                        {currentAnalysis.result.tasks?.map((task, index) => (
                            <details key={task.id} className="collapsible mb-md">
                                <summary className="collapsible-header">
                                    <span className="collapsible-title">
                                        <span>{AGENT_TYPES[task.type]?.icon || '📋'}</span>
                                        <span>{task.title}</span>
                                    </span>
                                    <span className="collapsible-icon">▼</span>
                                </summary>
                                <div className="collapsible-content markdown-content">
                                    {task.result && (
                                        <div dangerouslySetInnerHTML={{ __html: marked(task.result) }} />
                                    )}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Deep Analysis</h1>
                    <p className="page-subtitle">Transform any topic into comprehensive insights</p>
                </div>
            </div>

            <div className="page-content">
                {/* Input Section */}
                {!isAnalyzing && !currentAnalysis?.status && (
                    <div className="slide-up">
                        <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                            <div className="input-group mb-lg">
                                <label className="input-label">What would you like to explore?</label>
                                <textarea
                                    className="input textarea textarea-large"
                                    placeholder="e.g., How to become a better negotiator in business deals, or Research the latest advances in renewable energy..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.metaKey) handleAnalyze();
                                    }}
                                />
                            </div>

                            <div className="mb-lg">
                                <label className="input-label mb-sm" style={{ display: 'block' }}>
                                    Analysis Depth
                                </label>
                                <div className="depth-selector">
                                    {DEPTH_LEVELS.map(level => (
                                        <button
                                            key={level.id}
                                            className={`depth-option ${depth === level.id ? 'active' : ''}`}
                                            onClick={() => setDepth(level.id)}
                                        >
                                            <div>{level.name}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>
                                                {level.estimatedTime}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleAnalyze}
                                disabled={!prompt.trim() || !apiKey}
                                style={{ width: '100%' }}
                            >
                                {!apiKey ? '🔑 Add API Key First' : '🚀 Analyze'}
                            </button>

                            {!apiKey && (
                                <p className="text-center text-secondary mt-md" style={{ fontSize: 'var(--font-size-sm)' }}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
                                        Configure your OpenRouter API key
                                    </a> to start analyzing
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Analysis in Progress */}
                {isAnalyzing && (
                    <div className="slide-up">
                        <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
                            <div className="mb-lg">
                                <h3 style={{ marginBottom: 'var(--space-sm)' }}>Analyzing: {prompt.slice(0, 60)}...</h3>
                                <div className="progress-container">
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="progress-text">{progress}%</span>
                                </div>
                            </div>

                            <div className="stagger">
                                {Object.entries(AGENT_TYPES).map(([key, agent]) => {
                                    const state = agentStates[key];
                                    const isActive = currentAgent === key;
                                    const isComplete = state?.status === 'complete';

                                    return (
                                        <div
                                            key={key}
                                            className={`agent-card ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''} slide-in`}
                                        >
                                            <div className={`agent-icon ${agent.color}`}>
                                                {agent.icon}
                                            </div>
                                            <div className="agent-content">
                                                <div className="agent-name">{agent.name}</div>
                                                <div className={`agent-status ${isActive ? 'streaming' : ''}`}>
                                                    {state?.message || (isActive ? 'Working...' : 'Waiting...')}
                                                </div>
                                            </div>
                                            <div className={`status-indicator ${state?.status || 'pending'}`} />
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                className="btn btn-secondary mt-lg"
                                onClick={handleCancel}
                                style={{ width: '100%' }}
                            >
                                Cancel Analysis
                            </button>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {currentAnalysis?.status === 'error' && (
                    <div className="glass-card slide-up" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>❌</div>
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>Analysis Failed</h3>
                        <p className="text-secondary mb-md">{currentAnalysis.error}</p>
                        <p className="text-secondary mb-lg" style={{ fontSize: 'var(--font-size-sm)', opacity: 0.7 }}>
                            Tip: Check browser console (F12) for detailed error information.
                            {currentAnalysis.error?.includes('empty') || currentAnalysis.error?.includes('no content') ? (
                                <><br />This may be a temporary API issue. Try again or reduce the depth level.</>
                            ) : null}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    // Retry with the same prompt and depth
                                    const savedPrompt = currentAnalysis.prompt;
                                    const savedDepth = currentAnalysis.depth;
                                    clearCurrentAnalysis();
                                    setPrompt(savedPrompt);
                                    setDepth(savedDepth);
                                    // Auto-start after a brief delay to let state update
                                    setTimeout(() => {
                                        backgroundRunner.startAnalysis(savedPrompt, savedDepth);
                                    }, 100);
                                }}
                            >
                                🔄 Retry Analysis
                            </button>
                            <button className="btn btn-secondary" onClick={handleNewAnalysis}>
                                Start Fresh
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnalysisPage;
