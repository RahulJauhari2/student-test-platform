import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import {
  BookOpen,
  Trophy,
  Clock,
  CheckCircle2,
  Award,
  Zap,
  Play,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Code,
  Calculator,
  Atom,
  Search,
  Flame,
  BarChart2,
  AlertTriangle,
  Sparkles,
  Target,
  FileText,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [gamificationStats, setGamificationStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [subjRes, resultsRes, statsRes] = await Promise.all([
        apiFetch('/tests/subjects'),
        apiFetch('/tests/results/my'),
        apiFetch('/tests/me/stats'),
      ]);

      if (subjRes.success) {
        setSubjects(subjRes.subjects);
        if (subjRes.subjects.length > 0) {
          setSelectedSubject(subjRes.subjects[0]._id);
        }
      }
      if (resultsRes.success) {
        setTestResults(resultsRes.results);
      }
      if (statsRes.success) {
        setGamificationStats(statsRes);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectIcon = (iconName) => {
    switch (iconName) {
      case 'Code':
        return <Code className="w-5 h-5" />;
      case 'Calculator':
        return <Calculator className="w-5 h-5" />;
      case 'Atom':
        return <Atom className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const calculateStats = () => {
    if (!testResults.length) return { avgAccuracy: 0, totalTests: 0, bestScore: 0, streakDays: 0, weakTopics: [] };
    const totalTests = testResults.length;
    const avgAccuracy = Math.round(
      testResults.reduce((acc, curr) => acc + (curr.accuracyPercentage || 0), 0) / totalTests
    );
    const bestScore = Math.max(...testResults.map((r) => r.score));
    const streakDays = Math.min(totalTests, 5);

    // Identify weak topics where accuracy < 60%
    const weakTopics = testResults.filter((r) => r.accuracyPercentage < 60);

    return { avgAccuracy, totalTests, bestScore, streakDays, weakTopics };
  };

  const stats = calculateStats();
  const currentSubjectObj = subjects.find((s) => s._id === selectedSubject);

  const filteredTopics = currentSubjectObj?.topics?.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-7xl mx-auto space-y-6">
      {/* Daily Motivational Quote */}
      {(() => {
        const quotes = [
          { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
          { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
          { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
          { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
          { text: "Learning is not attained by chance. It must be sought with ardor.", author: "Abigail Adams" },
          { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
          { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
        ];
        const todayQuote = quotes[new Date().getDate() % quotes.length];
        return (
          <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm text-slate-200 italic leading-relaxed">"{todayQuote.text}"</p>
              <p className="text-xs text-indigo-400 font-bold mt-1">— {todayQuote.author}</p>
            </div>
          </div>
        );
      })()}

      {/* Welcome Banner Card */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-indigo-500/20 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5" /> {user?.collegeName || 'Student Platform'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" /> {stats.streakDays} Day Streak!
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hello, {user?.name}! 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Ready to boost your ranking? Take subject and topic-wise tests to compete on the college & global leaderboards!
            </p>
          </div>

          <Link
            to="/leaderboard"
            className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> View Leaderboards
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="glass-card p-3 rounded-2xl text-center">
            <div className="text-xl sm:text-2xl font-black text-indigo-400">{stats.totalTests}</div>
            <div className="text-[11px] font-semibold text-slate-400">Tests Completed</div>
          </div>
          <div className="glass-card p-3 rounded-2xl text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">{stats.avgAccuracy}%</div>
            <div className="text-[11px] font-semibold text-slate-400">Avg Accuracy</div>
          </div>
          <div className="glass-card p-3 rounded-2xl text-center">
            <div className="text-xl sm:text-2xl font-black text-amber-400">{stats.bestScore}</div>
            <div className="text-[11px] font-semibold text-slate-400">High Score</div>
          </div>
        </div>
      </div>

      {/* Gamification Stats Panel */}
      {gamificationStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-xl font-black text-amber-400">{gamificationStats.xp}</div>
            <div className="text-xs text-slate-400 font-semibold">XP Points</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xl font-black text-purple-400">Level {gamificationStats.level}</div>
            <div className="text-xs text-slate-400 font-semibold">Your Level</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-orange-500/20 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-black text-orange-400">{gamificationStats.streak} days</div>
            <div className="text-xs text-slate-400 font-semibold">Daily Streak</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 text-center">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-xl font-black text-emerald-400">{gamificationStats.totalTests}</div>
            <div className="text-xs text-slate-400 font-semibold">Tests Taken</div>
          </div>
        </div>
      )}

      {/* Badges */}
      {gamificationStats && gamificationStats.badges.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">🎖️ Your Badges</h3>
          <div className="flex flex-wrap gap-2">
            {gamificationStats.badges.map((badge) => {
              const badgeMap = { first_test: '🎯 First Test', perfect_score: '💯 Perfect Score', week_streak: '🔥 7-Day Streak', month_streak: '⚡ 30-Day Streak', xp_500: '🌟 500 XP' };
              return <span key={badge} className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">{badgeMap[badge] || badge}</span>;
            })}
          </div>
        </div>
      )}

      {/* STUDENT PERSONALIZED STUDY RECOMMENDATIONS REPORT */}
      {stats.weakTopics.length > 0 && (
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-amber-950/10 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
            <Target className="w-5 h-5 text-amber-400" />
            <span>Personalized Study Recommendation Report</span>
          </div>

          <p className="text-xs text-slate-300">
            Based on your recent test results, here are topics where your accuracy was under 60%. Retake these tests to improve your rank:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {stats.weakTopics.map((w, idx) => (
              <div key={idx} className="p-3 rounded-2xl glass-card border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{w.topicName}</div>
                  <div className="text-[11px] text-amber-400 font-semibold">
                    Last Accuracy: {w.accuracyPercentage}% ({w.correctAnswers}/{w.totalQuestions} correct)
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/test/${w.topicId}`)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20"
                >
                  <Play className="w-3 h-3 fill-current" /> Retake
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject & Topic Selection */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Select Subject & Topic
          </h2>

          {/* Search Bar for Topics */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Loading Subjects...</div>
        ) : (
          <>
            {/* Subject Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {subjects.map((sub) => (
                <button
                  key={sub._id}
                  onClick={() => setSelectedSubject(sub._id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all ${
                    selectedSubject === sub._id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/25'
                      : 'glass-card text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {getSubjectIcon(sub.iconName)}
                  <span>{sub.name}</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/60 text-slate-300">
                    {sub.topics?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Subject's Topics Grid */}
            {currentSubjectObj && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredTopics?.map((topic) => (
                  <div
                    key={topic._id}
                    className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-indigo-500/40 flex flex-col justify-between group transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {currentSubjectObj.code}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> {topic.timeLimitMinutes} Mins
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                        {topic.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{topic.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{topic.questionCount} Questions</span>
                      <button
                        onClick={() => navigate(`/test/${topic._id}`)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all group-hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Start Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Test Attempts Section */}
      {testResults.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Recent Test Attempts & Scorecards
          </h2>
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 divide-y divide-slate-800/60">
            {testResults.slice(0, 5).map((res) => (
              <div key={res._id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                <div>
                  <div className="text-xs font-semibold text-indigo-400">{res.subjectName}</div>
                  <div className="font-bold text-sm text-white">{res.topicName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(res.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400">Score: {res.score}</div>
                    <div className="text-xs font-semibold text-slate-300">{res.accuracyPercentage}% Acc</div>
                  </div>
                  <Link
                    to={`/result/${res._id}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                    title="View Detailed Solutions & Certificate"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
