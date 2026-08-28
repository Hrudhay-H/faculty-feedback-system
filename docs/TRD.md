# Technical Requirements Document (TRD) - Faculty Feedback System

This document outlines the technical requirements, architecture, software stack, security standards, and testing policies for the Faculty Feedback System.

---

## 1. Technology Stack & Dependencies

The system uses a modern, JavaScript-focused full-stack architecture (MERN Stack).

### 1.1. Frontend
- **Core Library**: React (Functional components with hooks).
- **Build Tool**: Vite (Fast development server and optimized production packaging).
- **Styling**: Vanilla CSS for layouts and custom tokens + Tailwind CSS (as utility framework).
- **Routing**: React Router (for SPA client-side routing).
- **HTTP Client**: Axios (configured with interceptors for auth headers and global error handling).
- **Forms**: React Hook Form (for light, performance-focused client form state).
- **Data Visualization**: Recharts (for responsive analytics charts on the Faculty and Admin dashboards).
- **Validation**: Zod (for validation schemas matching the backend counterparts).

### 1.2. Backend
- **Platform**: Node.js.
- **Framework**: Express (REST API development).
- **Database driver**: Mongoose (ODM for MongoDB connection and schema definitions).
- **Authentication**: `jsonwebtoken` (JWT) for stateless session handling.
- **Cryptography**: `bcrypt` (for secure password hashing).
- **Validation**: Zod (schema validator for incoming payload sanitization).
- **Security Utilities**: `helmet` (security headers), `cors` (cross-origin controls), `express-rate-limit` (brute-force prevention).

---

## 2. Authentication Flow

The authentication system is built on stateless JSON Web Tokens (JWT) to secure client-server communications.

1. **Login Request**:
   - The student, faculty, or admin enters credentials on the frontend.
   - Frontend sends a POST request with `{ email, password }` to `/api/auth/login`.
2. **Backend Authentication & Hashing**:
   - The backend checks if the user exists via the `User` collection.
   - Hashed password comparison is performed using `bcrypt.compare()`.
   - If verification succeeds, a JWT is signed with the user payload:
     ```json
     {
       "id": "userId",
       "role": "STUDENT | FACULTY | ADMIN",
       "email": "user@example.com"
     }
     ```
   - The token contains an expiration timestamp (e.g., `24h` / 1 day).
3. **Session Storage & Transmission**:
   - The backend sends the JWT back in the response body (or secure HttpOnly cookie).
   - The client stores the JWT in `localStorage` (or reads it from cookies).
   - Subsequent client requests inject the JWT into the HTTP headers:
     `Authorization: Bearer <jwt_token>`
4. **Token Verification**:
   - Protected routes on the backend pass through an `authenticate` middleware.
   - The middleware checks for the presence of the `Bearer` token in the `Authorization` header, decodes it using the `JWT_SECRET` environment variable, and appends the decoded payload to the `req.user` object.
5. **Token Expiration**:
   - On expiration, the frontend receives a `401 Unauthorized` response. An Axios interceptor catches this code, clears the local storage/session, and redirects the user to the login screen.

---

## 3. Authorization Model

Authorization is strictly enforced **server-side** at the route and service layers. Frontend routes are conditionally protected using React Router wrappers (e.g., `<ProtectedRoute allowedRoles={['ADMIN']} />`), but these are solely for UI navigation and are never trusted for security.

### 3.1. Role-Based Access Control (RBAC)
Every protected API route is gated with an authorization middleware:
- `requireRole(['ADMIN'])`: Rejects any user without the Admin role with a `403 Forbidden` error.
- `requireRole(['FACULTY', 'ADMIN'])`: Allows Faculty and Admins.
- `requireRole(['STUDENT', 'FACULTY', 'ADMIN'])`: Opens access to authenticated users generally.

### 3.2. Resource Ownership Verification
To prevent ID-harvesting and Horizontal Privilege Escalation, routes verifying sensitive objects must compare the resource owner ID with the authenticated requester:
- **Students**: Rejects requests requesting student details or feedback forms unless the path parameter `studentId` matches `req.user.id`.
- **Faculty**: Rejects analytical requests unless the requested `facultyId` matches `req.user.id`.
- **Admins**: Bypass ownership checks to allow overall operations.

---

## 4. Input & Schema Validation

Every input from the client (Request body, URL parameters, query parameters) is considered untrusted.

1. **Shared Schemas**: Validation rules are written as Zod schemas.
2. **Backend Validation Middleware**:
   - Incoming payloads are passed to a Zod schema validation helper before reaching the controller.
   - If validation fails, Zod generates a list of formatted validation errors, and the server returns a `400 Bad Request` with structured error messages.
3. **Frontend Validations**:
   - React Hook Form resolves validations against identical Zod schemas before firing Axios requests, giving instant user feedback.

---

## 5. Centralized Error Handling

The application implements a centralized error handling strategy on the backend to avoid leaking system internals:

```
[Route Handler] → [Controller / Service] (Error thrown) 
                     ↓
[Centralized Express Error Middleware]
                     ↓
             [Format Response] 
```

### 5.1. Custom Application Error
A specialized error class extends the native `Error` class:
```javascript
class AppError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 5.2. Standard Response Schemas
- **Success Response (HTTP 2xx)**:
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": { ... }
  }
  ```
- **Error Response (HTTP 4xx/5xx)**:
  ```json
  {
    "success": false,
    "message": "Error description.",
    "errors": [
      { "field": "email", "message": "Invalid email address format" }
    ]
  }
  ```

### 5.3. Production Safety
If the environment is set to `production`, the Express error middleware suppresses database-level stack traces (e.g. Mongoose connection logs) and returns a clean, generic `Internal Server Error` message for unhandled HTTP `500` exceptions.

---

## 6. Security Requirements

The application adopts the following security protocols:
- **HTTPS Enforcement**: In production, secure cookies (if cookies are chosen for JWT) must carry the `Secure` and `HttpOnly` flags.
- **Express Helmet**: Incorporate `helmet()` middleware to automatically set secure HTTP response headers (e.g. preventing XSS and clickjacking).
- **CORS Configuration**: Restrict cross-origin resource requests to designated hostnames configured in environment variables.
- **Rate Limiting**: Rate limit requests (using `express-rate-limit`) to a maximum of 5 attempts per 15 minutes for `/api/auth/login` to prevent credential-stuffing.
- **Safe Logging**: The server log files must filter out passwords, token keys, and feedback comments containing identifying text.

---

## 7. Testing Strategy

The quality control lifecycle comprises automated testing and manual verifications:

### 7.1. Automated Testing Plan
1. **Unit Testing**:
   - Frontend: Verify key utility functions (e.g., date formatting, statistical calculations).
   - Backend: Unit test helper services, hashing utilities, and error formatters.
2. **Integration Testing**:
   - Route and validation testing using `supertest` on Express route components.
   - Mock database connections to verify unique index handling and constraint checking (e.g. submitting a feedback form twice).

### 7.2. Manual Verification Checklist
- **Role Boundary Test**: Verify that a STUDENT account receiving a `403 Forbidden` response when hitting admin or faculty endpoints fails safely.
- **Feedback Window Boundary**: Manually adjust database system clocks to check if student submissions block correctly when the feedback window is toggled to closed.
- **UX States Check**: Slow down networking in Chrome DevTools to confirm loading spinners, empty-state text cards, and error notifications render cleanly.
