import { NavLink, useLocation } from 'react-router-dom';
import useSettingsStore from '../../stores/settingsStore';

function Sidebar() {
    const location = useLocation();
    const { apiKey } = useSettingsStore();

    const navItems = [
        { path: '/', icon: '✨', label: 'New Analysis' },
        { path: '/library', icon: '📚', label: 'Library' },
        { path: '/settings', icon: '⚙️', label: 'Settings' }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="50%" stopColor="#a78bfa" />
                                    <stop offset="100%" stopColor="#f472b6" />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#brainGrad)" opacity="0.2" />
                            <g stroke="url(#brainGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none">
                                <path d="M50 20 Q65 25 70 40 Q75 55 65 70 Q55 80 50 80 Q45 80 35 70 Q25 55 30 40 Q35 25 50 20" />
                                <path d="M40 35 Q50 30 60 35" />
                                <path d="M35 50 Q50 45 65 50" />
                                <path d="M40 65 Q50 60 60 65" />
                            </g>
                            <circle cx="50" cy="40" r="3" fill="url(#brainGrad)" />
                            <circle cx="40" cy="55" r="2" fill="url(#brainGrad)" />
                            <circle cx="60" cy="55" r="2" fill="url(#brainGrad)" />
                        </svg>
                    </div>
                    <span className="logo-text">DeepMind</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                {!apiKey ? (
                    <NavLink to="/settings" className="btn btn-secondary" style={{ width: '100%' }}>
                        <span>🔑</span>
                        <span>Add API Key</span>
                    </NavLink>
                ) : (
                    <div className="api-status" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)'
                    }}>
                        <span className="status-indicator complete" />
                        <span>API Connected</span>
                    </div>
                )}
            </div>
        </aside >
    );
}

export default Sidebar;
