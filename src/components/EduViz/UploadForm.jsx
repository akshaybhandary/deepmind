import { useState } from 'react';
import { motion } from 'framer-motion';

export default function UploadForm({ onUpload }) {
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [audience, setAudience] = useState('High School Student');
    const [style, setStyle] = useState('Scientific Illustration');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/upload/text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, title, audience, style })
            });
            const data = await response.json();
            onUpload(data);
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto p-6 bg-surface-card rounded-xl border border-border-subtle shadow-lg"
        >
            <h2 className="text-2xl font-bold mb-6 text-text-primary">Create Visual Textbook</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Book Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 rounded-lg bg-surface-hover border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        placeholder="e.g., Understanding Mitosis"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Target Audience</label>
                    <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="w-full p-2 rounded-lg bg-surface-hover border border-border-subtle outline-none"
                    >
                        <option>5th Grader</option>
                        <option>High School Student</option>
                        <option>College Student</option>
                        <option>Layman</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Visual Style</label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full p-2 rounded-lg bg-surface-hover border border-border-subtle outline-none"
                    >
                        <option>Scientific Illustration</option>
                        <option>Pixar 3D Style</option>
                        <option>Hand Drawn Sketch</option>
                        <option>Minimalist Vector</option>
                        <option>Watercolor</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Content (Paste Text)</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full p-2 h-40 rounded-lg bg-surface-hover border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                        placeholder="Paste your educational text here..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin">⏳</span> Processing...
                        </>
                    ) : (
                        <>
                            ✨ Generate Visual Textbook
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
}
