# Database Specifications - Faculty Feedback System

This document outlines the MongoDB schema designs, collection definitions, relational modeling, indexes, and constraints for the Faculty Feedback System using Mongoose (ODM).

---

## 1. Database Collections Overview

The database contains seven collections:
1. `users`: Auth accounts for students, faculty, and admins.
2. `faculties`: Detailed profiles of instructors (linked to users).
3. `courses`: Academic courses assigned to teachers.
4. `enrollments`: Mapping of students to courses they take.
5. `questions`: Feedback question bank.
6. `feedbacks`: Numerical evaluations and textual comments.
7. `feedbackwindows`: Timestamps defining active survey periods.

---

## 2. Collection Schemas & Fields

### 2.1. User Schema (`users`)
Stores base user accounts for authentication and basic profile info.

| Field Name | Type | Validations | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Primary | Unique document identifier. |
| `name` | String | Required, trim | None | Full name of the user. |
| `email` | String | Required, lowercase, unique | Secondary (Unique) | Academic email address. |
| `password` | String | Required | None | Bcrypt-hashed password. |
| `role` | String | Required, Enum: `['STUDENT', 'FACULTY', 'ADMIN']` | None | Defines route clearance. |
| `createdAt` | Date | Auto-populated | None | Document insertion timestamp. |
| `updatedAt` | Date | Auto-populated | None | Document update timestamp. |

### 2.2. Faculty Schema (`faculties`)
Extends user records for faculty specific academic details.

| Field Name | Type | Validations | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Primary | Unique identifier. |
| `userId` | ObjectId | Required, Ref: `users`, Unique | Secondary | Reference to corresponding user document. |
| `employeeId`| String | Required, unique, trim | Secondary (Unique) | University employee ID. |
| `department`| String | Required, trim | None | Faculty department (e.g. "Computer Science"). |

### 2.3. Course Schema (`courses`)
Stores course catalogs along with assignments to semester and faculty.

| Field Name | Type | Validations | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Primary | Unique identifier. |
| `courseName`| String | Required, trim | None | Title of course (e.g. "Computer Networks"). |
| `courseCode`| String | Required, unique, uppercase, trim| Secondary (Unique) | Code (e.g. "CS302"). |
| `credits` | Number | Required, Min: 1, Max: 6 | None | Credit weight of course. |
| `facultyId` | ObjectId | Required, Ref: `users` | Secondary | The faculty teaching the course. |
| `semester` | String | Required, trim | Secondary | Target semester (e.g. "Fall 2026"). |

### 2.4. Enrollment Schema (`enrollments`)
Establishes many-to-many relationship mapping students to courses.

| Field Name | Type | Validations | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Primary | Unique identifier. |
| `studentId` | ObjectId | Required, Ref: `users` | Secondary | Enrolled student ID. |
| `courseId` | ObjectId | Required, Ref: `courses` | Secondary | Enrolled course ID. |
| `semester` | String | Required | Secondary | Current academic semester. |

*Compound Unique Index*: `{ studentId: 1, courseId: 1, semester: 1 }` to prevent duplicate enrollments for a course in the same semester.

### 2.5. Question Schema (`questions`)
The survey questions compiled by the admin.

| Field Name | Type | Validations | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Primary | Unique identifier. |
| `text` | String | Required, trim | None | The question text (e.g. "Explains clearly"). |
| `isActive` | Boolean | Default: `true` | None | Controls whether it is served to students. |

### 2.6. Feedback Schema (`feedbacks`)
Numerical and text evaluations submitted by students.

| Field Name | Type | Validations | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Primary | Unique identifier. |
| `studentId` | ObjectId | Required, Ref: `users` | Secondary | Submitting student's ID. |
| `facultyId` | ObjectId | Required, Ref: `users` | Secondary | Evaluated teacher's ID. |
| `courseId` | ObjectId | Required, Ref: `courses` | Secondary | Evaluated course's ID. |
| `semester` | String | Required | Secondary | Academic semester context. |
| `ratings` | Array | Required, Min items: 1 | None | List of rating subdocuments. |
| `comment` | String | Optional, trim | None | Qualitative text feedback. |

#### Ratings Subdocument Fields:
- `questionId`: ObjectId (Ref: `questions`, Required)
- `rating`: Number (Required, Min: 1, Max: 5)

*Compound Unique Index*: `{ studentId: 1, facultyId: 1, courseId: 1, semester: 1 }` **(CRITICAL: Enforces the constitution rule that a student submits only one evaluation response per course/instructor/semester).*

### 2.7. FeedbackWindow Schema (`feedbackwindows`)
Specifies the date boundaries inside which evaluations can be submitted.

| Field Name | Type | Validations | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Primary | Unique identifier. |
| `semester` | String | Required, unique, trim | Secondary (Unique) | Academic semester code (e.g. "Fall 2026"). |
| `startDate` | Date | Required | None | Feedback window starts. |
| `endDate` | Date | Required | None | Feedback window closes. |

---

## 3. Data Integrity & Validation Constraints

To preserve database sanity, validation checks must run before saving documents:

1. **Uniqueness Constraints**:
   - `users.email` is unique.
   - `faculties.employeeId` is unique.
   - `courses.courseCode` is unique.
   - `feedbackwindows.semester` is unique.
   - `feedbacks` compound index (`studentId`, `facultyId`, `courseId`, `semester`) is unique.
2. **Referential Integrity**:
   - Save middleware or Service logic must verify that referenced IDs (`studentId`, `facultyId`, `courseId`, `questionId`) exist in their parent collections.
3. **Feedback Window Bounds**:
   - When saving to the `feedbacks` collection, the server verifies:
     `currentDate >= feedbackwindow.startDate && currentDate <= feedbackwindow.endDate`.
     Rejects submission if the window is closed or not defined.
4. **Enrollment Check**:
   - Before saving `feedbacks`, the service layer queries `enrollments` to confirm the student is actively registered in the `courseId`.
5. **Faculty Course Assignment Check**:
   - The service layer checks the `courses` model to verify `facultyId` is assigned to teach `courseId` for that semester.

---

## 4. Privacy Design

To uphold the constitution principle **"Never expose anonymous student identities to faculty"**:
- **Database Query Filtering**: The backend must never populate the `studentId` field when querying the `feedbacks` collection for faculty views.
- **Aggregated Summaries**: Analytical pipelines use MongoDB's aggregation framework (`$group`, `$avg`) to calculate statistics. The raw `feedbacks` documents are bypassed in favor of grouped averages.
- **Stripped Comments**: Comments are queried as a list of text strings and scrambled on the server side to remove any implicit timestamp correlation with submission order.
