const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const TestResult = require('../models/TestResult');
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

    const testResult = await TestResult.create({
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

    res.status(201).json({
      success: true,
      message: 'Test evaluated successfully!',
      result: testResult,
    });
  } catch (error) {
    console.error('Test Submission Error:', error);
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

module.exports = router;
