const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Question = require('./models/Question');

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

const seedHindiC = async () => {
  try {
    await connectDB();
    console.log('Connecting to database...');

    // Find or create C Programming subject
    let cSubject = await Subject.findOne({ code: 'CS102' });
    if (!cSubject) {
      cSubject = await Subject.create({
        name: 'C Programming (हिंदी)',
        code: 'CS102',
        description: 'C भाषा के मूलभूत सिद्धांत (Variables, Loops, Functions, Arrays)',
        iconName: 'Code',
        colorGradient: 'from-emerald-500 to-teal-600',
      });
    }

    // Find or create C Basics topic
    let cTopic = await Topic.findOne({ subjectId: cSubject._id, name: 'C Language Fundamentals' });
    if (!cTopic) {
      cTopic = await Topic.create({
        subjectId: cSubject._id,
        name: 'C Language Fundamentals',
        description: 'C भाषा के basic syntax, data types, loops और I/O functions',
        timeLimitMinutes: 5,
        questionCount: hindiCQuestions.length,
      });
    }

    console.log('Inserting 10 Hindi C Programming questions...');
    for (const q of hindiCQuestions) {
      await Question.create({
        ...q,
        subjectId: cSubject._id,
        topicId: cTopic._id,
      });
    }

    await Topic.findByIdAndUpdate(cTopic._id, { $set: { questionCount: hindiCQuestions.length } });

    console.log('✅ Successfully inserted 10 Hindi C Programming questions!');
    process.exit(0);
  } catch (err) {
    console.error('Error inserting Hindi questions:', err);
    process.exit(1);
  }
};

seedHindiC();
