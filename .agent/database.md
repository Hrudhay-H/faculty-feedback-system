# Database Engineering Rules

Use MongoDB with Mongoose.

## Collections

Users
Faculty
Courses
Enrollments
Questions
Feedback
FeedbackWindows

## Relationships

User
→ Student

Faculty
→ Faculty member

Course
→ Faculty

Enrollment
→ Student + Course

Feedback
→ Student + Faculty + Course + Semester

Question
→ Feedback question

FeedbackWindow
→ Semester + active period

## Important Constraints

Feedback must be unique for:

studentId
facultyId
courseId
semester

Use a compound unique index.

## Indexing

Create indexes for frequently queried fields.

At minimum consider:

User.email
Faculty.employeeId
Course.courseCode
Enrollment.studentId
Enrollment.courseId
Feedback.facultyId
Feedback.courseId
Feedback.semester

## Privacy

Never populate student identity into faculty analytics responses.

Analytics should aggregate feedback without exposing student identity.

## Data Integrity

Validate referenced IDs.

Prevent feedback submission when:

- feedback window is closed
- student is not enrolled
- faculty is not assigned to course
- feedback already exists