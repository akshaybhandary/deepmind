// Background Analysis Runner
// Runs analyses in the background, persisting across navigation

import { runAnalysis } from './orchestrator';
import useAnalysisStore from '../stores/analysisStore';
import useSettingsStore from '../stores/settingsStore';

class BackgroundRunner {
    constructor() {
        this.activeAnalysis = null;
        this.abortController = null;
    }

    /**
     * Start a background analysis
     * @param {string} prompt - The prompt to analyze
     * @param {string} depth - Analysis depth
     * @returns {string} Analysis ID
     */
    startAnalysis(prompt, depth) {
        const store = useAnalysisStore.getState();
        const settings = useSettingsStore.getState();

        // Cancel any existing analysis
        this.cancel();

        // Start new analysis
        const analysisId = store.startAnalysis(prompt, depth);
        this.abortController = new AbortController();

        // Run in background (not awaited - runs independently)
        this.runInBackground(prompt, depth, settings.apiKey, settings.modelAssignments);

        return analysisId;
    }

    /**
     * Internal method to run analysis
     */
    async runInBackground(prompt, depth, apiKey, modelAssignments) {
        const store = useAnalysisStore.getState();

        try {
            await runAnalysis({
                apiKey,
                prompt,
                depth,
                modelAssignments,
                callbacks: {
                    onAgentStart: (type, status) => {
                        useAnalysisStore.getState().updateAgentState(type, {
                            status: 'running',
                            message: status
                        });
                    },
                    onAgentProgress: (type, content) => {
                        useAnalysisStore.getState().updateAgentState(type, {
                            status: 'running',
                            content
                        });
                    },
                    onAgentComplete: (type, message) => {
                        useAnalysisStore.getState().updateAgentState(type, {
                            status: 'complete',
                            message
                        });
                    },
                    onProgress: (p) => {
                        useAnalysisStore.getState().setProgress(p);
                    },
                    onComplete: (result) => {
                        useAnalysisStore.getState().completeAnalysis(result);
                        this.activeAnalysis = null;
                        this.abortController = null;
                    },
                    onError: (error) => {
                        useAnalysisStore.getState().failAnalysis(error);
                        this.activeAnalysis = null;
                        this.abortController = null;
                    }
                },
                signal: this.abortController.signal
            });
        } catch (error) {
            if (error.message !== 'Analysis cancelled') {
                console.error('Background analysis failed:', error);
                useAnalysisStore.getState().failAnalysis(error);
            }
            this.activeAnalysis = null;
            this.abortController = null;
        }
    }

    /**
     * Cancel the current analysis
     */
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
            this.activeAnalysis = null;
        }
    }

    /**
     * Check if analysis is running
     */
    isRunning() {
        return this.abortController !== null;
    }
}

// Singleton instance - persists across the app lifetime
export const backgroundRunner = new BackgroundRunner();

export default backgroundRunner;
