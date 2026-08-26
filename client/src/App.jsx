import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import TestTakingPage from './pages/TestTakingPage';
import TestResultPage from './pages/TestResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white print:bg-transparent">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Protected Student Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<StudentDashboard />} />
                <Route path="/test/:topicId" element={<TestTakingPage />} />
                <Route path="/result/:id" element={<TestResultPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
              </Route>

              {/* Protected Admin & Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<StudentDashboard />} />
            </Routes>
          </main>
          <MobileNav />
        </div>
      </Router>
    </AuthProvider>
  );
}
