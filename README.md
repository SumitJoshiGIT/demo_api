# Scalable REST API with Auth + RBAC + Frontend UI

This project implements the backend-focused assignment with:
- JWT authentication (`register`, `login`, `me`)
- Role-based access control (`user`, `admin`)
- Full CRUD for a secondary entity (`tasks`)
- API versioning (`/api/v1`), validation, centralized error handling
- API docs (Swagger + Postman collection)
- MongoDB schema with indexing for scalability
- Basic React frontend to test auth + protected CRUD flows
- Optional enhancements: Redis caching, structured logging, Docker setup

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, express-validator
- **Frontend:** React (Vite)
- **Optional scaling/security:** Redis, Winston logging, Helmet, rate limiting, input sanitization, Docker

## Project Structure

```bash
.
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middlewares
│   │   ├── models
│   │   ├── routes/v1
│   │   ├── utils
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── Dockerfile
├── frontend
│   ├── src
│   ├── .env.example
│   └── Dockerfile
├── assignment-api.postman_collection.json
├── docker-compose.yml
└── README.md
```

## Setup (Local)

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

Swagger docs: `http://localhost:5000/api/v1/docs`

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Docker Setup (Optional)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

## API Endpoints (`/api/v1`)

### Auth
- `POST /auth/register`
- `POST /auth/register-admin` (requires `x-admin-bootstrap-key`)
- `POST /auth/login`
- `GET /auth/me` (Bearer token)

### Tasks
- `GET /tasks` (supports `page`, `limit`, `status`, `search`)
- `GET /tasks/:id`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

### Admin
- `GET /admin/stats` (admin only)

## Security Notes

- Password hashing with bcrypt
- JWT-based auth for protected routes
- Role checks via middleware
- Input validation with `express-validator`
- Input sanitization (`express-mongo-sanitize`, `xss-clean`)
- Security headers with Helmet
- Basic API rate limiting

## Scalability Note (Short)

Current design is modular and can scale via:
1. **Horizontal API scaling** behind a load balancer (stateless JWT auth)
2. **Redis caching** for frequent list endpoints (`GET /tasks`)
3. **Database optimization** using indexes (`owner`, `status`, `createdAt`)
4. **Separation into services** (Auth service, Task service) when needed
5. **Containerized deployment** using Docker + orchestration

## Postman

Import `assignment-api.postman_collection.json` and set:
- `baseUrl` = `http://localhost:5000/api/v1`
- `token` / `adminToken` after login

---

If you want, I can also add a small seed script to create demo users/tasks automatically for quick interviewer demos.
