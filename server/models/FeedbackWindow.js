const mongoose = require('mongoose');

const feedbackWindowSchema = new mongoose.Schema(
  {
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      unique: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FeedbackWindow', feedbackWindowSchema);
