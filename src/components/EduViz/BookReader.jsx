import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookReader({ bookId }) {
    const [book, setBook] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await fetch(`http://localhost:8000/books/${bookId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBook(data);
                }
            } catch (error) {
                console.error("Failed to fetch book:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
        // Poll for updates if processing
        const interval = setInterval(() => {
            fetchBook();
        }, 3000);

        return () => clearInterval(interval);
    }, [bookId]);

    if (loading) return <div className="text-center p-10">Loading book...</div>;
    if (!book) return <div className="text-center p-10">Book not found</div>;

    const pages = book.chapters.flatMap(c => c.pages);
    const page = pages[currentPage];

    if (!page && book.status === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="text-4xl animate-bounce">🎨</div>
                <h2 className="text-xl font-medium">Generating your visual textbook...</h2>
                <p className="text-text-muted">The AI is simplifying text and drawing illustrations.</p>
            </div>
        );
    }

    if (!page) return <div>No pages generated yet.</div>;

    return (
        <div className="max-w-6xl mx-auto h-[80vh] flex gap-8 p-6">
            {/* Left Page: Text */}
            <motion.div
                key={`text-${currentPage}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 bg-white text-gray-900 p-8 rounded-l-xl shadow-2xl overflow-y-auto font-serif leading-relaxed text-lg"
            >
                <div className="text-sm text-gray-500 mb-4 uppercase tracking-widest">
                    Page {currentPage + 1} • {book.title}
                </div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">
                    {book.chapters.find(c => c.pages.includes(page))?.title}
                </h3>
                <div className="prose prose-lg">
                    {page.simplified_text}
                </div>

                {page.key_terms && page.key_terms.length > 0 && (
                    <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <h4 className="font-bold text-yellow-800 text-sm uppercase mb-2">Key Terms</h4>
                        <div className="flex flex-wrap gap-2">
                            {page.key_terms.map(term => (
                                <span key={term} className="px-2 py-1 bg-yellow-100 text-yellow-900 text-xs rounded-full font-medium">
                                    {term}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Right Page: Image */}
            <motion.div
                key={`img-${currentPage}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 bg-gray-50 p-4 rounded-r-xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
            >
                {page.illustration ? (
                    <img
                        src={page.illustration.url}
                        alt="Illustration"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <span className="text-4xl mb-2">🖼️</span>
                        <span>Generating illustration...</span>
                    </div>
                )}

                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white disabled:opacity-50 transition-all text-gray-800 font-medium"
                    >
                        ← Previous
                    </button>
                    <span className="px-4 py-2 bg-black/50 backdrop-blur text-white rounded-full text-sm font-medium">
                        {currentPage + 1} / {pages.length}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                        disabled={currentPage === pages.length - 1}
                        className="px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white disabled:opacity-50 transition-all text-gray-800 font-medium"
                    >
                        Next →
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
