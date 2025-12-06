import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAnalysisStore from '../stores/analysisStore';
import { formatDate, truncateText } from '../utils/storage';

function LibraryPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    const { analyses, deleteAnalysis } = useAnalysisStore();

    const filteredAnalyses = useMemo(() => {
        if (!searchQuery.trim()) return analyses;

        const lower = searchQuery.toLowerCase();
        return analyses.filter(a =>
            a.prompt.toLowerCase().includes(lower) ||
            (a.result?.title || '').toLowerCase().includes(lower)
        );
    }, [analyses, searchQuery]);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (confirm('Delete this analysis?')) {
            deleteAnalysis(id);
        }
    };

    const getDepthClass = (depth) => {
        return `analysis-tag depth-${depth}`;
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Library</h1>
                    <p className="page-subtitle">
                        {analyses.length} saved {analyses.length === 1 ? 'analysis' : 'analyses'}
                    </p>
                </div>
            </div>

            <div className="page-content">
                {/* Search and View Toggle */}
                <div className="flex items-center gap-md mb-xl">
                    <div className="flex-1">
                        <input
                            type="text"
                            className="input"
                            placeholder="Search analyses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ maxWidth: '400px' }}
                        />
                    </div>
                    <div className="flex gap-sm">
                        <button
                            className={`btn btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            ⊞
                        </button>
                        <button
                            className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            ☰
                        </button>
                    </div>
                </div>

                {/* Empty State */}
                {analyses.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📚</div>
                        <h3 className="empty-state-title">No analyses yet</h3>
                        <p>Start by creating your first deep analysis</p>
                        <button
                            className="btn btn-primary mt-lg"
                            onClick={() => navigate('/')}
                        >
                            ✨ New Analysis
                        </button>
                    </div>
                )}

                {/* No Results */}
                {analyses.length > 0 && filteredAnalyses.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3 className="empty-state-title">No matches found</h3>
                        <p>Try a different search term</p>
                    </div>
                )}

                {/* Analysis Grid */}
                {filteredAnalyses.length > 0 && (
                    <div className={viewMode === 'grid' ? 'analysis-grid' : ''}>
                        {filteredAnalyses.map(analysis => (
                            <div
                                key={analysis.id}
                                className={`analysis-card slide-up ${viewMode === 'list' ? 'mb-md' : ''}`}
                                onClick={() => navigate(`/analysis/${analysis.id}`)}
                                style={viewMode === 'list' ? { display: 'flex', gap: 'var(--space-lg)' } : {}}
                            >
                                <div className="analysis-card-header" style={viewMode === 'list' ? { flex: 1, marginBottom: 0 } : {}}>
                                    <h3 className="analysis-card-title">
                                        {analysis.result?.title || truncateText(analysis.prompt, 50)}
                                    </h3>
                                    <span className="analysis-card-date">
                                        {formatDate(analysis.createdAt)}
                                    </span>
                                </div>

                                {viewMode === 'grid' && (
                                    <p className="analysis-card-preview">
                                        {truncateText(analysis.prompt, 120)}
                                    </p>
                                )}

                                <div className="analysis-card-footer" style={viewMode === 'list' ? { marginLeft: 'auto' } : {}}>
                                    <span className={getDepthClass(analysis.depth)}>
                                        {analysis.depth}
                                    </span>
                                    {analysis.result?.meta && (
                                        <span className="analysis-tag">
                                            {analysis.result.meta.tasksCompleted} agents
                                        </span>
                                    )}
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={(e) => handleDelete(e, analysis.id)}
                                        style={{ marginLeft: 'auto' }}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default LibraryPage;
