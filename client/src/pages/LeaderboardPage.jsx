import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Award, Building, Search, Filter, Sparkles, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCollege]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const endpoint = selectedCollege
        ? `/leaderboard?college=${encodeURIComponent(selectedCollege)}`
        : '/leaderboard';
      const res = await apiFetch(endpoint);
      if (res.success) {
        setLeaderboard(res.leaderboard);
        if (res.availableColleges) {
          setColleges(res.availableColleges);
        }
      }
    } catch (err) {
      console.error('Fetch leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter(
    (item) =>
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.collegeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = filteredLeaderboard.slice(0, 3);
  const remaining = filteredLeaderboard.slice(3);

  return (
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl text-center relative overflow-hidden border border-amber-500/20 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Inter-College Rankings
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Student Leaderboard</h1>
        <p className="text-xs text-slate-300 mt-1">
          Compete with top students across colleges & universities
        </p>

        {/* Search & College Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student or college name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          {/* College Filter Pill Bar */}
          <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCollege('')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                selectedCollege === ''
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                  : 'glass-card text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              🌐 Global
            </button>
            {colleges.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCollege(c)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  selectedCollege === c
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                    : 'glass-card text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                🎓 {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Updating Leaderboard Ranks...</div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="podium-2 p-5 rounded-3xl text-center flex flex-col items-center justify-between order-2 sm:order-1">
                  <div className="w-10 h-10 rounded-full bg-slate-400/20 text-slate-300 font-black text-sm flex items-center justify-center mb-2 border border-slate-400/40">
                    #2
                  </div>
                  <h3 className="font-bold text-white text-sm">{top3[1].studentName}</h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate max-w-full">{top3[1].collegeName}</p>
                  <div className="mt-3 text-lg font-black text-slate-200">{top3[1].score} pts</div>
                </div>
              )}

              {/* 1st Place Champion */}
              {top3[0] && (
                <div className="podium-1 p-6 rounded-3xl text-center flex flex-col items-center justify-between order-1 sm:order-2 shadow-2xl scale-105">
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-300 font-black text-base flex items-center justify-center mb-2 border border-amber-400/50 animate-bounce">
                    👑 #1
                  </div>
                  <h3 className="font-extrabold text-white text-base">{top3[0].studentName}</h3>
                  <p className="text-xs text-amber-300/80 font-semibold truncate max-w-full">{top3[0].collegeName}</p>
                  <div className="mt-3 text-2xl font-black text-amber-400">{top3[0].score} pts</div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="podium-3 p-5 rounded-3xl text-center flex flex-col items-center justify-between order-3">
                  <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-500 font-black text-sm flex items-center justify-center mb-2 border border-amber-700/40">
                    #3
                  </div>
                  <h3 className="font-bold text-white text-sm">{top3[2].studentName}</h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate max-w-full">{top3[2].collegeName}</p>
                  <div className="mt-3 text-lg font-black text-amber-500">{top3[2].score} pts</div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Table List */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
            <div className="p-4 bg-slate-900/60 font-bold text-xs text-slate-400 grid grid-cols-12 gap-2 border-b border-slate-800">
              <div className="col-span-2 sm:col-span-1">Rank</div>
              <div className="col-span-6 sm:col-span-5">Student & College</div>
              <div className="col-span-2 text-right">Score</div>
              <div className="col-span-2 sm:col-span-4 text-right">Accuracy</div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredLeaderboard.map((item) => {
                const isCurrentUser = user && user._id === item.studentId.toString();
                return (
                  <div
                    key={item.studentId}
                    className={`p-4 grid grid-cols-12 gap-2 items-center text-xs font-semibold transition-colors ${
                      isCurrentUser ? 'bg-indigo-600/20 border-l-4 border-l-indigo-500' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 font-black text-slate-300">
                      #{item.rank}
                    </div>
                    <div className="col-span-6 sm:col-span-5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{item.studentName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500 text-white">You</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">{item.collegeName}</div>
                    </div>
                    <div className="col-span-2 text-right font-black text-amber-400 text-sm">
                      {item.score}
                    </div>
                    <div className="col-span-2 sm:col-span-4 text-right text-emerald-400 font-bold">
                      {item.accuracy}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
