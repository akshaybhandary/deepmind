import { STORAGE_KEYS } from './constants';

// Save data to localStorage
export function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

// Load data from localStorage
export function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// Remove data from localStorage
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// Save API key
export function saveApiKey(key) {
    return saveToStorage(STORAGE_KEYS.API_KEY, key);
}

// Get API key
export function getApiKey() {
    return loadFromStorage(STORAGE_KEYS.API_KEY, '');
}

// Save analysis
export function saveAnalysis(analysis) {
    const analyses = loadFromStorage(STORAGE_KEYS.ANALYSES, []);
    const existingIndex = analyses.findIndex(a => a.id === analysis.id);

    if (existingIndex >= 0) {
        analyses[existingIndex] = analysis;
    } else {
        analyses.unshift(analysis);
    }

    return saveToStorage(STORAGE_KEYS.ANALYSES, analyses);
}

// Get all analyses
export function getAnalyses() {
    return loadFromStorage(STORAGE_KEYS.ANALYSES, []);
}

// Get single analysis by ID
export function getAnalysisById(id) {
    const analyses = getAnalyses();
    return analyses.find(a => a.id === id) || null;
}

// Delete analysis
export function deleteAnalysis(id) {
    const analyses = getAnalyses();
    const filtered = analyses.filter(a => a.id !== id);
    return saveToStorage(STORAGE_KEYS.ANALYSES, filtered);
}

// Save settings
export function saveSettings(settings) {
    return saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

// Get settings
export function getSettings() {
    return loadFromStorage(STORAGE_KEYS.SETTINGS, {});
}

// Generate unique ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date
export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format time for audio player
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Truncate text
export function truncateText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}
