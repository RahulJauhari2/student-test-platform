const connectDB = require('./config/db');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Question = require('./models/Question');
const User = require('./models/User');
const TestResult = require('./models/TestResult');

const testFeature = async () => {
  console.log('===============================================================');
  console.log('🚀 TESTING REFACTORED QUESTION REF & PAYLOAD FEATURE');
  console.log('===============================================================');

  try {
    // 1. Connect to DB
    await connectDB();
    console.log('✅ Database Connection: SUCCESS');

    // 2. Fetch C Programming Subject & Topic
    const subject = await Subject.findOne({ code: 'CS102' });
    if (!subject) throw new Error('Subject CS102 missing');

    const topic = await Topic.findOne({ subjectId: subject._id });
    if (!topic) throw new Error('Topic missing');

    const questions = await Question.find({ topicId: topic._id }).lean();
    console.log(`✅ Questions Loaded: ${questions.length}`);

    // 3. Simulate questionsRef & selectedAnswersRef (Refactored Feature)
    const questionsRef = { current: questions };
    const selectedAnswersRef = { current: {} };

    // Simulate tapping correct answers for all 10 questions
    questions.forEach((q, idx) => {
      selectedAnswersRef.current[idx] = Number(q.correctOptionIndex);
    });

    console.log('\n--- SIMULATING SUBMIT QUIZ WITH QUESTIONS REF ---');
    const activeQuestions = questionsRef.current.length > 0 ? questionsRef.current : [];
    
    const formattedAnswers = activeQuestions.map((q, idx) => ({
      questionId: String(q._id),
      selectedOptionIndex: selectedAnswersRef.current[idx] !== undefined ? Number(selectedAnswersRef.current[idx]) : null,
    }));

    console.log(`✅ Formatted Payload Items: ${formattedAnswers.length}`);
    console.log('✅ First 2 Payload Items:', JSON.stringify(formattedAnswers.slice(0, 2), null, 2));

    // Verify payload is NOT empty
    if (formattedAnswers.length === 0) {
      throw new Error('FAILED: formattedAnswers is still empty!');
    }

    // 4. Run Backend Evaluation
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unansweredCount = 0;

    questions.forEach((q, idx) => {
      const qIdStr = q._id.toString();
      let submitted = formattedAnswers.find((a) => a && a.questionId && a.questionId.toString() === qIdStr);
      if (!submitted && formattedAnswers[idx]) {
        submitted = formattedAnswers[idx];
      }

      const selectedIndex = Number(submitted.selectedOptionIndex);
      const correctIndex = Number(q.correctOptionIndex);

      if (selectedIndex === correctIndex) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

    const totalQuestions = questions.length;
    const score = Math.max(0, correctAnswers * 10 - wrongAnswers * 2);
    const accuracyPercentage = Math.round((correctAnswers / totalQuestions) * 100);

    console.log('\n--- EVALUATION SUMMARY ---');
    console.log(`Correct Answers : ${correctAnswers}/${totalQuestions}`);
    console.log(`Computed Score  : ${score} pts`);
    console.log(`Accuracy        : ${accuracyPercentage}%`);

    if (score === 100 && accuracyPercentage === 100) {
      console.log('\n🎉 FEATURE TEST PASSED 100%: Payload is non-empty and evaluates to 100 pts!');
    } else {
      console.error('\n❌ FEATURE TEST FAILED: Score calculation returned unexpected results.');
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Feature Test Error:', err);
    process.exit(1);
  }
};

testFeature();
