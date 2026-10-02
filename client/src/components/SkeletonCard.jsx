import React from 'react';
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-800 animate-pulse space-y-3">
      <div className="skeleton-line w-3/4 h-4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${70 + (i % 3) * 10}%` }}></div>
      ))}
    </div>
  );
}
