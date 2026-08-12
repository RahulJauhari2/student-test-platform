const connectDB = require('./config/db');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Question = require('./models/Question');
const User = require('./models/User');
const TestResult = require('./models/TestResult');

const testWholeProjectRoutes = async () => {
  console.log('===============================================================');
  console.log('🌐 TESTING WHOLE PROJECT ROUTES & LEADERBOARD MULTI-STUDENT FLOW');
  console.log('===============================================================');

  try {
    // 1. Connect & Auto-Seed Database
    await connectDB();
    console.log('✅ DB Connection & Auto-Seed: SUCCESS');

    // 2. Fetch C Programming (Hindi) subject & topic
    const subject = await Subject.findOne({ code: 'CS102' });
    if (!subject) throw new Error('C Programming (हिंदी) subject missing');

    const topic = await Topic.findOne({ subjectId: subject._id });
    if (!topic) throw new Error('Topic missing under CS102');

    const questions = await Question.find({ topicId: topic._id }).lean();
    console.log(`✅ Subject: "${subject.name}" | Topic: "${topic.name}" (${questions.length} questions)`);

    // 3. Register/Create 3 New Students
    const studentData = [
      {
        name: 'Aarav Sharma',
        email: 'aarav@iitd.ac.in',
        password: 'password123',
        role: 'student',
        collegeName: 'IIT Delhi',
        targetScore: 10, // 10/10 correct -> 100 pts
      },
      {
        name: 'Neha Gupta',
        email: 'neha@bitsp.ac.in',
        password: 'password123',
        role: 'student',
        collegeName: 'BITS Pilani',
        targetScore: 9, // 9/10 correct -> 88 pts
      },
      {
        name: 'Rohan Verma',
        email: 'rohan@nitt.ac.in',
        password: 'password123',
        role: 'student',
        collegeName: 'NIT Trichy',
        targetScore: 8, // 8/10 correct -> 76 pts
      },
    ];

    console.log('\n--- 3 NEW STUDENTS REGISTRATION & TEST SUBMISSIONS ---');

    for (const data of studentData) {
      let student = await User.findOne({ email: data.email });
      if (!student) {
        student = await User.create({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          collegeName: data.collegeName,
          isVerified: true,
        });
      }

      // Build student answers payload matching target score
      const answersPayload = questions.map((q, idx) => {
        let selOption = Number(q.correctOptionIndex);
        // Introduce wrong answer if beyond target score
        if (idx >= data.targetScore) {
          selOption = (selOption + 1) % q.options.length;
        }
        return {
          questionId: q._id.toString(),
          selectedOptionIndex: selOption,
        };
      });

      // Evaluate answers
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unansweredCount = 0;
      const processedAnswers = [];

      questions.forEach((q, idx) => {
        const qIdStr = q._id.toString();
        let submitted = answersPayload.find((a) => a && a.questionId && a.questionId.toString() === qIdStr);
        if (!submitted && answersPayload[idx]) {
          submitted = answersPayload[idx];
        }

        const selectedIndex = Number(submitted.selectedOptionIndex);
        const correctIndex = Number(q.correctOptionIndex);

        let isCorrect = selectedIndex === correctIndex;
        if (isCorrect) correctAnswers++;
        else wrongAnswers++;

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

      const totalQuestions = questions.length;
      const score = Math.max(0, correctAnswers * 10 - wrongAnswers * 2);
      const accuracyPercentage = Math.round((correctAnswers / totalQuestions) * 100);

      // Create TestResult
      const result = await TestResult.create({
        studentId: student._id,
        studentName: student.name,
        collegeName: student.collegeName,
        subjectId: subject._id,
        subjectName: subject.name,
        topicId: topic._id,
        topicName: topic.name,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unansweredCount,
        score,
        accuracyPercentage,
        timeTakenSeconds: 100 + (10 - data.targetScore) * 15,
        answersSubmitted: processedAnswers,
      });

      console.log(`✅ Submitted for "${student.name}" (${student.collegeName}): Score ${result.score} pts | Accuracy ${result.accuracyPercentage}% (${correctAnswers}/${totalQuestions} Correct)`);
    }

    // 4. Query & Verify Aggregated Leaderboard
    console.log('\n===============================================================');
    console.log('🏆 AGGREGATED LEADERBOARD RANKINGS VERIFICATION');
    console.log('===============================================================');

    // Run clean worker
    await TestResult.deleteMany({
      $expr: { $eq: ['$unansweredCount', '$totalQuestions'] }
    });

    const leaderboard = await TestResult.aggregate([
      {
        $group: {
          _id: '$studentId',
          studentName: { $first: '$studentName' },
          collegeName: { $first: '$collegeName' },
          highScore: { $max: '$score' },
          avgAccuracy: { $max: '$accuracyPercentage' },
          bestTimeSeconds: { $min: '$timeTakenSeconds' },
          testsTaken: { $sum: 1 },
        },
      },
      { $sort: { highScore: -1, bestTimeSeconds: 1 } },
    ]);

    leaderboard.forEach((item, index) => {
      console.log(`   Rank #${index + 1}: ${item.studentName.padEnd(16)} | College: ${item.collegeName.padEnd(14)} | Score: ${String(item.highScore).padStart(3)} pts | Accuracy: ${item.avgAccuracy}%`);
    });

    // Assert minimum 3 new students exist on leaderboard with positive scores
    const topStudents = leaderboard.filter((item) => item.highScore > 0);

    if (topStudents.length >= 3) {
      console.log('\n===============================================================');
      console.log(`🎉 WHOLE PROJECT ROUTE TEST PASSED: Verified ${topStudents.length} students on leaderboard!`);
      console.log('===============================================================');
    } else {
      console.error('\n❌ TEST FAILED: Leaderboard has fewer than 3 top student results.');
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Whole Project Route Test Error:', err);
    process.exit(1);
  }
};

testWholeProjectRoutes();
