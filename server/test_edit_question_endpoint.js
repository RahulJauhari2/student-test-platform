const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Question = require('./models/Question');

const testEdit = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const questionId = '6a7c698faaed1839d5bad341';
    let q = await Question.findById(questionId);
    
    if (!q) {
      console.log('Question not found by exact ID, searching any Hindi question...');
      q = await Question.findOne({ questionText: /string/i });
    }

    if (!q) {
      console.error('No question found to edit!');
      process.exit(1);
    }

    console.log('Original Question:', q);

    // Update fields
    q.questionText = q.questionText + ' (Updated)';
    q.difficulty = 'Easy';
    await q.save();

    console.log('✅ Successfully updated question in DB:', q.questionText);
    process.exit(0);
  } catch (err) {
    console.error('Edit error:', err);
    process.exit(1);
  }
};

testEdit();
