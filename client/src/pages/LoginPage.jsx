import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clientLoginSchema } from '../utils/validation';
import { Lock, Mail, Trophy, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    setServerError('');
  };

  const handleQuickDemoLogin = async (email, password) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      }
    } catch (err) {
      setServerError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    // Zod Client Validation
    const validation = clientLoginSchema.safeParse(formData);
    if (!validation.success) {
      const formatted = {};
      validation.error.errors.forEach((err) => {
        formatted[err.path[0]] = err.message;
      });
      setErrors(formatted);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(formData.email, formData.password);
      if (res.success) {
        const targetPath = (res.user?.role === 'admin' || res.user?.role === 'teacher') ? '/admin' : '/';
        navigate(targetPath, { replace: true });
      } else {
        setServerError(res.message || 'Login failed');
      }
    } catch (err) {
      setServerError(err.message || 'Invalid login credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/20 mb-3">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to EduRank</h1>
          <p className="text-sm text-slate-400 mt-1">Student Test & College Leaderboard Platform</p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@demo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-300 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" /> Quick 1-Tap Demo Logins:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student@demo.com', 'password123')}
                className="p-2.5 rounded-xl glass-card text-left hover:border-indigo-500/50 transition-colors"
              >
                <div className="text-xs font-bold text-white">Student</div>
                <div className="text-[10px] text-slate-400 truncate">MIT Boston</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('teacher@demo.com', 'password123')}
                className="p-2.5 rounded-xl glass-card text-left hover:border-purple-500/50 transition-colors"
              >
                <div className="text-xs font-bold text-purple-300">Teacher</div>
                <div className="text-[10px] text-slate-400">CS Dept</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@demo.com', 'password123')}
                className="p-2.5 rounded-xl glass-card text-left hover:border-emerald-500/50 transition-colors"
              >
                <div className="text-xs font-bold text-emerald-300">Admin</div>
                <div className="text-[10px] text-slate-400">Full Access</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 font-bold hover:underline">
              Create Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
