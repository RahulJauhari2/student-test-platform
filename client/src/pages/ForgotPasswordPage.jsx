import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ success: false, message: '', resetUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setStatus({
        success: true,
        message: 'Password reset link generated!',
        resetUrl: res.resetUrl,
      });
    } catch (err) {
      setStatus({ success: false, message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <h2 className="text-xl font-bold text-white mb-1">Forgot Password</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your registered email address to receive a password reset token.</p>

          {status.message && (
            <div className={`mb-4 p-3 rounded-xl border text-sm ${
              status.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {status.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{status.message}</span>
              </div>
              {status.resetUrl && (
                <div className="mt-3 pt-2 border-t border-emerald-500/20 text-xs">
                  <span className="text-slate-300">Click to reset password:</span>{' '}
                  <Link to={status.resetUrl} className="font-bold underline text-amber-400">
                    Reset Password Page
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@demo.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all"
            >
              {isSubmitting ? 'Generating Token...' : 'Generate Reset Token'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
