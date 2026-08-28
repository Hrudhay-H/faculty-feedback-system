# Backend Engineering Rules

## Architecture

Use:

Routes
→ Controllers
→ Services
→ Models

Routes handle routing.

Controllers handle HTTP concerns.

Services handle business logic.

Models handle persistence.

## API Design

Use RESTful endpoints.

Return consistent JSON:

{
  "success": true,
  "message": "...",
  "data": {}
}

Errors:

{
  "success": false,
  "message": "...",
  "errors": []
}

## Authentication

Use JWT authentication.

Passwords must be hashed using bcrypt.

Never return passwords from APIs.

## Authorization

Authorization must happen server-side.

Never rely on frontend role checks for security.

## Validation

Validate:

- request body
- query parameters
- route parameters

Reject malformed requests with HTTP 400.

## Errors

Use centralized error middleware.

Do not expose stack traces to clients in production.

## Security

Implement:

- helmet
- CORS
- rate limiting for authentication endpoints
- input validation
- secure password hashing
- JWT expiration

Never log passwords or JWT secrets.