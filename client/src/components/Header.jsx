import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, LogOut, Shield, User as UserIcon, BookOpen, Trophy } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-4 py-3 print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              EduRank
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Mobile Test Hub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
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

        {/* User Badge & Actions */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-200">{user.name}</div>
              <div className="text-xs text-indigo-400 font-medium">
                {user.role === 'student' ? user.collegeName || 'Student' : user.role === 'teacher' ? 'Faculty Teacher' : 'System Admin'}
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700/50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
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
    </header>
  );
}
