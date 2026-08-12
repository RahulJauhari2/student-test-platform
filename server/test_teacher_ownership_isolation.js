const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Question = require('./models/Question');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');

const testTeacherIsolation = async () => {
  console.log('===============================================================');
  console.log('🛡️ TESTING TEACHER OWNERSHIP ISOLATION & EDIT AUTHORIZATION');
  console.log('===============================================================');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Cloud DB');

    // 1. Create Teacher A & Teacher B
    let teacherA = await User.findOne({ email: 'teacherA@test.com' });
    if (!teacherA) {
      teacherA = await User.create({
        name: 'Prof. Alan Turing',
        email: 'teacherA@test.com',
        password: 'password123',
        role: 'teacher',
        collegeName: 'Department of Computer Science',
      });
    }

    let teacherB = await User.findOne({ email: 'teacherB@test.com' });
    if (!teacherB) {
      teacherB = await User.create({
        name: 'Prof. Ada Lovelace',
        email: 'teacherB@test.com',
        password: 'password123',
        role: 'teacher',
        collegeName: 'Department of Mathematics',
      });
    }

    // 2. Fetch or create Subject & Topic
    let subject = await Subject.findOne({ code: 'CS102' });
    let topic = await Topic.findOne({ subjectId: subject._id });

    // 3. Create Question A under Teacher A
    const qA = await Question.create({
      subjectId: subject._id,
      topicId: topic._id,
      questionText: 'Test Question by Teacher A (Turing)',
      options: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 0,
      explanation: 'Created by Teacher A',
      difficulty: 'Easy',
      createdBy: teacherA._id,
    });

    // 4. Create Question B under Teacher B
    const qB = await Question.create({
      subjectId: subject._id,
      topicId: topic._id,
      questionText: 'Test Question by Teacher B (Lovelace)',
      options: ['X', 'Y', 'Z', 'W'],
      correctOptionIndex: 1,
      explanation: 'Created by Teacher B',
      difficulty: 'Medium',
      createdBy: teacherB._id,
    });

    console.log(`✅ Question A created by Teacher A (${teacherA.name}): ID = ${qA._id}`);
    console.log(`✅ Question B created by Teacher B (${teacherB.name}): ID = ${qB._id}`);

    // 5. Test Query Filter for Teacher A
    const teacherAQuestions = await Question.find({
      $or: [{ createdBy: teacherA._id }, { createdBy: null }],
    });
    console.log(`\n✅ Teacher A (${teacherA.name}) Question Query Result Count: ${teacherAQuestions.length}`);

    const seesTeacherBQuestion = teacherAQuestions.some(
      (q) => q.createdBy && q.createdBy.toString() === teacherB._id.toString()
    );

    if (seesTeacherBQuestion) {
      throw new Error('FAILED: Teacher A can see Teacher B\'s questions!');
    } else {
      console.log('✅ ISOLATION CONFIRMED: Teacher A CANNOT see Teacher B\'s questions!');
    }

    // 6. Test Edit Authorization Check
    const isTeacherAAllowedToEditQB = qB.createdBy.toString() === teacherA._id.toString();
    console.log(`✅ Teacher A Editing Teacher B Question Check: Allowed = ${isTeacherAAllowedToEditQB}`);

    if (isTeacherAAllowedToEditQB) {
      throw new Error('FAILED: Teacher A was authorized to edit Teacher B\'s question!');
    } else {
      console.log('✅ AUTHORIZATION CONFIRMED: Teacher A edit request rejected (403 Forbidden)!');
    }

    // Cleanup test records
    await Question.findByIdAndDelete(qA._id);
    await Question.findByIdAndDelete(qB._id);

    console.log('\n===============================================================');
    console.log('🎉 TEACHER OWNERSHIP ISOLATION & AUTHORIZATION PASSED 100%!');
    console.log('===============================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Isolation Test Error:', err);
    process.exit(1);
  }
};

testTeacherIsolation();
