import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Award, LogOut, Shield, Trophy, Menu, X, Sun, Moon, Home } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            EduRank
          </span>
        </Link>

        {/* Desktop Navigation — only on md+ screens */}
        {user && (
          <nav className="header-desktop-nav">
            <Link to="/" className="header-nav-link">Dashboard</Link>
            <Link to="/leaderboard" className="header-nav-link">
              <Award className="w-4 h-4 text-amber-400" /> Leaderboard
            </Link>
            {(user.role === 'admin' || user.role === 'teacher') && (
              <Link to="/admin" className="header-nav-link">
                <Shield className="w-4 h-4 text-emerald-400" />
                {user.role === 'teacher' ? 'Teacher Portal' : 'Admin'}
              </Link>
            )}
          </nav>
        )}

        {/* Right Actions */}
        {user ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* User name — desktop only */}
            <div className="header-user-info">
              <div className="text-xs font-bold text-slate-200 leading-tight">{user.name}</div>
              <div className="text-[10px] text-indigo-400">
                {user.role === 'student' ? user.collegeName || 'Student' : user.role === 'teacher' ? 'Faculty' : 'Admin'}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl glass-card text-slate-300 hover:text-yellow-400 transition-colors"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout button — ALWAYS VISIBLE */}
            <button
              onClick={handleLogout}
              className="header-logout-btn"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="header-logout-text">Logout</span>
            </button>

            {/* Hamburger for mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="header-hamburger"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/login" className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1.5">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {user && mobileMenuOpen && (
        <div className="header-mobile-menu">
          {/* User Card */}
          <div className="px-3 py-2.5 mb-2 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="font-bold text-white text-sm">{user.name}</div>
            <div className="text-xs text-indigo-400 mt-0.5">
              {user.role === 'student' ? user.collegeName || 'Student' : user.role === 'teacher' ? 'Faculty Teacher' : 'System Admin'}
            </div>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              {user.role}
            </span>
          </div>

          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="header-mobile-link">
            <Home className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="header-mobile-link">
            <Award className="w-4 h-4 text-amber-400" /> Leaderboard
          </Link>
          {(user.role === 'admin' || user.role === 'teacher') && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="header-mobile-link">
              <Shield className="w-4 h-4 text-emerald-400" />
              {user.role === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}
            </Link>
          )}

          <div className="border-t border-slate-800 mt-2 pt-2">
            <button onClick={toggleTheme} className="header-mobile-link w-full">
              {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
            <button onClick={handleLogout} className="header-mobile-link header-mobile-logout w-full">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
