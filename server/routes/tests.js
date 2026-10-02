const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const TestResult = require('../models/TestResult');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { testSubmissionSchema } = require('../validators/schemas');

// Fisher-Yates Array Shuffling Helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// GET /api/tests/subjects - Fetch all subjects & their topics
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().lean();
    const topics = await Topic.find().lean();

    const subjectsWithTopics = subjects.map((sub) => ({
      ...sub,
      topics: topics.filter((top) => top.subjectId.toString() === sub._id.toString()),
    }));

    res.json({ success: true, subjects: subjectsWithTopics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tests/topic/:topicId/questions - Fetch & Randomly Shuffle Test Questions
router.get('/topic/:topicId/questions', requireAuth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId).populate('subjectId');
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    let topicObjId = req.params.topicId;
    try {
      topicObjId = new mongoose.Types.ObjectId(req.params.topicId);
    } catch (e) {}

    const rawQuestions = await Question.find({
      $or: [{ topicId: req.params.topicId }, { topicId: topicObjId }]
    })
      .select('-correctOptionIndex -explanation')
      .lean();

    // Randomize question sequence for every student attempt to prevent copying
    const questions = shuffleArray(rawQuestions);

    res.json({
      success: true,
      topic: {
        _id: topic._id,
        name: topic.name,
        description: topic.description,
        timeLimitMinutes: topic.timeLimitMinutes,
        subjectName: topic.subjectId ? topic.subjectId.name : 'General',
      },
      questions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tests/submit - Submit test answers & compute score, accuracy, solutions
router.post('/submit', requireAuth, validateBody(testSubmissionSchema), async (req, res) => {
  try {
    const { topicId, timeTakenSeconds, answers = [] } = req.body;

    const topic = await Topic.findById(topicId).populate('subjectId');
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    let topicObjId = topicId;
    try {
      topicObjId = new mongoose.Types.ObjectId(topicId);
    } catch (e) {}

    const fullQuestions = await Question.find({
      $or: [{ topicId: topicId }, { topicId: topicObjId }]
    }).lean();

    // console.log(`[Submit Audit] Evaluating Topic "${topic.name}" (${topicId})`);
    // console.log(`[Submit Audit] DB Questions count: ${fullQuestions.length}, Answers payload count: ${answers.length}`);

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unansweredCount = 0;
    const processedAnswers = [];

    fullQuestions.forEach((q, idx) => {
      const qIdStr = q._id.toString();

      // Dual-layer answer lookup: 1) by questionId string match, 2) by position index fallback
      let submitted = answers.find((a) => a && a.questionId && a.questionId.toString() === qIdStr);
      if (!submitted && answers[idx]) {
        submitted = answers[idx];
      }

      let selectedIndex = null;
      if (submitted && submitted.selectedOptionIndex !== null && submitted.selectedOptionIndex !== undefined) {
        const parsedIdx = Number(submitted.selectedOptionIndex);
        if (!isNaN(parsedIdx)) {
          selectedIndex = parsedIdx;
        }
      }

      const correctIndex = Number(q.correctOptionIndex);

      let isCorrect = false;
      if (selectedIndex === null || isNaN(selectedIndex)) {
        unansweredCount++;
      } else if (selectedIndex === correctIndex) {
        correctAnswers++;
        isCorrect = true;
      } else {
        wrongAnswers++;
      }

      processedAnswers.push({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: correctIndex,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const totalQuestions = fullQuestions.length;
    // 10 points per correct answer, 0 for unanswered, -2 for incorrect answer
    const score = Math.max(0, correctAnswers * 10 - wrongAnswers * 2);
    const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const savedResult = await TestResult.create({
      studentId: req.user._id,
      studentName: req.user.name,
      collegeName: req.user.collegeName || 'Independent',
      subjectId: topic.subjectId._id,
      subjectName: topic.subjectId.name,
      topicId: topic._id,
      topicName: topic.name,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unansweredCount,
      score,
      accuracyPercentage,
      timeTakenSeconds,
      answersSubmitted: processedAnswers,
    });

    // Award XP and update streak for student
    try {
      const today = new Date().toISOString().slice(0, 10);
      const student = await User.findById(req.user._id);
      if (student && student.role === 'student') {
        // XP: 10 base + bonus for accuracy
        const xpEarned = 10 + Math.floor((savedResult.accuracyPercentage || 0) / 10) * 5;
        student.xp = (student.xp || 0) + xpEarned;
        student.level = Math.floor(student.xp / 100) + 1;

        // Streak logic
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        if (student.lastActiveDate === yesterdayStr) {
          student.streak = (student.streak || 0) + 1;
        } else if (student.lastActiveDate !== today) {
          student.streak = 1;
        }
        student.lastActiveDate = today;

        // Badge logic
        const badges = student.badges || [];
        if (!badges.includes('first_test')) badges.push('first_test');
        if (savedResult.accuracyPercentage >= 100 && !badges.includes('perfect_score')) badges.push('perfect_score');
        if (student.streak >= 7 && !badges.includes('week_streak')) badges.push('week_streak');
        if (student.streak >= 30 && !badges.includes('month_streak')) badges.push('month_streak');
        if (student.xp >= 500 && !badges.includes('xp_500')) badges.push('xp_500');
        student.badges = badges;

        await student.save({ validateBeforeSave: false });
      }
    } catch (xpErr) {
      console.error('XP update error:', xpErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Test evaluated successfully!',
      result: savedResult,
    });

  } catch (error) {
    console.error('Test Submission Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tests/me/stats - Gamification stats: XP, level, streak, badges
router.get('/me/stats', requireAuth, async (req, res) => {
  try {
    const results = await TestResult.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const totalTests = results.length;
    const xp = results.reduce((acc, r) => acc + (r.score || 0), 0);
    const level = Math.floor(xp / 100) + 1;

    // Streak: count consecutive days from today backwards
    let streak = 0;
    if (results.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const uniqueDays = [...new Set(results.map(r => {
        const d = new Date(r.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }))].sort((a, b) => b - a);

      let expected = today.getTime();
      for (const dayTs of uniqueDays) {
        if (dayTs === expected) {
          streak++;
          expected -= 86400000;
        } else if (dayTs === expected - 86400000) {
          // Yesterday also counts to start streak
          streak++;
          expected = dayTs - 86400000;
        } else {
          break;
        }
      }
    }

    // Badges
    const badges = [];
    if (totalTests >= 1) badges.push('first_test');
    if (results.some(r => r.accuracyPercentage === 100)) badges.push('perfect_score');
    if (streak >= 7) badges.push('week_streak');
    if (streak >= 30) badges.push('month_streak');
    if (xp >= 500) badges.push('xp_500');

    res.json({ success: true, xp, level, streak, totalTests, badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tests/results/my - Get current student's test history
router.get('/results/my', requireAuth, async (req, res) => {
  try {
    const results = await TestResult.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tests/result/:id - Fetch detailed result by ID
router.get('/result/:id', requireAuth, async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id).lean();
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tests/me/stats - Get current student's gamification stats
router.get('/me/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('xp level streak lastActiveDate badges name collegeName role');
    const totalTests = await TestResult.countDocuments({ studentId: req.user._id });
    const results = await TestResult.find({ studentId: req.user._id }).sort({ createdAt: -1 }).limit(5).lean();
    res.json({ success: true, stats: { xp: user.xp || 0, level: user.level || 1, streak: user.streak || 0, badges: user.badges || [], totalTests, recentResults: results } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tests/practice/submit - Practice mode: calculate score without saving to leaderboard
router.post('/practice/submit', requireAuth, async (req, res) => {
  try {
    const { questions, answers } = req.body;
    // Just calculate and return score without saving
    let correct = 0;
    const breakdown = (questions || []).map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) correct++;
      return { questionText: q.questionText, options: q.options, correctOptionIndex: q.correctOptionIndex, selectedOptionIndex: selected, isCorrect, explanation: q.explanation };
    });
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    res.json({ success: true, practice: true, correctAnswers: correct, totalQuestions: questions.length, accuracy, breakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
