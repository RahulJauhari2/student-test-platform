import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Award, LogOut, Shield, User as UserIcon, BookOpen, Trophy, Menu, X, Sun, Moon } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            EduRank
          </span>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/leaderboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Leaderboard
            </Link>
            {(user.role === 'admin' || user.role === 'teacher') && (
              <Link to="/admin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                {user.role === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-2">
            {/* User info — desktop only */}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-200 leading-tight">{user.name}</div>
              <div className="text-xs text-indigo-400 font-medium">
                {user.role === 'student' ? user.collegeName || 'Student' : user.role === 'teacher' ? 'Faculty' : 'Admin'}
              </div>
            </div>
            {/* Role badge */}
            <span className="hidden sm:inline px-2.5 py-1 text-xs font-bold uppercase rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              {user.role}
            </span>
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-xl glass-card text-slate-300 hover:text-yellow-400 transition-colors" title={isDark ? 'Light Mode' : 'Dark Mode'}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Logout — always visible */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 border border-slate-700/50 transition-colors text-xs font-bold"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            {/* Mobile hamburger for nav links */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl glass-card text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-4 space-y-1">
          {/* User info on mobile */}
          <div className="px-3 py-2 mb-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="font-bold text-white text-sm">{user.name}</div>
            <div className="text-xs text-indigo-400 mt-0.5">
              {user.role === 'student' ? user.collegeName || 'Student' : user.role === 'teacher' ? 'Faculty Teacher' : 'System Admin'}
            </div>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold uppercase rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              {user.role}
            </span>
          </div>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            🏠 Dashboard
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Award className="w-4 h-4 text-amber-400" /> Leaderboard
          </Link>
          {(user.role === 'admin' || user.role === 'teacher') && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              {user.role === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </header>
  );
}
