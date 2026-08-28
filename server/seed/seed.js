const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Question = require('../models/Question');
const Feedback = require('../models/Feedback');
const FeedbackWindow = require('../models/FeedbackWindow');

const SEED_SEMESTER = 'Fall 2026';

const seedDatabase = async () => {
  try {
    // 1. Establish database connection
    console.log('Connecting to database for seeding...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected successfully to database.');

    // 2. Clear existing entries to start clean
    console.log('Purging existing documents...');
    await User.deleteMany({});
    await Faculty.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Question.deleteMany({});
    await Feedback.deleteMany({});
    await FeedbackWindow.deleteMany({});
    console.log('Successfully purged all collections.');

    // 3. Create Admin
    console.log('Creating System Administrator account...');
    await User.create({
      name: 'System Administrator',
      email: 'admin@university.edu',
      password: 'adminpassword', // Will be hashed by pre-save hook
      role: 'ADMIN'
    });
    console.log('System Administrator account loaded.');

    // 4. Create 5 Faculty Users & Profiles
    console.log('Creating 5 Faculty users and departmental profiles...');
    const facultyUsers = [];
    const facultyData = [
      { name: 'Dr. John Smith', email: 'john.smith@university.edu', empId: 'FAC001', dept: 'Computer Science' },
      { name: 'Dr. Alice Johnson', email: 'alice.johnson@university.edu', empId: 'FAC002', dept: 'Computer Science' },
      { name: 'Prof. Robert Miller', email: 'robert.miller@university.edu', empId: 'FAC003', dept: 'Electrical Engineering' },
      { name: 'Dr. Sarah Davis', email: 'sarah.davis@university.edu', empId: 'FAC004', dept: 'Mathematics' },
      { name: 'Prof. David Wilson', email: 'david.wilson@university.edu', empId: 'FAC005', dept: 'Physics' }
    ];

    for (const f of facultyData) {
      const u = await User.create({
        name: f.name,
        email: f.email,
        password: 'facultypassword',
        role: 'FACULTY'
      });
      await Faculty.create({
        userId: u._id,
        employeeId: f.empId,
        department: f.dept
      });
      facultyUsers.push(u);
    }
    console.log('5 Faculty users and profiles loaded.');

    // 5. Create 20 Students
    console.log('Creating 20 Student user accounts...');
    const students = [];
    for (let i = 1; i <= 20; i++) {
      const student = await User.create({
        name: `Student Number ${i}`,
        email: `student${i}@student.university.edu`,
        password: 'studentpassword',
        role: 'STUDENT'
      });
      students.push(student);
    }
    console.log('20 Student user accounts loaded.');

    // 6. Create 5 Courses
    console.log('Creating 5 Course catalogs and faculty assignments...');
    const courseData = [
      { name: 'Database Management Systems', code: 'CS301', credits: 4, facultyIndex: 0 },
      { name: 'Analysis of Algorithms', code: 'CS302', credits: 4, facultyIndex: 1 },
      { name: 'Introduction to Electronics', code: 'EE101', credits: 3, facultyIndex: 2 },
      { name: 'Advanced Calculus', code: 'MA201', credits: 4, facultyIndex: 3 },
      { name: 'Quantum Physics', code: 'PH401', credits: 3, facultyIndex: 4 }
    ];

    const courses = [];
    for (const c of courseData) {
      const course = await Course.create({
        courseName: c.name,
        courseCode: c.code,
        credits: c.credits,
        facultyId: facultyUsers[c.facultyIndex]._id,
        semester: SEED_SEMESTER
      });
      courses.push(course);
    }
    console.log('5 Course records loaded.');

    // 7. Create Enrollments (linking students to courses)
    console.log('Establishing Student-to-Course Enrollments...');
    // Students 1 to 10 are enrolled in Courses 0, 1, and 3
    // Students 11 to 20 are enrolled in Courses 1, 2, and 4
    for (let i = 0; i < students.length; i++) {
      const studentId = students[i]._id;
      if (i < 10) {
        await Enrollment.create({ studentId, courseId: courses[0]._id, semester: SEED_SEMESTER });
        await Enrollment.create({ studentId, courseId: courses[1]._id, semester: SEED_SEMESTER });
        await Enrollment.create({ studentId, courseId: courses[3]._id, semester: SEED_SEMESTER });
      } else {
        await Enrollment.create({ studentId, courseId: courses[1]._id, semester: SEED_SEMESTER });
        await Enrollment.create({ studentId, courseId: courses[2]._id, semester: SEED_SEMESTER });
        await Enrollment.create({ studentId, courseId: courses[4]._id, semester: SEED_SEMESTER });
      }
    }
    console.log('Student enrollment entries mapped.');

    // 8. Create Questionnaire Bank
    console.log('Creating standard evaluation questions...');
    const questionsText = [
      'The instructor explains course topics clearly and effectively.',
      'The instructor is punctual and conducts classes regularly.',
      'The instructor is accessible for guidance outside class hours.',
      'The instructor provides helpful and timely feedback on evaluations.',
      'The instructor stimulates interest in the subject matter.',
      'The course material (syllabus, slides, tasks) is well-structured.'
    ];

    for (const qText of questionsText) {
      await Question.create({ text: qText, isActive: true });
    }
    console.log('Question bank loaded.');

    // 9. Create Active Feedback Window
    console.log('Setting up active Feedback Window for the semester...');
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const window = await FeedbackWindow.create({
      semester: SEED_SEMESTER,
      startDate: lastMonth,
      endDate: nextMonth
    });
    console.log(`Feedback window registered for semester: ${window.semester} (${window.startDate.toDateString()} to ${window.endDate.toDateString()}).`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
