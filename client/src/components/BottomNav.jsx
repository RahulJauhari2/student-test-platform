import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Award, Shield, User } from 'lucide-react';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/leaderboard', icon: Award, label: 'Ranks' },
    ...(user.role === 'admin' || user.role === 'teacher' ? [{ to: '/admin', icon: Shield, label: 'Portal' }] : []),
  ];

  return (
    <nav className="bottom-nav md:hidden print:hidden">
      {links.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} className={`bottom-nav-item ${active ? 'bottom-nav-active' : ''}`}>
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
