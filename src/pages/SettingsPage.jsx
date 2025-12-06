import { useState, useEffect } from 'react';
import useSettingsStore from '../stores/settingsStore';
import { testApiKey } from '../services/openrouter';
import { MODELS, AGENT_TYPES } from '../utils/constants';
import {
    selectStorageFolder,
    isStorageConfigured,
    getStorageFolderName,
    getStorageInfo,
    isFileSystemAccessSupported
} from '../services/fileStorage';
import useAnalysisStore from '../stores/analysisStore';

function SettingsPage() {
    const {
        apiKey,
        setApiKey,
        modelAssignments,
        setModelAssignment,
        resetModelAssignments
    } = useSettingsStore();

    const { refreshAnalyses } = useAnalysisStore();

    const [inputKey, setInputKey] = useState(apiKey);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Storage state
    const [storageInfo, setStorageInfo] = useState(null);
    const [selectingFolder, setSelectingFolder] = useState(false);

    // Load storage info on mount
    useEffect(() => {
        loadStorageInfo();
    }, []);

    const loadStorageInfo = async () => {
        const info = await getStorageInfo();
        setStorageInfo(info);
    };

    const handleSelectFolder = async () => {
        setSelectingFolder(true);
        try {
            const folderName = await selectStorageFolder();
            if (folderName) {
                await loadStorageInfo();
                // Refresh analyses to load from new folder
                await refreshAnalyses();
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
            alert('Error selecting folder: ' + error.message);
        } finally {
            setSelectingFolder(false);
        }
    };

    const handleTestKey = async () => {
        if (!inputKey.trim()) return;

        setTesting(true);
        setTestResult(null);

        try {
            const valid = await testApiKey(inputKey);
            setTestResult(valid ? 'success' : 'error');
            if (valid) {
                setApiKey(inputKey);
            }
        } catch (error) {
            setTestResult('error');
        } finally {
            setTesting(false);
        }
    };

    const handleSaveKey = () => {
        setApiKey(inputKey);
        setTestResult('saved');
        setTimeout(() => setTestResult(null), 2000);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Configure your API key, storage, and model preferences</p>
                </div>
            </div>

            <div className="page-content">
                {/* Storage Section */}
                <div className="settings-section">
                    <h2 className="settings-section-title">📁 Storage Location</h2>

                    <div className="storage-info" style={{
                        background: 'var(--color-bg-tertiary)',
                        padding: 'var(--space-lg)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-lg)'
                    }}>
                        {storageInfo ? (
                            <>
                                <div className="flex items-center gap-md mb-md">
                                    <span style={{ fontSize: '1.5rem' }}>
                                        {storageInfo.type === 'filesystem' ? '✅' : '⚠️'}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                            {storageInfo.type === 'filesystem'
                                                ? `Saving to: ${storageInfo.folderName}/analyses/`
                                                : 'No folder selected - using browser storage'
                                            }
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                                            {storageInfo.type === 'filesystem'
                                                ? `${storageInfo.fileCount || 0} analyses • ${formatBytes(storageInfo.used)}`
                                                : 'Data may be lost if browser cache is cleared'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <span className="spinner" />
                        )}
                    </div>

                    <div className="flex gap-md">
                        {isFileSystemAccessSupported() ? (
                            <button
                                className="btn btn-primary"
                                onClick={handleSelectFolder}
                                disabled={selectingFolder}
                            >
                                {selectingFolder ? (
                                    <>
                                        <span className="spinner" />
                                        Selecting...
                                    </>
                                ) : (
                                    <>📂 {storageInfo?.type === 'filesystem' ? 'Change Folder' : 'Select Storage Folder'}</>
                                )}
                            </button>
                        ) : (
                            <p className="text-error" style={{ fontSize: 'var(--font-size-sm)' }}>
                                ⚠️ Your browser doesn't support filesystem access. Try Chrome or Edge.
                            </p>
                        )}
                    </div>

                    <p className="text-secondary mt-md" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Select a folder where your analyses will be saved as JSON files.
                        These files persist even if you clear your browser data.
                    </p>
                </div>

                {/* API Key Section */}
                <div className="settings-section">
                    <h2 className="settings-section-title">🔑 OpenRouter API Key</h2>

                    <div className="input-group">
                        <label className="input-label">API Key</label>
                        <div className="flex gap-md">
                            <input
                                type="password"
                                className="input flex-1"
                                placeholder="sk-or-v1-..."
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={handleTestKey}
                                disabled={testing || !inputKey.trim()}
                            >
                                {testing ? (
                                    <>
                                        <span className="spinner" />
                                        Testing...
                                    </>
                                ) : 'Test'}
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveKey}
                                disabled={!inputKey.trim()}
                            >
                                Save
                            </button>
                        </div>

                        {testResult && (
                            <p
                                className={`mt-sm ${testResult === 'success' || testResult === 'saved' ? 'text-success' : 'text-error'}`}
                                style={{ fontSize: 'var(--font-size-sm)' }}
                            >
                                {testResult === 'success' && '✓ API key is valid and saved!'}
                                {testResult === 'saved' && '✓ API key saved!'}
                                {testResult === 'error' && '✗ Invalid API key. Please check and try again.'}
                            </p>
                        )}

                        <p className="text-secondary mt-md" style={{ fontSize: 'var(--font-size-sm)' }}>
                            Get your API key from{' '}
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                                openrouter.ai/keys
                            </a>
                        </p>
                    </div>
                </div>

                {/* Model Configuration Section */}
                <div className="settings-section">
                    <div className="flex items-center justify-between mb-lg">
                        <h2 className="settings-section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                            🤖 Model Configuration
                        </h2>
                        <button
                            className="btn btn-ghost"
                            onClick={resetModelAssignments}
                        >
                            Reset to Defaults
                        </button>
                    </div>

                    <p className="text-secondary mb-lg" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Assign different AI models to each agent type for optimal performance
                    </p>

                    {Object.entries(AGENT_TYPES).map(([key, agent]) => (
                        <div key={key} className="settings-row">
                            <div>
                                <div className="settings-label">
                                    <span style={{ marginRight: 'var(--space-sm)' }}>{agent.icon}</span>
                                    {agent.name}
                                </div>
                                <p className="settings-description">{agent.description}</p>
                            </div>
                            <select
                                className="model-select"
                                value={modelAssignments[key]}
                                onChange={(e) => setModelAssignment(key, e.target.value)}
                            >
                                {MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name} ({model.provider})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* About Section */}
                <div className="settings-section">
                    <h2 className="settings-section-title">ℹ️ About</h2>
                    <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                        <strong>DeepMind</strong> is a multi-agent AI analysis platform that transforms complex topics
                        into comprehensive, structured insights. It uses a Coordinator-Worker-Synthesizer pattern
                        where specialized AI agents collaborate to research, analyze, critique, and synthesize
                        information into actionable knowledge.
                    </p>
                    <p className="text-secondary mt-md" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Powered by OpenRouter • 10 latest AI models • Built with React
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
