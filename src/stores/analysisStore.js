import { create } from 'zustand';
import {
    saveAnalysis as saveToFile,
    loadAllAnalyses,
    loadAnalysis as loadFromFile,
    deleteAnalysis as deleteFromFile
} from '../services/fileStorage';
import { generateId } from '../utils/storage';

// Load analyses async on init
let initialAnalyses = [];

const useAnalysisStore = create((set, get) => ({
    // All saved analyses
    analyses: initialAnalyses,
    analysesLoaded: false,

    // Current analysis state
    currentAnalysis: null,

    // Analysis in progress state
    isAnalyzing: false,
    progress: 0,
    currentAgent: null,
    agentStates: {},
    streamingContent: '',

    // Initialize - load analyses from file storage
    initializeStore: async () => {
        if (get().analysesLoaded) return;

        try {
            const analyses = await loadAllAnalyses();
            set({ analyses, analysesLoaded: true });
        } catch (error) {
            console.error('Error loading analyses:', error);
            set({ analysesLoaded: true });
        }
    },

    // Actions

    // Start a new analysis
    startAnalysis: (prompt, depth) => {
        const analysis = {
            id: generateId(),
            prompt,
            depth,
            createdAt: new Date().toISOString(),
            status: 'running',
            result: null,
            agents: []
        };

        set({
            currentAnalysis: analysis,
            isAnalyzing: true,
            progress: 0,
            agentStates: {},
            streamingContent: ''
        });

        return analysis.id;
    },

    // Update agent state during analysis
    updateAgentState: (agentType, state) => {
        set(prev => ({
            agentStates: {
                ...prev.agentStates,
                [agentType]: state
            },
            currentAgent: state.status === 'running' ? agentType : prev.currentAgent
        }));
    },

    // Update streaming content
    appendStreamContent: (content) => {
        set(prev => ({
            streamingContent: prev.streamingContent + content
        }));
    },

    // Update progress
    setProgress: (progress) => {
        set({ progress });
    },

    // Complete analysis
    completeAnalysis: async (result) => {
        const current = get().currentAnalysis;
        if (!current) return;

        const completed = {
            ...current,
            status: 'complete',
            result,
            completedAt: new Date().toISOString()
        };

        // Save to file storage (async)
        try {
            await saveToFile(completed);
        } catch (error) {
            console.error('Error saving analysis:', error);
        }

        set(prev => ({
            currentAnalysis: completed,
            isAnalyzing: false,
            progress: 100,
            analyses: [completed, ...prev.analyses.filter(a => a.id !== completed.id)]
        }));

        return completed;
    },

    // Fail analysis
    failAnalysis: (error) => {
        const current = get().currentAnalysis;
        if (!current) return;

        const failed = {
            ...current,
            status: 'error',
            error: error.message || 'Analysis failed'
        };

        set({
            currentAnalysis: failed,
            isAnalyzing: false
        });
    },

    // Load a saved analysis
    loadAnalysis: async (id) => {
        // First check in-memory
        let analysis = get().analyses.find(a => a.id === id);

        // If not found, try loading from file
        if (!analysis) {
            analysis = await loadFromFile(id);
        }

        if (analysis) {
            set({
                currentAnalysis: analysis,
                isAnalyzing: false,
                progress: 100,
                agentStates: {},
                streamingContent: ''
            });
        }
        return analysis;
    },

    // Clear current analysis
    clearCurrentAnalysis: () => {
        set({
            currentAnalysis: null,
            isAnalyzing: false,
            progress: 0,
            agentStates: {},
            streamingContent: '',
            currentAgent: null
        });
    },

    // Delete analysis
    deleteAnalysis: async (id) => {
        await deleteFromFile(id);
        set(prev => ({
            analyses: prev.analyses.filter(a => a.id !== id),
            currentAnalysis: prev.currentAnalysis?.id === id ? null : prev.currentAnalysis
        }));
    },

    // Refresh analyses from storage
    refreshAnalyses: async () => {
        const analyses = await loadAllAnalyses();
        set({ analyses });
    },

    // Search analyses
    searchAnalyses: (query) => {
        const analyses = get().analyses;
        if (!query.trim()) return analyses;

        const lower = query.toLowerCase();
        return analyses.filter(a =>
            a.prompt.toLowerCase().includes(lower) ||
            (a.result?.title || '').toLowerCase().includes(lower)
        );
    }
}));

export default useAnalysisStore;

