const zod = require('zod');
const mongoose = require('mongoose');

// Helper to validate Mongoose ObjectIds
const objectIdSchema = zod.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format'
});

// Student Schemas
const studentCreateSchema = zod.object({
  name: zod.string().min(1, 'Name is required').trim(),
  email: zod.string().email('Invalid email address').trim(),
  password: zod.string().min(6, 'Password must be at least 6 characters')
});

const studentUpdateSchema = zod.object({
  name: zod.string().min(1, 'Name is required').trim().optional(),
  email: zod.string().email('Invalid email address').trim().optional(),
  password: zod.string().min(6, 'Password must be at least 6 characters').optional()
});

// Faculty Schemas
const facultyCreateSchema = zod.object({
  name: zod.string().min(1, 'Name is required').trim(),
  email: zod.string().email('Invalid email address').trim(),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  employeeId: zod.string().min(1, 'Employee ID is required').trim(),
  department: zod.string().min(1, 'Department is required').trim()
});

const facultyUpdateSchema = zod.object({
  name: zod.string().min(1, 'Name is required').trim().optional(),
  email: zod.string().email('Invalid email address').trim().optional(),
  password: zod.string().min(6, 'Password must be at least 6 characters').optional(),
  employeeId: zod.string().min(1, 'Employee ID is required').trim().optional(),
  department: zod.string().min(1, 'Department is required').trim().optional()
});

// Course Schemas
const courseCreateSchema = zod.object({
  courseName: zod.string().min(1, 'Course Name is required').trim(),
  courseCode: zod.string().min(1, 'Course Code is required').trim().transform((val) => val.toUpperCase()),
  credits: zod.number().min(1, 'Credits must be at least 1').max(6, 'Credits cannot exceed 6'),
  facultyId: objectIdSchema,
  semester: zod.string().min(1, 'Semester is required').trim()
});

const courseUpdateSchema = zod.object({
  courseName: zod.string().min(1, 'Course Name is required').trim().optional(),
  courseCode: zod.string().min(1, 'Course Code is required').trim().transform((val) => val.toUpperCase()).optional(),
  credits: zod.number().min(1, 'Credits must be at least 1').max(6, 'Credits cannot exceed 6').optional(),
  facultyId: objectIdSchema.optional(),
  semester: zod.string().min(1, 'Semester is required').trim().optional()
});

// Enrollment Schemas
const enrollmentCreateSchema = zod.object({
  studentId: objectIdSchema,
  courseId: objectIdSchema
});

// Question Schemas
const questionCreateSchema = zod.object({
  text: zod.string().min(1, 'Question text is required').trim(),
  isActive: zod.boolean().optional()
});

const questionUpdateSchema = zod.object({
  text: zod.string().min(1, 'Question text is required').trim().optional(),
  isActive: zod.boolean().optional()
});

// Window Schemas
const windowCreateSchema = zod.object({
  semester: zod.string().min(1, 'Semester is required').trim(),
  startDate: zod.string().transform((val) => new Date(val)),
  endDate: zod.string().transform((val) => new Date(val))
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate']
});

module.exports = {
  objectIdSchema,
  studentCreateSchema,
  studentUpdateSchema,
  facultyCreateSchema,
  facultyUpdateSchema,
  courseCreateSchema,
  courseUpdateSchema,
  enrollmentCreateSchema,
  questionCreateSchema,
  questionUpdateSchema,
  windowCreateSchema
};
