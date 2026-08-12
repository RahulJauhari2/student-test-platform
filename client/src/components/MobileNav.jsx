import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Trophy, Shield, User } from 'lucide-react';

export default function MobileNav() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <nav className="mobile-bottom-nav md:hidden">
      <div className="flex items-center justify-around">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Trophy className="w-5 h-5" />
          <span>Ranks</span>
        </NavLink>

        {(user.role === 'admin' || user.role === 'teacher') && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Shield className="w-5 h-5" />
            <span>{user.role === 'teacher' ? 'Teacher' : 'Admin'}</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}
