import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Send, HelpCircle, Check, ShieldAlert, X, Copy } from 'lucide-react';

export default function TestTakingPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Synchronous refs & state to prevent React closure stale state issues
  const questionsRef = useRef([]);
  const selectedAnswersRef = useRef({});
  const [selectedAnswersMap, setSelectedAnswersMap] = useState({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Anti-Cheating Tab Switch State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabWarning, setTabWarning] = useState('');

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    fetchTestQuestions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [topicId]);

  // Tab-Switch Anti-Cheating Monitor
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 3) {
            setTabWarning('⚠️ Maximum tab switches (3/3) reached! Auto-submitting exam...');
            setTimeout(() => {
              submitQuiz(true);
            }, 1000);
          } else {
            setTabWarning(`⚠️ Anti-Cheat Alert: Tab switch detected! (Warning ${nextCount}/3)`);
          }
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSubmitting]);

  const fetchTestQuestions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/tests/topic/${topicId}/questions`);
      if (res.success) {
        setTopic(res.topic);
        
        // Store synchronously in ref to prevent stale closure inside submitQuiz
        questionsRef.current = res.questions || [];
        setQuestions(res.questions || []);

        const totalSeconds = (res.topic.timeLimitMinutes || 5) * 60;
        setTimeLeft(totalSeconds);
        startTimeRef.current = Date.now();
        selectedAnswersRef.current = {};
        setSelectedAnswersMap({});

        // Start countdown timer
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Fetch questions error:', err);
      alert('Failed to load test questions: ' + err.message);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIndex, optionIndex) => {
    const optNum = Number(optionIndex);
    
    // Synchronous write to ref
    selectedAnswersRef.current[qIndex] = optNum;

    setSelectedAnswersMap((prev) => ({
      ...prev,
      [qIndex]: optNum,
    }));

    // console.log(`[Option Tapped] Question #${qIndex + 1} -> Option Index ${optNum}`, selectedAnswersRef.current);
  };

  const handleAutoSubmit = () => {
    if (!isSubmitting) {
      submitQuiz(true);
    }
  };

  const submitQuiz = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTakenSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

    // Use questionsRef.current (synchronously populated) to guarantee non-empty questions list
    const activeQuestions = questionsRef.current.length > 0 ? questionsRef.current : questions;

    const formattedAnswers = activeQuestions.map((q, idx) => {
      const qIdStr = q._id ? String(q._id) : `q_${idx}`;

      const selectedVal = selectedAnswersRef.current[idx] !== undefined
        ? selectedAnswersRef.current[idx]
        : selectedAnswersMap[idx];

      return {
        questionId: qIdStr,
        selectedOptionIndex: selectedVal !== undefined && selectedVal !== null ? Number(selectedVal) : null,
      };
    });

    // console.log('[TestTakingPage] Payload formattedAnswers to submit:', formattedAnswers);

    try {
      const res = await apiFetch('/tests/submit', {
        method: 'POST',
        body: {
          topicId,
          timeTakenSeconds,
          answers: formattedAnswers,
        },
      });

      if (res.success && res.result) {
        navigate(`/result/${res.result._id}`);
      } else {
        throw new Error(res.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Submit Error:', err);
      alert('Error submitting test: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Clock className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
        <p className="text-slate-400 text-sm font-medium">Preparing Your Test Environment...</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <HelpCircle className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-xl font-bold text-white">No Questions Available</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          There are currently no active questions added under this topic.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const isTimeCritical = timeLeft < 60;

  const answeredCount = questions.filter((_, idx) => {
    return selectedAnswersRef.current[idx] !== undefined || selectedAnswersMap[idx] !== undefined;
  }).length;

  return (
    <div
      className="pb-24 pt-4 px-4 max-w-4xl mx-auto space-y-4 select-none"
      onCopy={(e) => { e.preventDefault(); setTabWarning('Copying is disabled during the test.'); }}
      onContextMenu={(e) => { e.preventDefault(); setTabWarning('Right-click is disabled during the test.'); }}
      onPaste={(e) => { e.preventDefault(); setTabWarning('Pasting is disabled during the test.'); }}
    >
      {/* Top Test Header with Live Counter Badge & Direct Submit Button */}
      <div className="glass-panel p-4 rounded-2xl sticky top-16 z-30 flex items-center justify-between border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{topic?.subjectName}</span>
          <h2 className="font-bold text-sm text-white truncate max-w-[150px] sm:max-w-md">{topic?.name}</h2>
          {/* Live Answers Saved Badge */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" /> Answers Saved: {answeredCount}/{questions.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Countdown Timer Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-black transition-all ${
              isTimeCritical
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Direct Instant Submit Button */}
          <button
            type="button"
            onClick={() => submitQuiz(false)}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            title="Submit Test Anytime Before Timer Expires"
          >
            <Send className="w-3.5 h-3.5" /> <span>{isSubmitting ? 'Submitting...' : 'Submit Test'}</span>
          </button>
        </div>
      </div>

      {/* Anti-Cheating Warning Banner Toast */}
      {tabWarning && (
        <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{tabWarning}</span>
          </div>
          <button
            type="button"
            onClick={() => setTabWarning('')}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Question Progress Drawer Pill Bar */}
      <div className="glass-card p-3 rounded-2xl flex items-center gap-2 overflow-x-auto scrollbar-none">
        {questions.map((q, idx) => {
          const isAnswered = selectedAnswersRef.current[idx] !== undefined || selectedAnswersMap[idx] !== undefined;
          const isCurrent = currentIdx === idx;
          return (
            <button
              key={q._id || idx}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isCurrent
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/30'
                  : isAnswered
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Display Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {currentQ.difficulty || 'Medium'}
          </span>
        </div>

        {/* Question Text with Copy Button */}
        <div className="relative group bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              const textToCopy = currentQ.questionText.replace(/\\n/g, '\n');
              
              const handleSuccess = () => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              };

              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy)
                  .then(handleSuccess)
                  .catch(err => console.error("Clipboard API failed", err));
              } else {
                // Fallback for non-secure contexts (e.g., HTTP over LAN)
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                  document.execCommand('copy');
                  handleSuccess();
                } catch (err) {
                  console.error("Fallback copy failed", err);
                }
                document.body.removeChild(textArea);
              }
            }}
            className={`absolute top-3 right-3 p-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              isCopied 
                ? 'bg-emerald-600 text-white opacity-100' 
                : 'bg-slate-800/80 hover:bg-indigo-600 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
            title="Copy Code/Question"
          >
            {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isCopied ? 'Copied!' : 'Copy'}
            </span>
          </button>
          
          <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed whitespace-pre-wrap break-words pr-12 font-mono text-sm">
            {currentQ.questionText.replace(/\\n/g, '\n')}
          </h3>
        </div>

        {/* Ergonomic Touch Options List */}
        <div className="space-y-3 pt-2">
          {currentQ.options?.map((opt, optIdx) => {
            const selectedVal = selectedAnswersRef.current[currentIdx] !== undefined
              ? selectedAnswersRef.current[currentIdx]
              : selectedAnswersMap[currentIdx];

            const isSelected = selectedVal === optIdx;

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(currentIdx, optIdx)}
                className={`w-full p-4 rounded-2xl text-left text-sm font-semibold transition-all flex items-center justify-between border ${
                  isSelected
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/15'
                    : 'glass-card text-slate-300 hover:text-white hover:border-slate-700 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <span
                    className={`w-7 h-7 shrink-0 rounded-xl text-xs font-bold flex items-center justify-center border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="whitespace-pre-wrap break-words w-full">{opt.replace(/\\n/g, '\n')}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Bottom Navigation & Direct Submit Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 rounded-xl glass-card text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            type="button"
            onClick={() => submitQuiz(false)}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : `Submit Test (${answeredCount}/${questions.length})`}
          </button>

          {currentIdx < questions.length - 1 && (
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-500/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
