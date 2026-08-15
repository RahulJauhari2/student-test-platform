const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const connectDB = async () => {
  try {
    let dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.warn('⚠️ No MONGODB_URI found in .env file, attempting local/memory connection fallback.');
    }

    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUri || 'mongodb://127.0.0.1:27017/student_test_platform');
    console.log('✅ MongoDB Connected Successfully!');
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    // Don't exit process if called in test environment, but throw error
    throw err;
  }
};

module.exports = connectDB;

