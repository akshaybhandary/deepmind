import { useState } from 'react';
import UploadForm from '../components/EduViz/UploadForm';
import BookReader from '../components/EduViz/BookReader';

export default function EduVizPage() {
    const [activeBookId, setActiveBookId] = useState(null);

    return (
        <div className="h-full overflow-y-auto p-8">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        EduViz
                    </h1>
                    <p className="text-text-muted">Turn complex text into visual textbooks</p>
                </div>
                {activeBookId && (
                    <button
                        onClick={() => setActiveBookId(null)}
                        className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-surface-active transition-colors text-sm font-medium"
                    >
                        + New Book
                    </button>
                )}
            </header>

            {activeBookId ? (
                <BookReader bookId={activeBookId} />
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <UploadForm onUpload={(book) => setActiveBookId(book.id)} />

                    <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-4xl opacity-50">
                        <div className="p-4 bg-surface-card rounded-lg border border-border-subtle text-center">
                            <span className="text-2xl mb-2 block">📄</span>
                            <h3 className="font-medium">1. Upload Text</h3>
                            <p className="text-xs text-text-muted">Paste any educational content</p>
                        </div>
                        <div className="p-4 bg-surface-card rounded-lg border border-border-subtle text-center">
                            <span className="text-2xl mb-2 block">🧠</span>
                            <h3 className="font-medium">2. AI Simplifies</h3>
                            <p className="text-xs text-text-muted">Rewrites for better understanding</p>
                        </div>
                        <div className="p-4 bg-surface-card rounded-lg border border-border-subtle text-center">
                            <span className="text-2xl mb-2 block">🎨</span>
                            <h3 className="font-medium">3. Visual Learning</h3>
                            <p className="text-xs text-text-muted">Generates custom illustrations</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
