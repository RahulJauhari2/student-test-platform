const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    timeLimitMinutes: {
      type: Number,
      default: 5,
    },
    questionCount: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Topic', topicSchema);
