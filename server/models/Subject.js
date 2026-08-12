const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    iconName: {
      type: String,
      default: 'BookOpen',
    },
    colorGradient: {
      type: String,
      default: 'from-blue-500 to-indigo-600',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
