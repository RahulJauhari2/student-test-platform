const dotenv = require('dotenv');
const mongoose = namespace = require('mongoose');

dotenv.config();

const connectDB = async () => {
  try {
    // Use environment variable first, fallback to hardcoded string if needed
    let dbUri = process.env.MONGODB_URI || 'mongodb+srv://poonamsaxena281_db_user:0S0vizvypLDztjv8@cluster0.rjueieo.mongodb.net/abvic';
    
    if (!dbUri) {
      console.warn('No MONGODB_URI found in environment variables.');
    }

    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds instead of hanging
    });
    
    console.log('MongoDB Connected Successfully!');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    throw err;
  }
};

module.exports = connectDB;