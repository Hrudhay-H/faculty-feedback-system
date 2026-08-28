const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question ID is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 (Very Poor)'],
      max: [5, 'Rating cannot exceed 5 (Excellent)']
    }
  },
  {
    _id: false // Disable ID generation for nested rating sub-documents
  }
);

const feedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty User ID is required']
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required']
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true
    },
    ratings: {
      type: [ratingSchema],
      required: [true, 'Ratings array is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Feedback must contain at least one rating.'
      }
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment must not exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: student + faculty + course + semester
feedbackSchema.index({ studentId: 1, facultyId: 1, courseId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
