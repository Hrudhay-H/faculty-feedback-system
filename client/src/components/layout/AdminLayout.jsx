import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Analytics', path: '/admin/analytics', icon: '📈' },
    { name: 'Students', path: '/admin/students', icon: '🎓' },
    { name: 'Faculty', path: '/admin/faculty', icon: '👨‍🏫' },
    { name: 'Courses & Enrollments', path: '/admin/courses', icon: '📚' },
    { name: 'Evaluation Questions', path: '/admin/questions', icon: '📝' },
    { name: 'Feedback Windows', path: '/admin/windows', icon: '📅' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between">
        <div>
          {/* Brand Logo */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center space-x-2">
            <span className="text-xl">🏛️</span>
            <div>
              <span className="font-extrabold tracking-tight text-sm block">University Admin</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Control Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 flex flex-col space-y-2">
          <div className="px-2 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-bold truncate">{user?.name || 'Administrator'}</span>
              <span className="block text-[10px] text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-400 font-semibold text-[11px] py-2 rounded-lg transition-colors border border-slate-800"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            {navLinks.find((l) => l.path === location.pathname)?.name || 'Admin Panel'}
          </h2>
          <div className="text-xs text-slate-500">
            Academic Window: <span className="font-bold text-slate-700">Active</span>
          </div>
        </header>

        <div className="p-6 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
