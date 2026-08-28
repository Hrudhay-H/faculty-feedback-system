# Security Rules

## Authentication

JWT tokens must expire.

Passwords must never be stored in plaintext.

## Authorization

Every protected backend endpoint must verify:

1. authentication
2. role
3. resource ownership where applicable

## Feedback Privacy

Faculty must never receive:

- student ID
- student name
- student email
- roll number

through faculty feedback endpoints.

## Admin

Admin endpoints must require ADMIN role.

## Student

Students may only access resources belonging to themselves or their enrollments.

## Faculty

Faculty may only access analytics belonging to themselves.

## Input

Never directly trust:

- IDs
- role values
- ratings
- semester
- query parameters

## Secrets

Use environment variables.

Never hard-code:

- JWT_SECRET
- MongoDB URI
- API keys

## Logging

Never log:

- passwords
- JWT tokens
- sensitive student information
- complete feedback documents