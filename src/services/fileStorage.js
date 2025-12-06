// File Storage Service - Uses File System Access API for real filesystem storage
// Provides persistent storage in a user-selected directory

const ANALYSES_DIR = 'analyses';
const SETTINGS_FILE = 'settings.json';
const HANDLE_KEY = 'deepmind_folder_handle';

let rootHandle = null;
let analysesHandle = null;

/**
 * Request permission to access a directory
 * @param {FileSystemDirectoryHandle} handle
 * @returns {Promise<boolean>}
 */
async function verifyPermission(handle) {
    const options = { mode: 'readwrite' };

    // Check if we already have permission
    if ((await handle.queryPermission(options)) === 'granted') {
        return true;
    }

    // Request permission
    if ((await handle.requestPermission(options)) === 'granted') {
        return true;
    }

    return false;
}

/**
 * Store the directory handle in IndexedDB for persistence
 */
async function storeHandle(handle) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('deepmind-handles', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction('handles', 'readwrite');
            const store = tx.objectStore('handles');
            store.put(handle, HANDLE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieve the directory handle from IndexedDB
 */
async function retrieveHandle() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('deepmind-handles', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction('handles', 'readonly');
            const store = tx.objectStore('handles');
            const getRequest = store.get(HANDLE_KEY);
            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => reject(getRequest.error);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Check if File System Access API is available
 */
export function isFileSystemAccessSupported() {
    return 'showDirectoryPicker' in window;
}

/**
 * Open a folder picker and set it as the storage location
 * @returns {Promise<string|null>} Folder name or null if cancelled
 */
export async function selectStorageFolder() {
    if (!isFileSystemAccessSupported()) {
        throw new Error('File System Access API not supported in this browser');
    }

    try {
        const handle = await window.showDirectoryPicker({
            id: 'deepmind-storage',
            mode: 'readwrite',
            startIn: 'documents'
        });

        rootHandle = handle;

        // Create analyses subdirectory
        analysesHandle = await rootHandle.getDirectoryHandle(ANALYSES_DIR, { create: true });

        // Store handle for persistence
        await storeHandle(handle);

        console.log('Storage folder selected:', handle.name);
        return handle.name;
    } catch (error) {
        if (error.name === 'AbortError') {
            return null; // User cancelled
        }
        throw error;
    }
}

/**
 * Initialize storage - try to restore previous folder selection
 */
export async function init() {
    if (rootHandle) return true;

    try {
        const savedHandle = await retrieveHandle();

        if (savedHandle) {
            const hasPermission = await verifyPermission(savedHandle);

            if (hasPermission) {
                rootHandle = savedHandle;
                analysesHandle = await rootHandle.getDirectoryHandle(ANALYSES_DIR, { create: true });
                console.log('Restored storage folder:', rootHandle.name);
                return true;
            }
        }
    } catch (error) {
        console.log('Could not restore storage folder:', error.message);
    }

    return false;
}

/**
 * Check if storage folder is configured
 */
export async function isStorageConfigured() {
    if (rootHandle) return true;
    return await init();
}

/**
 * Get the current storage folder name
 */
export function getStorageFolderName() {
    return rootHandle?.name || null;
}

/**
 * Save an analysis to file storage
 * @param {Object} analysis - Analysis object to save
 */
export async function saveAnalysis(analysis) {
    const isConfigured = await isStorageConfigured();

    if (!isConfigured || !analysesHandle) {
        // Fallback to localStorage if no folder selected
        console.warn('No storage folder selected, using localStorage fallback');
        const analyses = JSON.parse(localStorage.getItem('deepmind_analyses') || '[]');
        const index = analyses.findIndex(a => a.id === analysis.id);
        if (index >= 0) {
            analyses[index] = analysis;
        } else {
            analyses.unshift(analysis);
        }
        localStorage.setItem('deepmind_analyses', JSON.stringify(analyses));
        return;
    }

    try {
        const filename = `${analysis.id}.json`;
        const fileHandle = await analysesHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(analysis, null, 2));
        await writable.close();
        console.log('Saved analysis to filesystem:', filename);
    } catch (error) {
        console.error('Error saving analysis:', error);
        throw error;
    }
}

/**
 * Load all analyses from file storage
 * @returns {Promise<Array>} Array of analyses
 */
export async function loadAllAnalyses() {
    const isConfigured = await isStorageConfigured();

    if (!isConfigured || !analysesHandle) {
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('deepmind_analyses') || '[]');
    }

    try {
        const analyses = [];

        for await (const [name, handle] of analysesHandle.entries()) {
            if (name.endsWith('.json')) {
                try {
                    const file = await handle.getFile();
                    const text = await file.text();
                    analyses.push(JSON.parse(text));
                } catch (err) {
                    console.error('Error reading file:', name, err);
                }
            }
        }

        // Sort by date, newest first
        analyses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log('Loaded', analyses.length, 'analyses from filesystem');
        return analyses;
    } catch (error) {
        console.error('Error loading analyses:', error);
        return [];
    }
}

/**
 * Load a single analysis by ID
 * @param {string} id - Analysis ID
 * @returns {Promise<Object|null>} Analysis object or null
 */
export async function loadAnalysis(id) {
    const isConfigured = await isStorageConfigured();

    if (!isConfigured || !analysesHandle) {
        const analyses = JSON.parse(localStorage.getItem('deepmind_analyses') || '[]');
        return analyses.find(a => a.id === id) || null;
    }

    try {
        const filename = `${id}.json`;
        const fileHandle = await analysesHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
    } catch (error) {
        return null;
    }
}

/**
 * Delete an analysis
 * @param {string} id - Analysis ID
 */
export async function deleteAnalysis(id) {
    const isConfigured = await isStorageConfigured();

    if (!isConfigured || !analysesHandle) {
        const analyses = JSON.parse(localStorage.getItem('deepmind_analyses') || '[]');
        const filtered = analyses.filter(a => a.id !== id);
        localStorage.setItem('deepmind_analyses', JSON.stringify(filtered));
        return;
    }

    try {
        const filename = `${id}.json`;
        await analysesHandle.removeEntry(filename);
        console.log('Deleted analysis from filesystem:', filename);
    } catch (error) {
        console.error('Error deleting analysis:', error);
    }
}

/**
 * Save settings
 * @param {Object} settings - Settings object
 */
export async function saveSettings(settings) {
    const isConfigured = await isStorageConfigured();

    if (!isConfigured || !rootHandle) {
        localStorage.setItem('deepmind_settings', JSON.stringify(settings));
        return;
    }

    try {
        const fileHandle = await rootHandle.getFileHandle(SETTINGS_FILE, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(settings, null, 2));
        await writable.close();
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

/**
 * Load settings
 * @returns {Promise<Object>} Settings object
 */
export async function loadSettings() {
    const isConfigured = await isStorageConfigured();

    if (!isConfigured || !rootHandle) {
        return JSON.parse(localStorage.getItem('deepmind_settings') || '{}');
    }

    try {
        const fileHandle = await rootHandle.getFileHandle(SETTINGS_FILE);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
    } catch (error) {
        return {};
    }
}

/**
 * Get storage usage info
 * @returns {Promise<Object>} Storage info
 */
export async function getStorageInfo() {
    const isConfigured = await isStorageConfigured();

    if (!isConfigured) {
        const used = new Blob([localStorage.getItem('deepmind_analyses') || '']).size;
        return {
            used,
            type: 'localStorage',
            folderName: null,
            message: 'No folder selected - using localStorage fallback'
        };
    }

    try {
        let totalSize = 0;
        let fileCount = 0;

        for await (const [name, handle] of analysesHandle.entries()) {
            if (name.endsWith('.json')) {
                const file = await handle.getFile();
                totalSize += file.size;
                fileCount++;
            }
        }

        return {
            used: totalSize,
            type: 'filesystem',
            folderName: rootHandle.name,
            fileCount,
            message: `Storing in: ${rootHandle.name}/analyses/`
        };
    } catch (error) {
        return {
            used: 0,
            type: 'unknown',
            folderName: null,
            message: 'Error reading storage info'
        };
    }
}

/**
 * Export all analyses to a folder (for backup/migration)
 */
export async function exportAllAnalyses() {
    const analyses = await loadAllAnalyses();

    const handle = await window.showDirectoryPicker({
        id: 'deepmind-export',
        mode: 'readwrite',
        startIn: 'downloads'
    });

    for (const analysis of analyses) {
        const filename = `${analysis.id}.json`;
        const fileHandle = await handle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(analysis, null, 2));
        await writable.close();
    }

    return analyses.length;
}

export default {
    isFileSystemAccessSupported,
    selectStorageFolder,
    init,
    isStorageConfigured,
    getStorageFolderName,
    saveAnalysis,
    loadAllAnalyses,
    loadAnalysis,
    deleteAnalysis,
    saveSettings,
    loadSettings,
    getStorageInfo,
    exportAllAnalyses
};
