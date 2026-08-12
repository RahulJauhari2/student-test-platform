const express = require('express');
const router = express.Router();
const TestResult = require('../models/TestResult');
const User = require('../models/User');

// Helper to re-evaluate or purge zero scores in DB before fetching leaderboard
const syncPastZeroScores = async () => {
  try {
    const zeroResults = await TestResult.find({ score: 0 });
    for (const result of zeroResults) {
      if (!result.answersSubmitted || result.answersSubmitted.length === 0) continue;

      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unansweredCount = 0;

      result.answersSubmitted.forEach((ans) => {
        const selIdx = (ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined)
          ? Number(ans.selectedOptionIndex)
          : null;
        const corrIdx = Number(ans.correctOptionIndex);

        if (selIdx === null || isNaN(selIdx)) {
          unansweredCount++;
          ans.isCorrect = false;
        } else if (selIdx === corrIdx) {
          correctAnswers++;
          ans.isCorrect = true;
        } else {
          wrongAnswers++;
          ans.isCorrect = false;
        }
      });

      const totalQuestions = result.answersSubmitted.length;
      const score = Math.max(0, correctAnswers * 10 - wrongAnswers * 2);
      const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      if (score > 0 || correctAnswers > 0) {
        result.correctAnswers = correctAnswers;
        result.wrongAnswers = wrongAnswers;
        result.unansweredCount = unansweredCount;
        result.score = score;
        result.accuracyPercentage = accuracyPercentage;
        await result.save();
      }
    }

    // Clean zero-answer runs where unansweredCount === totalQuestions
    await TestResult.deleteMany({
      $expr: { $eq: ['$unansweredCount', '$totalQuestions'] }
    });
  } catch (err) {
    console.error('Leaderboard Sync Error:', err.message);
  }
};

// GET /api/leaderboard - Aggregated Leaderboard
router.get('/', async (req, res) => {
  try {
    const { college, subjectId, topicId, limit = 50 } = req.query;

    // Run quick background sync to fix or purge past zero scores
    await syncPastZeroScores();

    const matchFilter = {};
    if (college) matchFilter.collegeName = new RegExp(`^${college.trim()}$`, 'i');
    if (subjectId) matchFilter.subjectId = subjectId;
    if (topicId) matchFilter.topicId = topicId;

    // Aggregate highest score per student
    const leaderboard = await TestResult.aggregate([
      { $match: matchFilter },
      {
        $sort: { score: -1, timeTakenSeconds: 1, createdAt: -1 },
      },
      {
        $group: {
          _id: '$studentId',
          studentName: { $first: '$studentName' },
          collegeName: { $first: '$collegeName' },
          highScore: { $max: '$score' },
          avgAccuracy: { $max: '$accuracyPercentage' },
          bestTimeSeconds: { $min: '$timeTakenSeconds' },
          testsTaken: { $sum: 1 },
          lastTestedAt: { $first: '$createdAt' },
        },
      },
      {
        $sort: { highScore: -1, bestTimeSeconds: 1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    // Attach rank numbers
    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      studentId: item._id,
      studentName: item.studentName,
      collegeName: item.collegeName,
      score: item.highScore,
      accuracy: Math.round(item.avgAccuracy || 0),
      timeTakenSeconds: item.bestTimeSeconds,
      testsTaken: item.testsTaken,
    }));

    // Extract list of distinct colleges for the filter dropdown
    const collegesList = await TestResult.distinct('collegeName');

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      availableColleges: collegesList.filter(Boolean),
    });
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
