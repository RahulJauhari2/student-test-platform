const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Question = require('./models/Question');
const User = require('./models/User');
const TestResult = require('./models/TestResult');

const insertAtlasData = async () => {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB Atlas Cluster:', uri);

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas Cloud Database!');

    // 1. Ensure Subject & Topic exist in Atlas DB
    let cSubject = await Subject.findOne({ code: 'CS102' });
    if (!cSubject) {
      cSubject = await Subject.create({
        name: 'C Programming (हिंदी)',
        code: 'CS102',
        description: 'C भाषा के मूलभूत सिद्धांत',
        iconName: 'Code',
        colorGradient: 'from-emerald-500 to-teal-600',
      });
    }

    let cTopic = await Topic.findOne({ subjectId: cSubject._id });
    if (!cTopic) {
      cTopic = await Topic.create({
        subjectId: cSubject._id,
        name: 'C Language Fundamentals (हिंदी)',
        description: 'C भाषा के basic syntax, data types, loops और I/O functions',
        timeLimitMinutes: 5,
        questionCount: 10,
      });
    }

    // 2. Fetch Questions
    let questions = await Question.find({ topicId: cTopic._id }).lean();
    if (questions.length === 0) {
      console.log('Seeding Hindi questions into Atlas DB...');
      const hindiCQuestions = [
        { questionText: "C भाषा में प्रोग्राम की शुरुआत किस फ़ंक्शन से होती है?", options: ["main()", "start()", "init()", "begin()"], correctOptionIndex: 0, explanation: "main() execution start", difficulty: "Easy" },
        { questionText: "C भाषा में एक variable को declare करने के लिए क्या आवश्यक है?", options: ["उसका नाम", "उसका data type", "दोनों नाम और data type", "कुछ भी नहीं"], correctOptionIndex: 2, explanation: "both required", difficulty: "Easy" },
        { questionText: "C में printf() फ़ंक्शन का उपयोग किसके लिए होता है?", options: ["इनपुट लेने के लिए", "आउटपुट दिखाने के लिए", "लूप चलाने के लिए", "फ़ाइल खोलने के लिए"], correctOptionIndex: 1, explanation: "output function", difficulty: "Easy" },
        { questionText: "scanf() फ़ंक्शन का उपयोग किसके लिए होता है?", options: ["आउटपुट दिखाने के लिए", "इनपुट लेने के लिए", "लूप चलाने के लिए", "फ़ाइल बंद करने के लिए"], correctOptionIndex: 1, explanation: "input function", difficulty: "Easy" },
        { questionText: "C भाषा में comment लिखने के लिए कौन सा symbol इस्तेमाल होता है?", options: ["//", "/* */", "#", "%%"], correctOptionIndex: 1, explanation: "comment syntax", difficulty: "Easy" },
        { questionText: "C में integer data type कितने bytes लेता है (आमतौर पर)?", options: ["1 byte", "2 bytes", "4 bytes", "8 bytes"], correctOptionIndex: 2, explanation: "4 bytes", difficulty: "Medium" },
        { questionText: "C में array क्या होता है?", options: ["एक single variable", "एक ही type के variables का collection", "random values का set", "function का नाम"], correctOptionIndex: 1, explanation: "collection of same type", difficulty: "Medium" },
        { questionText: "C में for loop का उपयोग किसके लिए होता है?", options: ["condition check करने के लिए", "repetition (दोहराव) के लिए", "function call करने के लिए", "memory allocate करने के लिए"], correctOptionIndex: 1, explanation: "looping", difficulty: "Easy" },
        { questionText: "C में string को किस data type से represent किया जाता है?", options: ["char array", "int array", "float array", "double array"], correctOptionIndex: 0, explanation: "char array", difficulty: "Medium" },
        { questionText: "C में header file stdio.h किस काम के लिए होती है?", options: ["math functions", "input-output functions", "string functions", "file handling functions"], correctOptionIndex: 1, explanation: "stdio.h I/O", difficulty: "Easy" }
      ];
      for (const q of hindiCQuestions) {
        await Question.create({ ...q, subjectId: cSubject._id, topicId: cTopic._id });
      }
      questions = await Question.find({ topicId: cTopic._id }).lean();
    }

    console.log(`✅ Questions ready in Atlas DB: ${questions.length}`);

    // 3. Create 3 Students & Insert Test Results directly into Atlas DB
    const studentsToInsert = [
      { name: 'Aarav Sharma', email: 'aarav@iitd.ac.in', collegeName: 'IIT Delhi', correctCount: 10 },
      { name: 'Neha Gupta', email: 'neha@bitsp.ac.in', collegeName: 'BITS Pilani', correctCount: 9 },
      { name: 'Rohan Verma', email: 'rohan@nitt.ac.in', collegeName: 'NIT Trichy', correctCount: 8 },
    ];

    for (const st of studentsToInsert) {
      let userDoc = await User.findOne({ email: st.email });
      if (!userDoc) {
        userDoc = await User.create({
          name: st.name,
          email: st.email,
          password: 'password123',
          role: 'student',
          collegeName: st.collegeName,
          isVerified: true,
        });
      }

      const answersSubmitted = questions.map((q, idx) => {
        const isCorrect = idx < st.correctCount;
        const selIdx = isCorrect ? Number(q.correctOptionIndex) : (Number(q.correctOptionIndex) + 1) % q.options.length;
        return {
          questionId: q._id,
          questionText: q.questionText,
          options: q.options,
          selectedOptionIndex: selIdx,
          correctOptionIndex: Number(q.correctOptionIndex),
          isCorrect,
          explanation: q.explanation,
        };
      });

      const totalQuestions = questions.length;
      const correctAnswers = st.correctCount;
      const wrongAnswers = totalQuestions - st.correctCount;
      const score = Math.max(0, correctAnswers * 10 - wrongAnswers * 2);
      const accuracyPercentage = Math.round((correctAnswers / totalQuestions) * 100);

      const resultDoc = await TestResult.create({
        studentId: userDoc._id,
        studentName: userDoc.name,
        collegeName: userDoc.collegeName,
        subjectId: cSubject._id,
        subjectName: cSubject.name,
        topicId: cTopic._id,
        topicName: cTopic.name,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unansweredCount: 0,
        score,
        accuracyPercentage,
        timeTakenSeconds: 120,
        answersSubmitted,
      });

      console.log(`📌 INSERTED INTO ATLAS DB [testresults]: ID=${resultDoc._id} | Student=${resultDoc.studentName} (${resultDoc.collegeName}) | Score=${resultDoc.score} pts`);
    }

    console.log('\n=============================================================');
    console.log('🎉 SUCCESSFULLY INSERTED NEW RECORDS INTO ATLAS DB (testresults)!');
    console.log('=============================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Atlas DB Insert Error:', err);
    process.exit(1);
  }
};

insertAtlasData();
