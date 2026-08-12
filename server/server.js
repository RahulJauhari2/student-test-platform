const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');
const { authLimiter, apiLimiter, securityHeaders } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Allow origins for seamless local dev & bulk API calls
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Apply Security Headers & Global Rate Limiting
app.use(securityHeaders);
app.use('/api', apiLimiter);

// Support large bulk JSON & CSV payloads (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes (Strict Auth Rate Limiter applied to Auth Endpoints)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Student Test Platform API Server Running',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Global Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Student Test Platform Backend Server active on port ${PORT}`);
  console.log(`🔒 Production Security & Rate Limiting Enabled`);
  console.log(`==================================================`);
});
