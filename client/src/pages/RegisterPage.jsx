import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clientRegisterSchema } from '../utils/validation';
import { User, Mail, Lock, Building, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    collegeName: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collegesList, setCollegesList] = useState([]);
  const [isOtherCollege, setIsOtherCollege] = useState(false);

  React.useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/colleges');
        const data = await response.json();
        if (data.success && data.colleges) {
          setCollegesList(data.colleges);
        }
      } catch (err) {
        console.error('Failed to fetch colleges', err);
      }
    };
    fetchColleges();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    // Zod Client Validation
    const validation = clientRegisterSchema.safeParse(formData);
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
      const res = await register(formData);
      if (res.success) {
        const targetPath = (res.user?.role === 'admin' || res.user?.role === 'teacher') ? '/admin' : '/';
        navigate(targetPath, { replace: true });
      } else {
        setServerError(res.message || 'Registration failed');
      }
    } catch (err) {
      setServerError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Join EduRank</h1>
          <p className="text-sm text-slate-400 mt-1">Create your test platform account</p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {['student', 'teacher', 'admin'].map((roleType) => (
                  <button
                    key={roleType}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: roleType })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                      formData.role === roleType
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30'
                        : 'glass-card text-slate-400 hover:text-white border-slate-700/50'
                    }`}
                  >
                    {roleType}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            {formData.role === 'student' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">College / Institution Name</label>
                <div className="relative mb-2">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 z-10" />
                  <select
                    name="selectedCollege"
                    onChange={(e) => {
                      const val = e.target.value;
                      setIsOtherCollege(val === 'other');
                      if (val !== 'other') {
                        setFormData({ ...formData, collegeName: val });
                      } else {
                        setFormData({ ...formData, collegeName: '' });
                      }
                      if (errors.collegeName) setErrors({ ...errors, collegeName: '' });
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm appearance-none bg-slate-800/50"
                  >
                    <option value="">Select your college</option>
                    {collegesList.map((college, idx) => (
                      <option key={idx} value={college}>
                        {college}
                      </option>
                    ))}
                    <option value="other">Other (Type new)</option>
                  </select>
                </div>
                {isOtherCollege && (
                  <div className="relative">
                    <input
                      type="text"
                      name="collegeName"
                      maxLength={100}
                      value={formData.collegeName}
                      onChange={handleChange}
                      placeholder="Type your college name"
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm mt-2"
                    />
                  </div>
                )}
                {errors.collegeName && <p className="text-xs text-red-400 mt-1">{errors.collegeName}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
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
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
