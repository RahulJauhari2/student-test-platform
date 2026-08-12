import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { clientQuestionSchema } from '../utils/validation';
import {
  Shield,
  PlusCircle,
  BookOpen,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Upload,
  Download,
  Copy,
  Sparkles,
  UserCheck,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Users,
  GraduationCap,
  Lock,
  BarChart2,
  TrendingUp,
  Award,
  FileText,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'manage_questions', 'teachers', 'students', 'question', 'bulk', 'topic', 'subject'

  // Question Search & Filter
  const [qSearch, setQSearch] = useState('');
  const [qSubjectFilter, setQSubjectFilter] = useState('');

  // Editing Question Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({
    questionText: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correctOptionIndex: 0,
    explanation: '',
    difficulty: 'Medium',
  });

  // Single Question Form State
  const [qForm, setQForm] = useState({
    subjectId: '',
    topicId: '',
    questionText: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correctOptionIndex: 0,
    explanation: '',
    difficulty: 'Medium',
  });

  // Bulk Upload Form State
  const [bulkSubjectId, setBulkSubjectId] = useState('');
  const [bulkTopicId, setBulkTopicId] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkFormat, setBulkFormat] = useState('csv');

  // Subject & Topic Form States
  const [subjForm, setSubjForm] = useState({ name: '', code: '', description: '' });
  const [topicForm, setTopicForm] = useState({ subjectId: '', name: '', description: '', timeLimitMinutes: 5 });

  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const getCleanId = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      if (obj.$oid) return String(obj.$oid);
      if (obj._id) return getCleanId(obj._id);
      if (obj.toString && typeof obj.toString === 'function') return obj.toString();
    }
    return String(obj);
  };

  const canUserEditQuestion = (q) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (isTeacher) {
      const authorId = getCleanId(q.createdBy?._id || q.createdBy);
      const userId = getCleanId(user._id);
      return Boolean(authorId && userId && authorId === userId);
    }
    return false;
  };

  const fetchAdminData = async () => {
    try {
      const [statsRes, subjRes, teachRes, studRes, qRes, anaRes] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/tests/subjects'),
        apiFetch('/admin/teachers'),
        apiFetch('/admin/students'),
        apiFetch('/admin/questions'),
        apiFetch('/admin/analytics'),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (subjRes.success) setSubjects(subjRes.subjects);
      if (teachRes.success) setTeachers(teachRes.teachers);
      if (studRes.success) setStudents(studRes.students);
      if (qRes.success) setAllQuestions(qRes.questions);
      if (anaRes.success) setAnalyticsData(anaRes.analytics);
    } catch (err) {
      console.error('Admin data error:', err);
    }
  };

  const handleExportCSVResults = async () => {
    try {
      const res = await apiFetch('/admin/stats');
      if (res.recentResults && res.recentResults.length > 0) {
        const headers = ['Student Name', 'College Name', 'Subject', 'Topic', 'Score (pts)', 'Accuracy %', 'Date'];
        const rows = res.recentResults.map((r) => [
          `"${r.studentName || 'Student'}"`,
          `"${r.collegeName || 'College'}"`,
          `"${r.subjectName || ''}"`,
          `"${r.topicName || ''}"`,
          r.score || 0,
          `${r.accuracyPercentage || 0}%`,
          `"${new Date(r.createdAt).toLocaleDateString()}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Student_Grade_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setFormMsg({ type: 'success', text: '🎉 Downloaded Student Grade Report (CSV)!' });
      } else {
        alert('No test results available to export yet.');
      }
    } catch (err) {
      alert('Export error: ' + err.message);
    }
  };

  const handleOpenEditModal = (q) => {
    if (!canUserEditQuestion(q)) {
      alert('Forbidden: You can only edit questions created by you.');
      return;
    }

    setEditingQuestion(q);
    setEditForm({
      questionText: q.questionText || '',
      option0: q.options ? q.options[0] || '' : '',
      option1: q.options ? q.options[1] || '' : '',
      option2: q.options ? q.options[2] || '' : '',
      option3: q.options ? q.options[3] || '' : '',
      correctOptionIndex: q.correctOptionIndex !== undefined ? Number(q.correctOptionIndex) : 0,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'Medium',
    });
  };

  const handleSaveEditQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setIsSubmitting(true);
    setFormMsg({ type: '', text: '' });

    const targetId = getCleanId(editingQuestion._id || editingQuestion);

    if (!targetId || targetId === '[object Object]') {
      setFormMsg({ type: 'error', text: 'Invalid Question ID format.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        questionText: editForm.questionText,
        options: [editForm.option0, editForm.option1, editForm.option2, editForm.option3],
        correctOptionIndex: Number(editForm.correctOptionIndex),
        explanation: editForm.explanation,
        difficulty: editForm.difficulty,
      };

      const res = await apiFetch(`/admin/questions/${targetId}`, {
        method: 'PUT',
        body: payload,
      });

      if (res.success) {
        setFormMsg({ type: 'success', text: '✅ Question updated successfully in database!' });
        setEditingQuestion(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Save edit error:', err);
      setFormMsg({ type: 'error', text: 'Failed to update question: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (!canUserEditQuestion(q)) {
      alert('Forbidden: You can only delete questions created by you.');
      return;
    }

    const targetId = getCleanId(q._id || q);
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await apiFetch(`/admin/questions/${targetId}`, { method: 'DELETE' });
      if (res.success) {
        setFormMsg({ type: 'success', text: 'Question deleted successfully!' });
        fetchAdminData();
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    const validation = clientQuestionSchema.safeParse({
      ...qForm,
      correctOptionIndex: Number(qForm.correctOptionIndex),
    });

    if (!validation.success) {
      setFormMsg({ type: 'error', text: validation.error.errors[0].message });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        subjectId: qForm.subjectId,
        topicId: qForm.topicId,
        questionText: qForm.questionText,
        options: [qForm.option0, qForm.option1, qForm.option2, qForm.option3],
        correctOptionIndex: Number(qForm.correctOptionIndex),
        explanation: qForm.explanation,
        difficulty: qForm.difficulty,
      };

      const res = await apiFetch('/admin/questions', {
        method: 'POST',
        body: payload,
      });

      if (res.success) {
        setFormMsg({ type: 'success', text: 'Question added successfully!' });
        setQForm({
          ...qForm,
          questionText: '',
          option0: '',
          option1: '',
          option2: '',
          option3: '',
          explanation: '',
        });
        fetchAdminData();
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk File / Text Parser
  const parseBulkInput = () => {
    if (!bulkSubjectId || !bulkTopicId) {
      throw new Error('Please select a Subject and Topic for the bulk upload.');
    }
    if (!bulkText.trim()) {
      throw new Error('Bulk content cannot be empty.');
    }

    const parsedQuestions = [];

    if (bulkFormat === 'json') {
      try {
        const rawJson = JSON.parse(bulkText);
        const arr = Array.isArray(rawJson) ? rawJson : [rawJson];

        arr.forEach((item) => {
          parsedQuestions.push({
            subjectId: bulkSubjectId,
            topicId: bulkTopicId,
            questionText: item.questionText || item.question || '',
            options: item.options || [item.optionA, item.optionB, item.optionC, item.optionD],
            correctOptionIndex: Number(item.correctOptionIndex ?? item.correctIndex ?? 0),
            explanation: item.explanation || 'Solution explanation provided.',
            difficulty: item.difficulty || 'Medium',
          });
        });
      } catch (err) {
        throw new Error('Invalid JSON format: ' + err.message);
      }
    } else {
      const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error('CSV is empty');

      const startIdx = lines[0].toLowerCase().includes('question') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const row = parseCSVRow(lines[i]);
        if (row.length < 6) continue;

        const [qText, optA, optB, optC, optD, correctIdxStr, expl, diff] = row;

        parsedQuestions.push({
          subjectId: bulkSubjectId,
          topicId: bulkTopicId,
          questionText: qText,
          options: [optA, optB, optC, optD].filter(Boolean),
          correctOptionIndex: parseInt(correctIdxStr) || 0,
          explanation: expl || 'Detailed explanation included.',
          difficulty: diff || 'Medium',
        });
      }
    }

    if (parsedQuestions.length === 0) {
      throw new Error('No valid questions could be parsed from input.');
    }

    return parsedQuestions;
  };

  const parseCSVRow = (text) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setBulkText(evt.target.result);
      if (file.name.endsWith('.json')) {
        setBulkFormat('json');
      } else if (file.name.endsWith('.csv')) {
        setBulkFormat('csv');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    try {
      const questionsToUpload = parseBulkInput();
      setIsSubmitting(true);

      const res = await apiFetch('/admin/questions/bulk', {
        method: 'POST',
        body: { questions: questionsToUpload },
      });

      if (res.success) {
        setFormMsg({
          type: 'success',
          text: `🎉 ${res.message || `Successfully imported ${questionsToUpload.length} questions!`}`,
        });
        setBulkText('');
        fetchAdminData();
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message });
    } fontFinally: {
      setIsSubmitting(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/admin/subjects', {
        method: 'POST',
        body: subjForm,
      });
      if (res.success) {
        setFormMsg({ type: 'success', text: 'Subject created successfully!' });
        setSubjForm({ name: '', code: '', description: '' });
        fetchAdminData();
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/admin/topics', {
        method: 'POST',
        body: topicForm,
      });
      if (res.success) {
        setFormMsg({ type: 'success', text: 'Topic created successfully!' });
        setTopicForm({ subjectId: '', name: '', description: '', timeLimitMinutes: 5 });
        fetchAdminData();
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleCSV = `questionText,optionA,optionB,optionC,optionD,correctOptionIndex,explanation,difficulty
"What is the worst-case complexity of Merge Sort?","O(n log n)","O(n²)","O(n)","O(1)",0,"Merge sort divides array into half recursively taking O(n log n) in all cases.","Medium"
"Which HTTP verb is idempotent for updates?","POST","PUT","CONNECT","PATCH",1,"PUT requests are idempotent because repeated identical requests produce the same result.","Easy"`;

  const sampleJSON = `[
  {
    "questionText": "What is the time complexity of searching in a Hash Map on average?",
    "options": ["O(1)", "O(n)", "O(log n)", "O(n²)"],
    "correctOptionIndex": 0,
    "explanation": "Hash map offers constant average O(1) time complexity for lookup operations.",
    "difficulty": "Easy"
  }
]`;

  const selectedSubjectTopicsSingle = subjects.find((s) => getCleanId(s._id) === getCleanId(qForm.subjectId))?.topics || [];
  const selectedSubjectTopicsBulk = subjects.find((s) => getCleanId(s._id) === getCleanId(bulkSubjectId))?.topics || [];

  // Filter Questions for Question Bank tab
  const filteredQuestionsList = allQuestions.filter((q) => {
    const textMatch = q.questionText?.toLowerCase().includes(qSearch.toLowerCase());
    const qSubjId = getCleanId(q.subjectId?._id || q.subjectId);
    const filterSubjId = getCleanId(qSubjectFilter);
    const subjMatch = filterSubjId ? qSubjId === filterSubjId : true;
    return textMatch && subjMatch;
  });

  return (
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isTeacher ? '👨‍🏫 Faculty Teacher Portal' : '🛡️ Master Admin Portal'}
              </h1>
              <p className="text-xs text-slate-400">
                {isTeacher
                  ? `Welcome Prof. ${user?.name || ''} — Manage your questions, tests & topics`
                  : 'Full System Administration & User Management Portal'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSVResults}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Grade Report (CSV)
          </button>
        </div>

        {/* Interactive Clickable Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-800">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('teachers')}
                className="glass-card p-3 rounded-2xl text-left hover:border-emerald-500/50 cursor-pointer transition-all"
              >
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> Teachers
                </div>
                <div className="text-xl font-black text-emerald-400">{stats.totalTeachers}</div>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className="glass-card p-3 rounded-2xl text-left hover:border-indigo-500/50 cursor-pointer transition-all"
            >
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Students
              </div>
              <div className="text-xl font-black text-indigo-400">{stats.totalStudents}</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subject')}
              className="glass-card p-3 rounded-2xl text-left hover:border-purple-500/50 cursor-pointer transition-all"
            >
              <div className="text-xs text-slate-400 font-semibold">Subjects</div>
              <div className="text-xl font-black text-purple-400">{stats.totalSubjects}</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage_questions')}
              className="glass-card p-3 rounded-2xl text-left hover:border-emerald-500/50 cursor-pointer transition-all"
            >
              <div className="text-xs text-slate-400 font-semibold">
                {isTeacher ? 'My Questions' : 'Questions'}
              </div>
              <div className="text-xl font-black text-emerald-400">{allQuestions.length}</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="glass-card p-3 rounded-2xl text-left hover:border-amber-500/50 cursor-pointer transition-all"
            >
              <div className="text-xs text-slate-400 font-semibold">Tests Taken</div>
              <div className="text-xl font-black text-amber-400">{stats.totalTestsTaken}</div>
            </button>
          </div>
        )}
      </div>

      {/* Role-tailored Action Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => { setActiveTab('analytics'); setFormMsg({ type: '', text: '' }); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'glass-card text-amber-400'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Class Analytics Report
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('manage_questions'); setFormMsg({ type: '', text: '' }); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'manage_questions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'glass-card text-slate-400'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> {isTeacher ? `My Questions (${allQuestions.length})` : `Manage Questions (${allQuestions.length})`}
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => { setActiveTab('teachers'); setFormMsg({ type: '', text: '' }); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'teachers' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'glass-card text-emerald-400'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Teachers ({teachers.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => { setActiveTab('students'); setFormMsg({ type: '', text: '' }); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'glass-card text-indigo-400'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Students ({students.length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('question'); setFormMsg({ type: '', text: '' }); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'question' ? 'bg-indigo-600 text-white' : 'glass-card text-slate-400'
          }`}
        >
          ➕ Add Question
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('bulk'); setFormMsg({ type: '', text: '' }); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'bulk' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : 'glass-card text-emerald-400'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Bulk CSV/JSON Upload
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('topic'); setFormMsg({ type: '', text: '' }); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'topic' ? 'bg-indigo-600 text-white' : 'glass-card text-slate-400'
          }`}
        >
          📁 Add Topic
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('subject'); setFormMsg({ type: '', text: '' }); }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'subject' ? 'bg-indigo-600 text-white' : 'glass-card text-slate-400'
          }`}
        >
          📚 Add Subject
        </button>
      </div>

      {/* Feedback Message */}
      {formMsg.text && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          formMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{formMsg.text}</span>
        </div>
      )}

      {/* TAB: TEACHER CLASS-WIDE ANALYTICS REPORT */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" /> Class Performance & Exam Analytics Report
              </h2>
              <button
                type="button"
                onClick={handleExportCSVResults}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV Report
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card p-4 rounded-2xl">
                <div className="text-xs text-slate-400 font-bold uppercase">Class Submissions</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">{analyticsData.totalSubmissions}</div>
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <div className="text-xs text-slate-400 font-bold uppercase">Avg Class Score</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{analyticsData.avgScore} pts</div>
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <div className="text-xs text-slate-400 font-bold uppercase">Avg Accuracy</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{analyticsData.avgAccuracy}%</div>
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <div className="text-xs text-slate-400 font-bold uppercase">Exam Pass Rate</div>
                <div className="text-2xl font-black text-purple-400 mt-1">{analyticsData.passRatePercentage}%</div>
              </div>
            </div>
          </div>

          {/* Top Class Performers */}
          {analyticsData.topStudents.length > 0 && (
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Class Top Performers Leaderboard
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analyticsData.topStudents.map((st, idx) => (
                  <div key={idx} className="p-3 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{idx + 1}. {st.name}</div>
                      <div className="text-xs text-slate-400">{st.college}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-amber-400">{st.highScore} pts</div>
                      <div className="text-[11px] font-semibold text-emerald-400">{st.accuracy}% Acc</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MANAGE & EDIT QUESTIONS */}
      {activeTab === 'manage_questions' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Search questions by text..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <select
              value={qSubjectFilter}
              onChange={(e) => setQSubjectFilter(e.target.value)}
              className="w-full sm:w-auto p-2 rounded-xl glass-input text-xs"
            >
              <option value="" className="bg-slate-900">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={getCleanId(s._id)} className="bg-slate-900">
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredQuestionsList.length === 0 ? (
              <div className="p-8 text-center glass-panel rounded-3xl text-slate-400 text-xs">
                No questions found. Try adding questions or changing search filters.
              </div>
            ) : (
              filteredQuestionsList.map((q, idx) => {
                const canEdit = canUserEditQuestion(q);
                return (
                  <div key={getCleanId(q._id) || idx} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {q.subjectId?.name || 'Subject'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {q.topicId?.name || 'Topic'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {q.difficulty || 'Medium'}
                          </span>
                          {q.createdBy && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              Author: {q.createdBy?.name || 'Faculty'}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-white text-sm mt-1">
                          #{idx + 1}. {q.questionText}
                        </h3>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {canEdit ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenEditModal(q);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-500/20 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteQuestion(q);
                              }}
                              className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400" /> Read Only
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options?.map((opt, optIdx) => {
                        const isCorrect = Number(q.correctOptionIndex) === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                : 'glass-card text-slate-300 border-slate-800'
                            }`}
                          >
                            <span>
                              <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                        💡 Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: REGISTERED TEACHERS LIST (Admin Only) */}
      {isAdmin && activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Registered Teachers ({teachers.length})
              </h2>
              <p className="text-xs text-slate-400">Faculty members authorized to manage tests and questions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teachers.length === 0 ? (
              <div className="col-span-2 p-8 text-center glass-panel rounded-3xl text-slate-400 text-xs">
                No teachers registered yet.
              </div>
            ) : (
              teachers.map((t) => (
                <div key={getCleanId(t._id)} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Registered Faculty
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Joined: {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-base">{t.name}</h3>
                  <p className="text-xs text-indigo-400 font-semibold">{t.email}</p>
                  <p className="text-xs text-slate-400">Department / College: <span className="text-white font-bold">{t.collegeName || 'Computer Science'}</span></p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: REGISTERED STUDENTS LIST */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" /> Registered Students ({students.length})
              </h2>
              <p className="text-xs text-slate-400">Active students registered on the testing platform</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {students.length === 0 ? (
              <div className="col-span-2 p-8 text-center glass-panel rounded-3xl text-slate-400 text-xs">
                No students registered yet.
              </div>
            ) : (
              students.map((st) => (
                <div key={getCleanId(st._id)} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> Active Student
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Joined: {new Date(st.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-base">{st.name}</h3>
                  <p className="text-xs text-indigo-400 font-semibold">{st.email}</p>
                  <p className="text-xs text-slate-400">College / Institution: <span className="text-white font-bold">{st.collegeName || 'Independent'}</span></p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL OVERLAY */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditQuestion}
            className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" /> Edit Question Statement & Options
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-xl glass-card text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Question Statement</label>
              <textarea
                value={editForm.questionText}
                onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                rows={3}
                className="w-full p-3 rounded-xl glass-input text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Option A</label>
                <input
                  type="text"
                  value={editForm.option0}
                  onChange={(e) => setEditForm({ ...editForm, option0: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Option B</label>
                <input
                  type="text"
                  value={editForm.option1}
                  onChange={(e) => setEditForm({ ...editForm, option1: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Option C</label>
                <input
                  type="text"
                  value={editForm.option2}
                  onChange={(e) => setEditForm({ ...editForm, option2: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Option D</label>
                <input
                  type="text"
                  value={editForm.option3}
                  onChange={(e) => setEditForm({ ...editForm, option3: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correct Answer</label>
                <select
                  value={editForm.correctOptionIndex}
                  onChange={(e) => setEditForm({ ...editForm, correctOptionIndex: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                >
                  <option value={0} className="bg-slate-900">Option A</option>
                  <option value={1} className="bg-slate-900">Option B</option>
                  <option value={2} className="bg-slate-900">Option C</option>
                  <option value={3} className="bg-slate-900">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                <select
                  value={editForm.difficulty}
                  onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                >
                  <option value="Easy" className="bg-slate-900">Easy</option>
                  <option value="Medium" className="bg-slate-900">Medium</option>
                  <option value="Hard" className="bg-slate-900">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Solution Explanation</label>
              <textarea
                value={editForm.explanation}
                onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                rows={2}
                className="w-full p-3 rounded-xl glass-input text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="py-2.5 rounded-xl glass-card text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Question Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 1: Bulk CSV / JSON Question Upload Form */}
      {activeTab === 'bulk' && (
        <form onSubmit={handleBulkSubmit} className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Bulk Questions Import (CSV / JSON)
              </h2>
              <span className="text-xs text-slate-400">Upload multiple questions at once</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select target Subject and Topic, then upload a `.csv` or `.json` file, or paste formatted content directly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Subject</label>
              <select
                value={bulkSubjectId}
                onChange={(e) => {
                  setBulkSubjectId(e.target.value);
                  setBulkTopicId('');
                }}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              >
                <option value="" className="bg-slate-900">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={getCleanId(s._id)} value={getCleanId(s._id)} className="bg-slate-900">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Topic</label>
              <select
                value={bulkTopicId}
                onChange={(e) => setBulkTopicId(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              >
                <option value="" className="bg-slate-900">-- Choose Topic --</option>
                {selectedSubjectTopicsBulk.map((t) => (
                  <option key={getCleanId(t._id)} value={getCleanId(t._id)} className="bg-slate-900">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Format selector & File upload dropzone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkFormat('csv')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    bulkFormat === 'csv'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'glass-card text-slate-400'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> CSV File
                </button>

                <button
                  type="button"
                  onClick={() => setBulkFormat('json')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    bulkFormat === 'json'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'glass-card text-slate-400'
                  }`}
                >
                  <FileCode className="w-4 h-4" /> JSON File
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Upload File (.csv or .json)</label>
              <label className="w-full p-2.5 rounded-xl glass-card hover:border-emerald-500/50 flex items-center justify-center gap-2 text-xs font-bold text-slate-300 cursor-pointer border border-dashed border-slate-700">
                <Upload className="w-4 h-4 text-emerald-400" /> Choose File
                <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Format Templates Quick Copy */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sample Template ({bulkFormat.toUpperCase()}):
              </span>
              <button
                type="button"
                onClick={() => setBulkText(bulkFormat === 'csv' ? sampleCSV : sampleJSON)}
                className="text-[11px] text-emerald-400 underline hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Load Sample into Box
              </button>
            </div>
            <pre className="p-2 rounded-xl bg-slate-950 text-slate-300 text-[11px] overflow-x-auto border border-slate-800/80">
              {bulkFormat === 'csv' ? sampleCSV : sampleJSON}
            </pre>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Paste CSV or JSON Raw Content</label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder={
                bulkFormat === 'csv'
                  ? 'Paste CSV lines here (Header: questionText, optionA, optionB, optionC, optionD, correctOptionIndex, explanation, difficulty)'
                  : 'Paste JSON array here...'
              }
              className="w-full p-3 rounded-xl glass-input text-xs font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            {isSubmitting ? 'Validating & Importing Questions...' : 'Import Bulk Questions to Bank'}
          </button>
        </form>
      )}

      {/* TAB 2: Single Question Form */}
      {activeTab === 'question' && (
        <form onSubmit={handleAddQuestion} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Create New Multiple Choice Question</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Subject</label>
              <select
                value={qForm.subjectId}
                onChange={(e) => setQForm({ ...qForm, subjectId: e.target.value, topicId: '' })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              >
                <option value="" className="bg-slate-900">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={getCleanId(s._id)} value={getCleanId(s._id)} className="bg-slate-900">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Topic</label>
              <select
                value={qForm.topicId}
                onChange={(e) => setQForm({ ...qForm, topicId: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              >
                <option value="" className="bg-slate-900">-- Choose Topic --</option>
                {selectedSubjectTopicsSingle.map((t) => (
                  <option key={getCleanId(t._id)} value={getCleanId(t._id)} className="bg-slate-900">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Question Statement</label>
            <textarea
              value={qForm.questionText}
              onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
              rows={3}
              placeholder="e.g. What is the time complexity of Quick Sort?"
              className="w-full p-3 rounded-xl glass-input text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Option A</label>
              <input
                type="text"
                value={qForm.option0}
                onChange={(e) => setQForm({ ...qForm, option0: e.target.value })}
                placeholder="Option A text"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Option B</label>
              <input
                type="text"
                value={qForm.option1}
                onChange={(e) => setQForm({ ...qForm, option1: e.target.value })}
                placeholder="Option B text"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Option C</label>
              <input
                type="text"
                value={qForm.option2}
                onChange={(e) => setQForm({ ...qForm, option2: e.target.value })}
                placeholder="Option C text"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Option D</label>
              <input
                type="text"
                value={qForm.option3}
                onChange={(e) => setQForm({ ...qForm, option3: e.target.value })}
                placeholder="Option D text"
                className="w-full p-2.5 rounded-xl glass-input text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Correct Answer Index</label>
              <select
                value={qForm.correctOptionIndex}
                onChange={(e) => setQForm({ ...qForm, correctOptionIndex: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              >
                <option value={0} className="bg-slate-900">Option A</option>
                <option value={1} className="bg-slate-900">Option B</option>
                <option value={2} className="bg-slate-900">Option C</option>
                <option value={3} className="bg-slate-900">Option D</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty Level</label>
              <select
                value={qForm.difficulty}
                onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              >
                <option value="Easy" className="bg-slate-900">Easy</option>
                <option value="Medium" className="bg-slate-900">Medium</option>
                <option value="Hard" className="bg-slate-900">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Solution Explanation</label>
            <textarea
              value={qForm.explanation}
              onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
              rows={2}
              placeholder="Explain why the answer is correct for instant post-test feedback..."
              className="w-full p-3 rounded-xl glass-input text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            {isSubmitting ? 'Saving Question...' : 'Save Question to Bank'}
          </button>
        </form>
      )}

      {/* TAB 3: Add Topic Form */}
      {activeTab === 'topic' && (
        <form onSubmit={handleAddTopic} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 max-w-lg">
          <h2 className="text-base font-bold text-white">Create New Topic</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Subject</label>
            <select
              value={topicForm.subjectId}
              onChange={(e) => setTopicForm({ ...topicForm, subjectId: e.target.value })}
              className="w-full p-2.5 rounded-xl glass-input text-xs"
              required
            >
              <option value="" className="bg-slate-900">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={getCleanId(s._id)} value={getCleanId(s._id)} className="bg-slate-900">
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Topic Name</label>
            <input
              type="text"
              value={topicForm.name}
              onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
              placeholder="e.g. Graph Algorithms"
              className="w-full p-2.5 rounded-xl glass-input text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Time Limit (Minutes)</label>
            <input
              type="number"
              value={topicForm.timeLimitMinutes}
              onChange={(e) => setTopicForm({ ...topicForm, timeLimitMinutes: Number(e.target.value) })}
              min={1}
              className="w-full p-2.5 rounded-xl glass-input text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              placeholder="Brief description of the topic..."
              className="w-full p-3 rounded-xl glass-input text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            {isSubmitting ? 'Creating Topic...' : 'Create Topic'}
          </button>
        </form>
      )}

      {/* TAB 4: Add Subject Form */}
      {activeTab === 'subject' && (
        <form onSubmit={handleAddSubject} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 max-w-lg">
          <h2 className="text-base font-bold text-white">Create New Subject</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Name</label>
            <input
              type="text"
              value={subjForm.name}
              onChange={(e) => setSubjForm({ ...subjForm, name: e.target.value })}
              placeholder="e.g. Operating Systems"
              className="w-full p-2.5 rounded-xl glass-input text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Code</label>
            <input
              type="text"
              value={subjForm.code}
              onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. OS301"
              className="w-full p-2.5 rounded-xl glass-input text-xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              value={subjForm.description}
              onChange={(e) => setSubjForm({ ...subjForm, description: e.target.value })}
              placeholder="Brief description of the subject..."
              className="w-full p-3 rounded-xl glass-input text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
          >
            {isSubmitting ? 'Creating Subject...' : 'Create Subject'}
          </button>
        </form>
      )}
    </div>
  );
}
