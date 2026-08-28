import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function FacultyLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Overview', path: '/faculty/dashboard', icon: '📊' },
    { name: 'My Courses', path: '/faculty/courses', icon: '📚' },
    { name: 'Analytics', path: '/faculty/analytics', icon: '📈' },
    { name: 'Comments', path: '/faculty/comments', icon: '💬' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-violet-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👨‍🏫</span>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight">Faculty Portal</h1>
              <p className="text-[10px] text-violet-300 -mt-0.5">Teaching Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <span className="block text-xs font-bold">{user?.name}</span>
              <span className="block text-[9px] text-violet-300">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-violet-800 hover:bg-rose-900 hover:text-rose-100 text-violet-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-violet-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Nav Sub-header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex space-x-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`py-3.5 border-b-2 text-xs font-bold tracking-wide transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  );
}

export default FacultyLayout;
