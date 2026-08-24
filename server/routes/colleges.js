const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/colleges
router.get('/', async (req, res) => {
  try {
    const colleges = await User.distinct('collegeName', { role: 'student', collegeName: { $ne: '' } });
    res.json({ success: true, colleges });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching colleges' });
  }
});

module.exports = router;
