import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import AnalysisPage from './pages/AnalysisPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import EduVizPage from './pages/EduVizPage';
import useSettingsStore from './stores/settingsStore';
import useAnalysisStore from './stores/analysisStore';

function App() {
    const { isConfigured } = useSettingsStore();
    const initializeStore = useAnalysisStore(state => state.initializeStore);

    // Initialize file storage on app load
    useEffect(() => {
        initializeStore();
    }, [initializeStore]);

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<AnalysisPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/eduviz" element={<EduVizPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/analysis/:id" element={<AnalysisPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;

