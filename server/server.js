const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { securityHeaders, apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

const app = express();

// Security and Rate Limiting Middleware
app.use(securityHeaders);
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for hosting environments
    },
    credentials: true,
  })
);

// Apply auth rate limiting specifically to auth routes, and global apiLimiter to rest
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/colleges', apiLimiter, require('./routes/colleges'));
app.use('/api/admin', apiLimiter, require('./routes/admin'));
app.use('/api/tests', apiLimiter, require('./routes/tests'));
app.use('/api/leaderboard', apiLimiter, require('./routes/leaderboard'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: '🚀 Student Test Platform API Backend is running.' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error: ' + err.message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server due to DB connection failure:', err);
});

module.exports = app;

