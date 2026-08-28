# Product Requirements Document (PRD) - Faculty Feedback System

This document outlines the product requirements, user roles, functional specifications, non-functional parameters, and user journeys for the Faculty Feedback System.

---

## 1. Product Overview & Scope

The **Faculty Feedback System** is a modern academic SaaS-style platform designed to automate and streamline the collection, aggregation, and analysis of student feedback for faculty members. The system serves three distinct user roles—Students, Faculty, and Administrators—and operates under strict constraints regarding data privacy and response integrity. 

The core scope includes:
- Secure authentication and role-based routing.
- Structuring feedback around courses, faculty, and academic semesters.
- Interactive, multi-step feedback form for students with numerical ratings and descriptive comments.
- Aggregated question-wise analytics, trends, and anonymized comment blocks for faculty.
- System administrative tools for managing student and faculty directories, courses, enrollments, questionnaire definitions, feedback windows, and system-wide dashboards.

---

## 2. User Roles

The platform defines three mutually exclusive roles, each having specific system rights:

| Role | Description | Primary Goal |
| :--- | :--- | :--- |
| **STUDENT** | Registered students enrolled in courses. | Submit honest, structured feedback for their course instructors within the active feedback window. |
| **FACULTY** | Faculty members / instructors. | View aggregated feedback analytics and qualitative feedback comments for their own assigned courses to improve teaching pedagogy. |
| **ADMIN** | Academic administrators / office managers. | Configure feedback windows, manage master directories (students, faculty, courses, enrollments), define evaluation questions, and monitor system-wide statistics. |

---

## 3. Complete Functional Requirements

### 3.1. General & Authentication
- **Multi-Role Authentication**: Single entry point with credentials (email and password). The system redirects users to their respective dashboards based on their role.
- **Session Management**: Session security using JSON Web Tokens (JWT) with defined expiration intervals.
- **Profile View**: All users can view their basic profile details (Name, Email, Role).

### 3.2. Student Module
- **Dashboard**:
  - Displays a summary of active feedback tasks.
  - Lists assigned courses and corresponding faculty members for the current semester.
  - Highlights feedback status per course: `Pending` or `Submitted`.
- **Feedback Submission**:
  - Accessible only during an active feedback window for the current semester.
  - Interactive multi-step wizard to evaluate the assigned faculty on active questions.
  - Rating scale: `1` (Very Poor), `2` (Poor), `3` (Average), `4` (Good), `5` (Excellent).
  - Optional text comment section for qualitative feedback.
  - Interactive validation (e.g., progress bar, warning of incomplete questions).
  - Accidental submission protection: A confirmation dialog must be accepted before final submission.
- **Immutable Status**:
  - Once submitted, feedback becomes instantly immutable.
  - The student can see a checkmark/indicator showing submission completion but cannot view, edit, or delete their responses.
  - Students cannot view other students' feedback or access any faculty analytics.

### 3.3. Faculty Module
- **Dashboard**:
  - Shows assigned courses for current and historical semesters.
  - Displays high-level aggregated KPIs (Overall Average Rating, Total Responses Received, Response Rate percentage).
- **Aggregated Analytics**:
  - Question-wise average rating represented using charts (e.g., bar charts or radar charts).
  - Historical ratings comparison to track teaching performance trends over different semesters.
  - Interactive filters to view feedback by course, semester, or academic year.
- **Anonymized Qualitative Feedback**:
  - Displays a clean list of comments written by students for each course.
  - **Strict Privacy Rule**: Comments must be displayed as a randomized list of text strings, entirely stripped of student metadata (IDs, names, email, enrollment dates).
  - Faculty cannot access student records, individual feedback profiles, or any admin actions.

### 3.4. Administrator Module
- **Student & Faculty Directory Management**:
  - Complete CRUD capabilities for Student profiles (Name, Email, Roll Number) and Faculty profiles (Name, Email, Employee ID, Department).
  - Bulk import capability or individual registration.
- **Course & Enrollment Configuration**:
  - CRUD operations for Courses (Course Name, Course Code, Credits, Assigned Faculty).
  - Enrollment mapping: Link Students to specific Courses for a given Semester.
- **Feedback Question Bank**:
  - Create, view, toggle active status, or edit evaluation questions (e.g., "Clarity of explanations", "Punctuality", "Availability outside class").
  - Questions are mapped to numerical ratings (1-5).
- **Feedback Window Settings**:
  - Define active start and end timestamps for feedback submissions per semester.
  - Ability to manually open/close feedback windows.
- **Admin Dashboard & Reports**:
  - High-level system statistics (Active Students, Active Faculty, Total Enrolled Courses, Overall Submission Rate).
  - View individual faculty aggregated analytics.
  - Export comprehensive reports (e.g., average ratings of all faculty members in a department) as CSV/PDF.

---

## 4. Non-Functional Requirements

### 4.1. Security & Compliance
- **Data Encrypt-at-Rest**: Plaintext passwords must never be written to the database. All passwords must be hashed using `bcrypt` (12 rounds recommended).
- **Input Validation**: Zero-trust client-side validation supplemented by strict backend Zod schema validation.
- **Security Headers & CORS**: Explicit Cross-Origin Resource Sharing (CORS) configurations and Helmet integration to prevent scripting attacks.

### 4.2. Performance & Reliability
- **Query Latency**: API endpoints (specifically student submission and faculty aggregation queries) must respond under 300ms under standard loads.
- **Scalability**: Clean indexing and database-level aggregations designed to handle bulk student submissions at the end of a semester without performance degradation.
- **Availability**: High availability with elegant offline/error messages if connection to MongoDB fails.

### 4.3. Feedback Privacy Model
- **Student Isolation**: Faculty-facing APIs must strictly block student data. Student info cannot be populated or transmitted in aggregation results.
- **Immutable Logs**: Once submitted, feedback is set as read-only. Database and application logic must prevent any UPDATE operations on feedback payloads.

### 4.4. Usability & UI/UX
- **Responsive Layout**: Designed for mobile browsers (students completing surveys on phones), tablets, and high-density desktop displays (admins managing tables).
- **Modern Aesthetics**: A professional, clean academic dashboard styling (avoiding outdated college portal themes, excessive gradients, or heavy animations).
- **Accessibility**: Semantic HTML structures, logical keyboard focus transitions, and high-contrast color choices.

---

## 5. Detailed User Journeys

### 5.1. Student Journey: Submitting Evaluation
1. **Authentication**: Student logs in via the login page.
2. **Select Course**: Navigates to active courses list. Shows status of pending/submitted feedback.
3. **Form Completion**: Selects a course with "Pending" status, completing a 1-5 numerical survey for each question.
4. **Qualitative Section**: Adds optional comments.
5. **Confirmation**: Clicks "Submit", and a confirmation modal pops up.
6. **Submission**: Clicks "Confirm". Data is saved, page updates to "Submitted" status, and form becomes inaccessible.

### 5.2. Faculty Journey: Analyzing Analytics
1. **Authentication**: Faculty logs in and is directed to the Faculty Dashboard.
2. **Review Metrics**: Views a high-level list of courses taught. Selects a specific course.
3. **Data Aggregation**: The dashboard displays overall scores, progress charts, and question-level averages.
4. **Anonymized Feedback**: Reads student feedback comments displayed as a randomized, unlinked text list.

### 5.3. Admin Journey: System Administration & Setup
1. **Directory Control**: Admin logs in, reviews student and faculty directories, adding any missing entries.
2. **Setup Feedback Period**: Configures active feedback windows with specific start/end dates for the semester.
3. **Question Administration**: Activates or alters active questionnaire forms.
4. **Global Analytics**: Observes progress meters of response rates across the campus and exports aggregated results.
