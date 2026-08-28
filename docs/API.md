# API Specifications - Faculty Feedback System

This document outlines the REST API contracts for the Faculty Feedback System, including endpoints, authentication requirements, request/response bodies, query parameters, and status codes.

---

## 1. Global Specifications

- **Base URL**: `/api` (locally e.g. `http://localhost:5000/api`)
- **Headers**:
  - Request payloads must use: `Content-Type: application/json`
  - Protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

### 1.1. Common Response Format

#### Success
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

#### Error
```json
{
  "success": false,
  "message": "Specific error explanation",
  "errors": []
}
```

---

## 2. Authentication API (`/api/auth`)

### 2.1. Login
- **Endpoint**: `POST /api/auth/login`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "student1@university.edu",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "60d01f123456789012345678",
        "name": "Jane Doe",
        "email": "student1@university.edu",
        "role": "STUDENT"
      }
    }
  }
  ```
- **Response (400 Bad Request)**: Invalid email format or missing fields.
- **Response (401 Unauthorized)**: Incorrect credentials.

### 2.2. Get Current Profile
- **Endpoint**: `GET /api/auth/me`
- **Authentication**: Student, Faculty, or Admin JWT
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile fetched successfully",
    "data": {
      "user": {
        "id": "60d01f123456789012345678",
        "name": "Jane Doe",
        "email": "student1@university.edu",
        "role": "STUDENT"
      }
    }
  }
  ```
- **Response (401 Unauthorized)**: Missing or invalid token.

### 2.3. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Authentication**: Student, Faculty, or Admin JWT
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logout successful",
    "data": {}
  }
  ```

---

## 3. Student API (`/api/student`)

### 3.1. List Assigned Courses
- **Endpoint**: `GET /api/student/courses`
- **Authentication**: Student JWT (Ownership validated: extracts student ID from JWT)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Assigned courses fetched successfully",
    "data": {
      "courses": [
        {
          "enrollmentId": "60d01f888888889012345601",
          "courseId": "60d01f999999999012345601",
          "courseName": "Database Management Systems",
          "courseCode": "CS301",
          "semester": "Fall 2026",
          "faculty": {
            "facultyId": "60d01f222222229012345602",
            "name": "Dr. John Smith"
          },
          "feedbackSubmitted": false,
          "feedbackWindowOpen": true
        }
      ]
    }
  }
  ```

### 3.2. Submit Feedback
- **Endpoint**: `POST /api/student/feedback/submit`
- **Authentication**: Student JWT
- **Request Body**:
  ```json
  {
    "courseId": "60d01f999999999012345601",
    "facultyId": "60d01f222222229012345602",
    "semester": "Fall 2026",
    "ratings": [
      {
        "questionId": "60d01f333333339012345610",
        "rating": 5
      },
      {
        "questionId": "60d01f333333339012345611",
        "rating": 4
      }
    ],
    "comment": "Very engaging lectures, explains concepts with practical database examples."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Feedback submitted successfully",
    "data": {}
  }
  ```
- **Response (400 Bad Request)**: 
  - Feedback window closed for the semester.
  - Student not enrolled in this course.
  - Faculty member not assigned to this course.
  - Feedback already submitted (uniqueness constraint violation).
  - Malformed survey rating values (must be integers 1 to 5).

---

## 4. Faculty API (`/api/faculty`)

### 4.1. List Taught Courses
- **Endpoint**: `GET /api/faculty/courses`
- **Authentication**: Faculty JWT (Ownership validated: extracts faculty ID from JWT)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Faculty courses fetched successfully",
    "data": {
      "courses": [
        {
          "courseId": "60d01f999999999012345601",
          "courseName": "Database Management Systems",
          "courseCode": "CS301",
          "semester": "Fall 2026"
        }
      ]
    }
  }
  ```

### 4.2. View Aggregated Analytics
- **Endpoint**: `GET /api/faculty/analytics`
- **Authentication**: Faculty JWT
- **Query Parameters**:
  - `courseId` (required): `60d01f999999999012345601`
  - `semester` (required): `Fall 2026`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Analytics compiled successfully",
    "data": {
      "courseId": "60d01f999999999012345601",
      "courseCode": "CS301",
      "courseName": "Database Management Systems",
      "semester": "Fall 2026",
      "summary": {
        "overallAverage": 4.5,
        "totalSubmissions": 42,
        "responseRate": 84.0
      },
      "questionBreakdown": [
        {
          "questionId": "60d01f333333339012345610",
          "text": "How well does the instructor explain key database concepts?",
          "averageRating": 4.6
        },
        {
          "questionId": "60d01f333333339012345611",
          "text": "Is the instructor punctual in conducting lectures?",
          "averageRating": 4.4
        }
      ],
      "anonymizedComments": [
        "Very engaging lectures, explains concepts with practical database examples.",
        "Punctual and structured, but grades homework slowly.",
        "Explanations are clear, always answers questions after class."
      ]
    }
  }
  ```
- **Response (403 Forbidden)**: Requested analytics belong to another faculty member.
- **Privacy Enforcement**: **Notice how student details are entirely omitted from this response payload.** The `anonymizedComments` list contains only raw string comments in a randomized order.

---

## 5. Admin API (`/api/admin`)

All Admin endpoints require **ADMIN** role validation.

### 5.1. User Directory CRUD

#### Create User
- **Endpoint**: `POST /api/admin/users`
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@university.edu",
    "password": "temporaryPass123",
    "role": "STUDENT"
  }
  ```
- **Response (201 Created)**: User created (student/faculty record also instantiated if role fits).

#### List Users
- **Endpoint**: `GET /api/admin/users`
- **Query Parameters**: `role` (optional: `STUDENT` | `FACULTY` | `ADMIN`), `search` (optional)
- **Response (200 OK)**: Returns list of user documents.

### 5.2. Course Management

#### Create Course
- **Endpoint**: `POST /api/admin/courses`
- **Request Body**:
  ```json
  {
    "courseName": "Advanced Operating Systems",
    "courseCode": "CS402",
    "credits": 4,
    "facultyId": "60d01f222222229012345602",
    "semester": "Fall 2026"
  }
  ```
- **Response (201 Created)**: Course created successfully.

### 5.3. Enrollment Mapping

#### Create Enrollment
- **Endpoint**: `POST /api/admin/enrollments`
- **Request Body**:
  ```json
  {
    "studentId": "60d01f123456789012345678",
    "courseId": "60d01f999999999012345601"
  }
  ```
- **Response (201 Created)**: Link successfully established.

### 5.4. Question Administration

#### Add Question
- **Endpoint**: `POST /api/admin/questions`
- **Request Body**:
  ```json
  {
    "text": "The instructor displays comprehensive knowledge of the course curriculum.",
    "isActive": true
  }
  ```
- **Response (201 Created)**: Question successfully registered in the question bank.

### 5.5. Feedback Window Toggle

#### Define Window
- **Endpoint**: `POST /api/admin/windows`
- **Request Body**:
  ```json
  {
    "semester": "Fall 2026",
    "startDate": "2026-10-01T08:00:00.000Z",
    "endDate": "2026-11-15T23:59:59.000Z"
  }
  ```
- **Response (201 Created)**: Window defined.

#### Update Active State
- **Endpoint**: `PUT /api/admin/windows/:id`
- **Request Body**:
  ```json
  {
    "endDate": "2026-11-20T23:59:59.000Z"
  }
  ```
- **Response (200 OK)**: Window bounds extended.
