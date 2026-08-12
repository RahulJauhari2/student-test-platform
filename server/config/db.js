const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let mongoMemoryServer = null;

const cleanupStaleUnansweredResults = async () => {
  try {
    const TestResult = require('../models/TestResult');

    // Re-evaluate past test results if options were stored
    const results = await TestResult.find();
    for (const result of results) {
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

    // Delete stale test runs where unansweredCount === totalQuestions (0 answers submitted in old attempts)
    const deleted = await TestResult.deleteMany({
      $expr: { $eq: ['$unansweredCount', '$totalQuestions'] }
    });

    if (deleted.deletedCount > 0) {
      console.log(`[AutoClean] 🧹 Removed ${deleted.deletedCount} old un-answered zero test runs from database.`);
    }
  } catch (err) {
    console.error('[AutoClean Error]:', err.message);
  }
};

const autoSeedInitialData = async () => {
  try {
    const Subject = require('../models/Subject');
    const Topic = require('../models/Topic');
    const Question = require('../models/Question');
    const User = require('../models/User');

    // Check if C Programming (Hindi) subject exists
    let cSubject = await Subject.findOne({ code: 'CS102' });

    if (!cSubject) {
      console.log('[AutoSeed] Populating initial Subjects, Topics & 10 Hindi C Programming questions...');

      // Seed Demo Admin, Teacher & Student if none exist
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await User.create([
          {
            name: 'Alex Mercer (Admin)',
            email: 'admin@demo.com',
            password: 'password123',
            role: 'admin',
            collegeName: 'System Administration',
            isVerified: true,
          },
          {
            name: 'Prof. Sarah Jenkins',
            email: 'teacher@demo.com',
            password: 'password123',
            role: 'teacher',
            collegeName: 'Department of Computer Science',
            isVerified: true,
          },
          {
            name: 'Rahul Sharma',
            email: 'student@demo.com',
            password: 'password123',
            role: 'student',
            collegeName: 'MIT Boston',
            isVerified: true,
          },
          {
            name: 'Priya Patel',
            email: 'priya@stanford.edu',
            password: 'password123',
            role: 'student',
            collegeName: 'Stanford University',
            isVerified: true,
          },
        ]);
      }

      // 1. Create C Programming (Hindi) Subject
      cSubject = await Subject.create({
        name: 'C Programming (हिंदी)',
        code: 'CS102',
        description: 'C भाषा के मूलभूत सिद्धांत (Variables, Loops, Functions, Arrays)',
        iconName: 'Code',
        colorGradient: 'from-emerald-500 to-teal-600',
      });

      // 2. Create standard Computer Science Subject if missing
      let csSubject = await Subject.findOne({ code: 'CS101' });
      if (!csSubject) {
        csSubject = await Subject.create({
          name: 'Computer Science',
          code: 'CS101',
          description: 'Core concepts in Algorithms, Data Structures & Web Tech',
          iconName: 'Code',
          colorGradient: 'from-blue-500 to-cyan-500',
        });

        const dsTopic = await Topic.create({
          subjectId: csSubject._id,
          name: 'Data Structures & Algorithms',
          description: 'Arrays, Binary Trees, Graphs, and Big-O Complexity Analysis',
          timeLimitMinutes: 5,
          questionCount: 2,
        });

        await Question.create([
          {
            subjectId: csSubject._id,
            topicId: dsTopic._id,
            questionText: 'What is the worst-case time complexity of Quick Sort algorithm?',
            options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(1)'],
            correctOptionIndex: 1,
            explanation: 'Quick Sort takes O(n²) in worst case.',
            difficulty: 'Medium',
          },
          {
            subjectId: csSubject._id,
            topicId: dsTopic._id,
            questionText: 'Which data structure follows the LIFO (Last In First Out) principle?',
            options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
            correctOptionIndex: 1,
            explanation: 'Stack follows LIFO.',
            difficulty: 'Easy',
          },
        ]);
      }

      // 3. Create C Language Fundamentals Topic
      const cTopic = await Topic.create({
        subjectId: cSubject._id,
        name: 'C Language Fundamentals (हिंदी)',
        description: 'C भाषा के basic syntax, data types, loops और I/O functions',
        timeLimitMinutes: 5,
        questionCount: 10,
      });

      // 4. Create 10 Hindi C Questions
      const hindiCQuestions = [
        {
          questionText: "C भाषा में प्रोग्राम की शुरुआत किस फ़ंक्शन से होती है?",
          options: ["main()", "start()", "init()", "begin()"],
          correctOptionIndex: 0,
          explanation: "हर C प्रोग्राम की execution main() फ़ंक्शन से शुरू होती है।",
          difficulty: "Easy"
        },
        {
          questionText: "C भाषा में एक variable को declare करने के लिए क्या आवश्यक है?",
          options: ["उसका नाम", "उसका data type", "दोनों नाम और data type", "कुछ भी नहीं"],
          correctOptionIndex: 2,
          explanation: "Variable declare करने के लिए नाम और data type दोनों देना ज़रूरी है।",
          difficulty: "Easy"
        },
        {
          questionText: "C में printf() फ़ंक्शन का उपयोग किसके लिए होता है?",
          options: ["इनपुट लेने के लिए", "आउटपुट दिखाने के लिए", "लूप चलाने के लिए", "फ़ाइल खोलने के लिए"],
          correctOptionIndex: 1,
          explanation: "printf() का उपयोग स्क्रीन पर आउटपुट दिखाने के लिए किया जाता है।",
          difficulty: "Easy"
        },
        {
          questionText: "scanf() फ़ंक्शन का उपयोग किसके लिए होता है?",
          options: ["आउटपुट दिखाने के लिए", "इनपुट लेने के लिए", "लूप चलाने के लिए", "फ़ाइल बंद करने के लिए"],
          correctOptionIndex: 1,
          explanation: "scanf() का उपयोग यूज़र से इनपुट लेने के लिए किया जाता है।",
          difficulty: "Easy"
        },
        {
          questionText: "C भाषा में comment लिखने के लिए कौन सा symbol इस्तेमाल होता है?",
          options: ["//", "/* */", "#", "%%"],
          correctOptionIndex: 1,
          explanation: "C में single-line comment // और multi-line comment /* */ से लिखे जाते हैं।",
          difficulty: "Easy"
        },
        {
          questionText: "C में integer data type कितने bytes लेता है (आमतौर पर)?",
          options: ["1 byte", "2 bytes", "4 bytes", "8 bytes"],
          correctOptionIndex: 2,
          explanation: "अधिकतर systems पर int 4 bytes का होता है।",
          difficulty: "Medium"
        },
        {
          questionText: "C में array क्या होता है?",
          options: ["एक single variable", "एक ही type के variables का collection", "random values का set", "function का नाम"],
          correctOptionIndex: 1,
          explanation: "Array एक ही data type के कई values को store करने का तरीका है।",
          difficulty: "Medium"
        },
        {
          questionText: "C में for loop का उपयोग किसके लिए होता है?",
          options: ["condition check करने के लिए", "repetition (दोहराव) के लिए", "function call करने के लिए", "memory allocate करने के लिए"],
          correctOptionIndex: 1,
          explanation: "for loop का उपयोग statements को बार-बार चलाने के लिए किया जाता है।",
          difficulty: "Easy"
        },
        {
          questionText: "C में string को किस data type से represent किया जाता है?",
          options: ["char array", "int array", "float array", "double array"],
          correctOptionIndex: 0,
          explanation: "C में string को char array के रूप में represent किया जाता है।",
          difficulty: "Medium"
        },
        {
          questionText: "C में header file stdio.h किस काम के लिए होती है?",
          options: ["math functions", "input-output functions", "string functions", "file handling functions"],
          correctOptionIndex: 1,
          explanation: "stdio.h में input-output functions जैसे printf() और scanf() होते हैं।",
          difficulty: "Easy"
        }
      ];

      for (const q of hindiCQuestions) {
        await Question.create({
          ...q,
          subjectId: cSubject._id,
          topicId: cTopic._id,
        });
      }

      console.log('[AutoSeed] ✅ Successfully auto-seeded "C Programming (हिंदी)" and 10 Hindi questions!');
    }

    // Auto-clean old 0-answer test runs
    await cleanupStaleUnansweredResults();
  } catch (err) {
    console.error('[AutoSeed Error]:', err.message);
  }
};

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;

    if (dbUri) {
      console.log('Connecting to MongoDB Atlas Cluster via URI:', dbUri.substring(0, 35) + '...');
      await mongoose.connect(dbUri);
      console.log('MongoDB Atlas Connected Successfully!');
    } else {
      console.log('No MONGODB_URI provided. Trying local default...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/student_test_platform', {
          serverSelectionTimeoutMS: 2000,
        });
        console.log('Connected to local MongoDB instance!');
      } catch (localErr) {
        console.log('Local MongoDB not running. Initializing MongoMemoryServer (In-Memory Database)...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memoryUri = mongoMemoryServer.getUri();
        await mongoose.connect(memoryUri);
        console.log('Connected to MongoMemoryServer at:', memoryUri);
      }
    }

    // Auto-seed initial subjects & clean stale 0-answer test runs
    await autoSeedInitialData();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
