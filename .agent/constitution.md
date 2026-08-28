# Faculty Feedback System - Engineering Constitution

## Mission

Build a production-quality Faculty Feedback System using the MERN stack.

The system must allow students to submit structured feedback for faculty members while allowing faculty and administrators to view aggregated analytics.

## Core Principles

1. Never sacrifice data integrity for implementation speed.
2. Never expose anonymous student identities to faculty.
3. Never duplicate business logic unnecessarily.
4. Keep frontend and backend responsibilities clearly separated.
5. Use reusable components instead of duplicated UI.
6. Validate all user input.
7. Never trust client-side authorization.
8. Backend authorization is mandatory.
9. Never commit secrets or credentials.
10. Every feature must handle loading, success, empty, and error states.
11. Prefer simple maintainable implementations over unnecessary abstractions.
12. Do not introduce libraries unless they solve a real requirement.

## Roles

The system has three roles:

- STUDENT
- FACULTY
- ADMIN

## Student capabilities

Students can:

- Login
- View assigned courses
- View assigned faculty
- Submit feedback
- View feedback submission status
- Provide optional comments

Students cannot:

- View other students' feedback
- Modify submitted feedback
- Access faculty analytics
- Access admin functionality

## Faculty capabilities

Faculty can:

- Login
- View assigned courses
- View aggregated feedback
- View average ratings
- View question-wise analytics
- View anonymized comments

Faculty cannot:

- Identify individual feedback submitters
- Access student records
- Modify feedback
- Access admin functionality

## Admin capabilities

Admins can:

- Manage students
- Manage faculty
- Manage courses
- Manage enrollments
- Manage questions
- Configure feedback windows
- View system-wide analytics
- View faculty analytics
- Export reports

## Feedback Rules

A student can submit only one feedback response per:

student + faculty + course + semester

Once submitted:

- Feedback becomes immutable.
- Student cannot edit it.
- Faculty cannot modify it.
- Admin should not modify individual responses.

## Privacy

The system must ensure faculty-facing APIs never return student identity information.

Analytics APIs should return only aggregated information.

## Coding Rules

Use:

- async/await
- proper HTTP status codes
- centralized error handling
- reusable components
- environment variables
- schema validation
- meaningful variable names

Avoid:

- giant components
- giant controllers
- duplicated API logic
- hard-coded IDs
- hard-coded credentials
- console.log debugging left in production code

## Definition of Done

A feature is not complete until:

- backend implementation exists
- frontend implementation exists where applicable
- validation exists
- authorization exists
- error handling exists
- loading state exists
- empty state exists where applicable
- tests or meaningful manual verification exist
- documentation is updated