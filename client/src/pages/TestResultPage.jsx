import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { apiFetch } from '../utils/api';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Printer,
  Share2,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  FileCheck,
  X,
} from 'lucide-react';

export default function TestResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const res = await apiFetch(`/tests/result/${id}`);
      if (res.success) {
        setResult(res.result);
        if (res.result.accuracyPercentage >= 70) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (err) {
      console.error('Fetch result error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Trophy className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
        <p className="text-slate-400 text-sm font-medium">Calculating Your Score & Performance Metrics...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-white">Result Not Found</h2>
        <Link to="/" className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isEligibleForCertificate = result.accuracyPercentage >= 60;

  return (
    <>
      {/* SCORECARD CONTENT WRAPPER */}
      <div className={`pb-24 pt-4 px-4 max-w-4xl mx-auto space-y-6 ${showCertificateModal ? 'print:hidden' : ''}`}>
        {/* Performance Overview Banner */}
        <div className="glass-panel p-6 rounded-3xl text-center relative overflow-hidden border border-indigo-500/20 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-red-500 shadow-xl shadow-amber-500/30 mb-3">
          <Trophy className="w-8 h-8 text-white" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Verified Scorecard Record
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {result.studentName}
        </h1>
        <p className="text-xs text-indigo-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
          <GraduationCap className="w-4 h-4" /> {result.collegeName}
        </p>
        <p className="text-xs text-slate-300 mt-2">
          Subject: <span className="font-bold text-white">{result.subjectName}</span> • Topic:{' '}
          <span className="text-indigo-400 font-bold">{result.topicName}</span>
        </p>

        {/* Big Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="glass-card p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">Total Score</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">{result.score} pts</div>
          </div>
          <div className="glass-card p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">Accuracy</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{result.accuracyPercentage}%</div>
          </div>
          <div className="glass-card p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">Correct</div>
            <div className="text-2xl font-black text-indigo-400 mt-0.5">
              {result.correctAnswers}/{result.totalQuestions}
            </div>
          </div>
          <div className="glass-card p-3 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">Time Spent</div>
            <div className="text-2xl font-black text-purple-400 mt-0.5">{result.timeTakenSeconds}s</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 print:hidden">
          {isEligibleForCertificate && (
            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200" /> View & Print Certificate
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Printer className="w-4 h-4" /> Print Scorecard
          </button>

          <Link
            to="/leaderboard"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Award className="w-4 h-4" /> Leaderboard Rank
          </Link>

          <Link
            to="/"
            className="px-4 py-2.5 rounded-2xl glass-card hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>

      {/* Instant Solution Explanations Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Question-by-Question Solution Explanations
        </h2>

        <div className="space-y-4">
          {result.answersSubmitted?.map((item, idx) => (
            <div
              key={idx}
              className={`glass-panel p-5 rounded-3xl border transition-all ${
                item.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : 'border-red-500/30 bg-red-950/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                {item.isCorrect ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+10)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold flex items-center gap-1 border border-red-500/30">
                    <XCircle className="w-3.5 h-3.5" /> Wrong / Skipped (-2)
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm text-white mb-3 whitespace-pre-wrap break-words">
                {item.questionText?.replace(/\\n/g, '\n')}
              </h3>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {item.options?.map((opt, optIdx) => {
                  const isUserPick = item.selectedOptionIndex === optIdx;
                  const isCorrectAnswer = item.correctOptionIndex === optIdx;

                  let borderStyle = 'border-slate-800 glass-card text-slate-400';
                  if (isCorrectAnswer) {
                    borderStyle = 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-bold';
                  } else if (isUserPick && !isCorrectAnswer) {
                    borderStyle = 'border-red-500/60 bg-red-500/20 text-red-300 line-through';
                  }

                  return (
                    <div key={optIdx} className={`p-3 rounded-xl text-xs flex items-center justify-between border ${borderStyle}`}>
                      <span className="whitespace-pre-wrap break-words">
                        <span className="font-bold mr-2 shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt?.replace(/\\n/g, '\n')}
                      </span>
                      {isCorrectAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Instant Explanation Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-indigo-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Solution Explanation:
                </div>
                <p className="leading-relaxed">{item.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* PRINTABLE CERTIFICATE MODAL / VIEW */}
    {showCertificateModal && (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:bg-transparent print:p-0">
        <div className="relative max-w-2xl w-full bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 p-8 rounded-3xl border-4 border-amber-500/60 shadow-2xl text-center space-y-6 print:fixed print:inset-0 print:border-8 print:border-black print:bg-white print:bg-none print:text-black">
          <button
            onClick={() => setShowCertificateModal(false)}
            className="absolute top-4 right-4 p-2 rounded-xl glass-card text-slate-400 hover:text-white print:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Certificate Watermark & Header */}
          <div className="flex items-center justify-center gap-2">
            <Award className="w-12 h-12 text-amber-400" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Official Certificate of Achievement
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              EduRank Assessment Platform
            </h2>
          </div>

          <div className="space-y-2 py-2 border-y border-amber-500/30 print:border-black">
            <p className="text-xs text-slate-400">This is to certify that</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-wide">
              {result.studentName}
            </h3>
            <p className="text-xs text-slate-300">
              representing <span className="font-bold text-white">{result.collegeName}</span>
            </p>
            <p className="text-xs text-slate-400 pt-2">
              has successfully completed the official examination in
            </p>
            <p className="text-base font-bold text-indigo-300">
              {result.subjectName} — {result.topicName}
            </p>
            <p className="text-xs text-slate-300">
              with an overall score of <span className="font-extrabold text-emerald-400">{result.score} Points</span> ({result.accuracyPercentage}% Accuracy)
            </p>
          </div>

          <div className="flex items-end justify-between text-left text-xs text-slate-400 pt-8 border-t border-amber-500/20 print:border-black mt-4">
            <div>
              <p className="font-bold text-slate-200">Date Issued:</p>
              <p>{new Date(result.createdAt).toLocaleDateString()}</p>
              <div className="mt-4">
                <p className="font-bold text-emerald-400">Verification ID:</p>
                <p className="font-mono text-[10px] text-slate-400">{result._id}</p>
              </div>
            </div>
            
            {/* Instructor Signature Block */}
            <div className="text-center pb-1">
              <div className="w-40 border-b border-slate-400 print:border-black mx-auto mb-2"></div>
              <p className="font-bold text-slate-200 text-sm">Instructor's Signature</p>
              <p className="text-[10px] text-slate-400 mt-0.5">EduRank Official</p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Download / Print PDF Certificate
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
