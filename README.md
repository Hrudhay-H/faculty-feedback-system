# Faculty Feedback System

A production-quality full-stack Faculty Feedback System using the MERN stack (MongoDB, Express, React, Node.js), Vite, Tailwind CSS, Recharts, and React Hook Form with Zod schemas validation.

## Prerequisites

Before starting, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (running locally on port 27017 or using MongoDB Atlas)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Install Dependencies
Run the install command from the root folder to install all packages for the workspace, backend, and frontend:
```bash
npm run install-all
```

### 2. Configure Environment Variables
Set up backend and frontend environment files:
- Copy [`server/.env.example`](file:///c:/Users/hrudh/OneDrive/Desktop/faculty-feedback-system/server/.env.example) to [`server/.env`](file:///c:/Users/hrudh/OneDrive/Desktop/faculty-feedback-system/server/.env).
- Copy [`client/.env.example`](file:///c:/Users/hrudh/OneDrive/Desktop/faculty-feedback-system/client/.env.example) to [`client/.env`](file:///c:/Users/hrudh/OneDrive/Desktop/faculty-feedback-system/client/.env).

Replace the placeholders in both files with your actual local configuration values.

## Environment Configuration

Follow these steps to configure environment variables for local development:

1. **Copy backend environment file**:
   ```bash
   cp server/.env.example server/.env
   ```
2. **Copy frontend environment file**:
   ```bash
   cp client/.env.example client/.env
   ```
3. **Replace placeholders with real values** in `server/.env` and `client/.env`.
4. **Start MongoDB database service** (ensure it runs locally on port 27017).
5. **Start backend developer server** (`npm run dev` or from root `npm run dev`).
6. **Start frontend dev server**.

### Environment Variables Glossary

| Variable | Location | Purpose | Expected Value / Default |
|----------|----------|---------|-------------------------|
| `NODE_ENV` | server | Runtime environment mode | `development` \| `production` \| `test` |
| `PORT` | server | Port for the Express server to listen on | `5000` |
| `MONGODB_URI` | server | MongoDB connection URI (includes database name) | `mongodb://localhost:27017/faculty_feedback` |
| `JWT_SECRET` | server | Private key for signing session tokens | Secure random string |
| `JWT_EXPIRES_IN` | server | JWT expiration time limit | `24h` |
| `CORS_ORIGIN` | server | Allowed frontend origin for CORS | `http://localhost:5173` |
| `VITE_API_URL` | client | API endpoint base URL for the client app | `http://localhost:5000/api` |

### 3. Run the Development Server
Launch both the frontend client and the backend server concurrently:
```bash
npm run dev
```
- Client runs on: [http://localhost:5173](http://localhost:5173)
- API server runs on: [http://localhost:5000](http://localhost:5000)

### 4. Health Check Endpoint
Confirm the server is active by accessing:
[http://localhost:5000/api/health](http://localhost:5000/api/health)

### 5. Format and Linting
To check and format the codebase:
```bash
# Run lint checks
npm run lint

# Format code files
npm run format
```

