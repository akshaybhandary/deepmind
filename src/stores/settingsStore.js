import { create } from 'zustand';
import { getSettings, saveSettings, getApiKey, saveApiKey } from '../utils/storage';
import { AGENT_TYPES, MODELS } from '../utils/constants';

// Build default model assignments from AGENT_TYPES
const getDefaultModelAssignments = () => {
    const assignments = {};
    Object.keys(AGENT_TYPES).forEach(type => {
        assignments[type] = AGENT_TYPES[type].defaultModel;
    });
    return assignments;
};

// Validate saved model assignments - ensure they use valid model IDs
const getValidModelAssignments = () => {
    const saved = getSettings().modelAssignments;
    if (!saved) return getDefaultModelAssignments();

    const validModelIds = MODELS.map(m => m.id);
    const defaults = getDefaultModelAssignments();
    const validated = {};

    Object.keys(AGENT_TYPES).forEach(type => {
        // Use saved model if valid, otherwise use default
        validated[type] = validModelIds.includes(saved[type]) ? saved[type] : defaults[type];
    });

    return validated;
};

const useSettingsStore = create((set, get) => ({
    // API Key
    apiKey: getApiKey() || '',

    // Model assignments per agent type (validated)
    modelAssignments: getValidModelAssignments(),

    // UI preferences
    sidebarOpen: true,

    // Actions
    setApiKey: (key) => {
        saveApiKey(key);
        set({ apiKey: key });
    },

    setModelAssignment: (agentType, modelId) => {
        const current = get().modelAssignments;
        const updated = { ...current, [agentType]: modelId };
        const settings = getSettings();
        saveSettings({ ...settings, modelAssignments: updated });
        set({ modelAssignments: updated });
    },

    resetModelAssignments: () => {
        const defaults = getDefaultModelAssignments();
        const settings = getSettings();
        saveSettings({ ...settings, modelAssignments: defaults });
        set({ modelAssignments: defaults });
    },

    toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
    },

    // Get model info by agent type
    getModelForAgent: (agentType) => {
        const modelId = get().modelAssignments[agentType];
        return MODELS.find(m => m.id === modelId) || MODELS[0];
    },

    // Check if API key is configured
    isConfigured: () => {
        return get().apiKey.length > 0;
    }
}));

export default useSettingsStore;
