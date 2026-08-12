const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    collegeName: {
      type: String,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    wrongAnswers: {
      type: Number,
      required: true,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      required: true,
    },
    accuracyPercentage: {
      type: Number,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
      required: true,
    },
    answersSubmitted: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        questionText: String,
        options: [String],
        selectedOptionIndex: Number, // null if skipped
        correctOptionIndex: Number,
        isCorrect: Boolean,
        explanation: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestResult', testResultSchema);
