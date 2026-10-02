const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const User = require('../models/User');
const TestResult = require('../models/TestResult');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { subjectSchema, topicSchema, questionSchema, bulkQuestionSchema } = require('../validators/schemas');

// Apply Auth and Admin/Teacher Guard to all routes in this file
router.use(requireAuth, requireRole('admin', 'teacher'));

// GET /api/admin/teachers - List all registered teachers
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/students - List all registered students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/suspend - Toggle user suspension
router.put('/users/:id/suspend', async (req, res) => {
  try {
    // Only Admin can suspend users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Prevent admin from suspending themselves
    if (targetUser._id.toString() === req.user._id.toString()) {
       return res.status(400).json({ success: false, message: 'Cannot suspend yourself' });
    }

    targetUser.isSuspended = !targetUser.isSuspended;
    await targetUser.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${targetUser.isSuspended ? 'suspended' : 'unsuspended'} successfully!`, user: targetUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    // Only Admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (targetUser._id.toString() === req.user._id.toString()) {
       return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (targetUser._id.toString() === req.user._id.toString()) {
       return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    targetUser.role = role;
    await targetUser.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User role updated to ${role} successfully!`, user: targetUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// GET /api/admin/analytics - Class-wide Teacher Analytics & Performance Metrics Report
router.get('/analytics', async (req, res) => {
  try {
    const allResults = await TestResult.find().sort({ createdAt: -1 }).lean();

    if (allResults.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalSubmissions: 0,
          avgScore: 0,
          avgAccuracy: 0,
          passRatePercentage: 0,
          topStudents: [],
          recentResults: [],
        },
      });
    }

    const totalSubmissions = allResults.length;
    const totalScoreSum = allResults.reduce((acc, r) => acc + (r.score || 0), 0);
    const totalAccuracySum = allResults.reduce((acc, r) => acc + (r.accuracyPercentage || 0), 0);
    const passingCount = allResults.filter((r) => (r.accuracyPercentage || 0) >= 60).length;

    const avgScore = Math.round(totalScoreSum / totalSubmissions);
    const avgAccuracy = Math.round(totalAccuracySum / totalSubmissions);
    const passRatePercentage = Math.round((passingCount / totalSubmissions) * 100);

    // Top 5 Students Leaderboard
    const studentScoreMap = {};
    allResults.forEach((r) => {
      const sId = r.studentId.toString();
      if (!studentScoreMap[sId] || r.score > studentScoreMap[sId].highScore) {
        studentScoreMap[sId] = {
          name: r.studentName,
          college: r.collegeName,
          highScore: r.score,
          accuracy: r.accuracyPercentage,
          date: r.createdAt,
        };
      }
    });

    const topStudents = Object.values(studentScoreMap)
      .sort((a, b) => b.highScore - a.highScore)
      .slice(0, 5);

    res.json({
      success: true,
      analytics: {
        totalSubmissions,
        avgScore,
        avgAccuracy,
        passRatePercentage,
        topStudents,
        recentResults: allResults.slice(0, 10),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/questions - List questions (Admin sees all, Teacher sees ONLY their own created questions)
router.get('/questions', async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher') {
      filter = { createdBy: req.user._id };
    }

    const questions = await Question.find(filter)
      .populate('subjectId', 'name code')
      .populate('topicId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/questions/:id - Edit an existing question with strict Teacher ownership guard
router.put('/questions/:id', async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Strict Teacher ownership check
    if (req.user.role === 'teacher') {
      const authorId = q.createdBy ? q.createdBy.toString() : '';
      const userId = req.user._id ? req.user._id.toString() : '';
      if (!authorId || authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only edit questions created by you.',
        });
      }
    }

    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Question updated successfully!', question: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/questions/:id - Delete a question with strict Teacher ownership guard
router.delete('/questions/:id', async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Strict Teacher ownership check
    if (req.user.role === 'teacher') {
      const authorId = q.createdBy ? q.createdBy.toString() : '';
      const userId = req.user._id ? req.user._id.toString() : '';
      if (!authorId || authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only delete questions created by you.',
        });
      }
    }

    await Question.findByIdAndDelete(req.params.id);
    await Topic.findByIdAndUpdate(q.topicId, { $inc: { questionCount: -1 } });

    res.json({ success: true, message: 'Question deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/questions/bulk-delete - Bulk delete multiple questions by IDs
router.delete('/questions/bulk-delete', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can bulk delete questions.' });
    }
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No question IDs provided.' });
    }

    // Get all questions to be deleted so we can update topic counts
    const questionsToDelete = await Question.find({ _id: { $in: ids } }).lean();

    // Count per topic for decrement
    const countsByTopic = {};
    questionsToDelete.forEach((q) => {
      const tid = q.topicId?.toString();
      if (tid) countsByTopic[tid] = (countsByTopic[tid] || 0) + 1;
    });

    await Question.deleteMany({ _id: { $in: ids } });

    for (const [topId, count] of Object.entries(countsByTopic)) {
      await Topic.findByIdAndUpdate(topId, { $inc: { questionCount: -count } });
    }

    res.json({ success: true, message: `Successfully deleted ${questionsToDelete.length} questions.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/subjects/:id - Delete a subject and all its topics & questions (admin only)
router.delete('/subjects/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete subjects.' });
    }
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });

    // Delete all questions for this subject
    await Question.deleteMany({ subjectId: req.params.id });
    // Delete all topics for this subject
    await Topic.deleteMany({ subjectId: req.params.id });
    // Delete the subject itself
    await Subject.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: `Subject "${subject.name}" and all its topics & questions deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/topics/:id - Delete a topic and all its questions (admin only)
router.delete('/topics/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete topics.' });
    }
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });

    // Delete all questions for this topic
    await Question.deleteMany({ topicId: req.params.id });
    // Delete the topic itself
    await Topic.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: `Topic "${topic.name}" and all its questions deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/questions/bulk - Bulk Upload Questions with createdBy tracking
router.post(
  '/questions/bulk',
  validateBody(bulkQuestionSchema),
  async (req, res) => {
    try {
      const { questions } = req.body;
      const questionsWithAuthor = questions.map((q) => ({
        ...q,
        createdBy: req.user._id,
      }));

      const inserted = await Question.insertMany(questionsWithAuthor);

      const countsByTopic = {};
      questions.forEach((q) => {
        countsByTopic[q.topicId] = (countsByTopic[q.topicId] || 0) + 1;
      });

      for (const [topId, count] of Object.entries(countsByTopic)) {
        await Topic.findByIdAndUpdate(topId, { $inc: { questionCount: count } });
      }

      res.status(201).json({
        success: true,
        message: `Successfully bulk imported ${inserted.length} questions!`,
        count: inserted.length,
      });
    } catch (error) {
      console.error('Bulk Upload Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/admin/questions - Create single question with createdBy tracking
router.post('/questions', validateBody(questionSchema), async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };
    const question = await Question.create(payload);
    await Topic.findByIdAndUpdate(req.body.topicId, { $inc: { questionCount: 1 } });
    res.status(201).json({ success: true, message: 'Question created successfully', question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/subjects - Create new subject
router.post('/subjects', validateBody(subjectSchema), async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, message: 'Subject created successfully', subject });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Subject with this name or code already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/topics - Create new topic under a subject
router.post('/topics', validateBody(topicSchema), async (req, res) => {
  try {
    const topic = await Topic.create(req.body);
    res.status(201).json({ success: true, message: 'Topic created successfully', topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/stats - Admin platform overview analytics
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalSubjects = await Subject.countDocuments();
    const totalTopics = await Topic.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalTestsTaken = await TestResult.countDocuments();

    const recentResults = await TestResult.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalTopics,
        totalQuestions,
        totalTestsTaken,
      },
      recentResults,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
