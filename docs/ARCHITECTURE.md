# System Architecture - Faculty Feedback System

This document outlines the software architecture, component relationships, backend file layouts, data flow patterns, and privacy isolation systems.

---

## 1. Overall System Architecture

The application is built on a decoupled, three-tier architecture:

```
+---------------------------------------+
|            Client Layer               |
|  - React + Vite SPA                   |
|  - Axios API Client                   |
|  - Tailwind CSS Styling               |
+---------------------------------------+
                    │
            HTTPS Requests
         (JWT Auth in Headers)
                    │
                    ▼
+---------------------------------------+
|            Server Layer               |
|  - Node.js + Express API Router       |
|  - Zod Request Validators             |
|  - Centralized Error Handler          |
+---------------------------------------+
                    │
             Mongoose Queries
                    │
                    ▼
+---------------------------------------+
|            Database Layer             |
|  - MongoDB (Document Store)           |
|  - Compound Uniqueness Indexes        |
+---------------------------------------+
```

---

## 2. Frontend Component Architecture

The React client-side application is structured around a Single Page Application (SPA) design with route-level gating.

### 2.1. File Directory Structure (`client/src`)
- `main.jsx`: Application bootstrap file, renders React DOM.
- `App.jsx`: Global router root and context wrapper provider.
- `index.css`: Baseline tailwind directives and design system tokens.
- `context/`:
  - `AuthContext.jsx`: Provides login state, current user metadata, and logout operations.
- `routes/`:
  - `AppRoutes.jsx`: Declares route paths, layout assemblies, and authorization guards.
  - `ProtectedRoute.jsx`: Component gate verifying token existence and matching user roles.
- `pages/`:
  - `Login.jsx`: User login portal.
  - `student/`:
    - `StudentDashboard.jsx`: Lists assigned courses, instructors, and feedback submission status.
    - `FeedbackForm.jsx`: The multi-step wizard rating evaluation.
  - `faculty/`:
    - `FacultyDashboard.jsx`: Shows high-level KPIs, courses list, and links to reports.
    - `FacultyAnalytics.jsx`: Renders Recharts graphics and qualitative comment cards.
  - `admin/`:
    - `AdminDashboard.jsx`: Core statistics card grid and main admin navigation.
    - `AdminUsers.jsx`: Table-dense CRUD manager for students and faculty.
    - `AdminCourses.jsx`: Course registrar and teacher assignment controls.
    - `AdminWindows.jsx`: Datepicker control panels for feedback periods.
- `components/`:
  - `Layout/`: Main navigation sidebar, headers, and responsive drawers.
  - `UI/`: Reusable primitives: `Button`, `Input`, `Spinner`, `Card`, `Modal`, `Table`.
- `services/`:
  - `api.js`: Centralized Axios instance with headers injector interceptor.
  - `authService.js`, `studentService.js`, `facultyService.js`, `adminService.js`: Business-domain API functions.

---

## 3. Backend Architecture

The Express server follows a layered, service-oriented design separating transport, validation, and business logic layers.

### 3.1. File Directory Structure (`server`)
- `server.js`: Server bootloader, opens TCP port.
- `app.js`: Connects global express middleware, CORS configuration, routes, and central error handlers.
- `config/`:
  - `db.js`: Establish connection pool to MongoDB Atlas or local database instance.
- `routes/`:
  - `authRoutes.js`: Login, profile lookup endpoints.
  - `studentRoutes.js`: Student assigned courses, evaluation submission.
  - `facultyRoutes.js`: Faculty course catalog, anonymized aggregation metrics.
  - `adminRoutes.js`: System records CRUD, questionnaire setup.
- `controllers/`:
  - Extract parameters, trigger Zod validations, invoke Services, and format output.
- `services/`:
  - Execute business rules, query databases, calculate analytics, verify window constraints.
- `models/`:
  - Contains Mongoose Schemas (`User`, `Faculty`, `Course`, `Enrollment`, `Question`, `Feedback`, `FeedbackWindow`).
- `middleware/`:
  - `authMiddleware.js`: Token validation and identity parsing.
  - `roleMiddleware.js`: Checking permissions against allowed roles.
  - `validatorMiddleware.js`: Zod schema verification wrapper.
  - `errorMiddleware.js`: Centralized format catch-all for application errors.
- `utils/`:
  - `AppError.js`: Extended custom error class.
  - `logger.js`: Custom console/file logging helper.

---

## 4. Feedback Privacy Model

To achieve data isolation:

1. **Uniqueness Tracking**: The `Feedback` document holds `studentId` to enforce the compound unique index constraints (preventing double voting).
2. **Read Boundary Separation**:
   - Students have *write-only* access to the `feedbacks` collection.
   - Faculty members have *no read access* to raw `Feedback` records. They query `/api/faculty/analytics` which triggers an aggregation service.
3. **Data Scrubbing**:
   - The aggregation service fetches records for a designated course/semester, groups findings by averages, and extracts optional text comments.
   - The array of strings containing comments is shuffled using a Fisher-Yates randomization algorithm in the service layer before transmission to ensure comment lists have no correlation with submission sequences.
   - Any query population of student user properties is blocked.

---

## 5. Analytics Architecture

Question scores and completion tracking are calculated on-the-fly using MongoDB's Aggregation Framework to minimize RAM usage:

### 5.1. Question-Level Rating Aggregation Pipeline
To calculate the average score of each question for a course:
```javascript
[
  { $match: { courseId: mongoose.Types.ObjectId(courseId), semester: semester } },
  { $unwind: "$ratings" },
  {
    $group: {
      _id: "$ratings.questionId",
      averageRating: { $avg: "$ratings.rating" },
      totalResponses: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "questions",
      localField: "_id",
      foreignField: "_id",
      as: "questionDetails"
    }
  },
  { $unwind: "$questionDetails" },
  {
    $project: {
      _id: 0,
      questionId: "$_id",
      text: "$questionDetails.text",
      averageRating: { $round: ["$averageRating", 2] }
    }
  }
]
```

### 5.2. Completion Rate Calculation
Calculated by:
1. Counting total enrollments matching `{ courseId, semester }` from `Enrollment` collection.
2. Counting total documents matching `{ courseId, semester }` from `Feedback` collection.
3. Dividing feedback count by enrollment count to yield the responsive rating.

---

## 6. Deployment Architecture

- **Hosting Environment**:
  - Frontend: Deployed as static HTML/JS assets to PaaS edge nodes (e.g. Vercel, Netlify, or AWS S3/CloudFront).
  - Backend: Run on virtual server engines (e.g. Render, Heroku, AWS ECS) with Node process monitors (e.g. PM2).
  - Database: MongoDB Atlas (cloud cluster) with automatic secondary replication.
- **Environment Context Configuration**:
  - `PORT`: Server listening port.
  - `MONGODB_URI`: Connection string pointing to database.
  - `JWT_SECRET`: Crypto key for token signatures.
  - `JWT_EXPIRES_IN`: E.g. `24h`.
  - `CORS_ORIGIN`: Allowed origins.
