const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student User ID is required']
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
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee a student is only enrolled in a course once per semester
enrollmentSchema.index({ studentId: 1, courseId: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
