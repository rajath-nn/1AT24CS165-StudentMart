# User Authentication System

A React, Express, and MongoDB authentication app with user registration, login, session validation, and logout.

## Features

- Register with a name, email, and password.
- Sign in with an email and password.
- Validate inputs in the browser and again on the API.
- Store normalized email addresses and scrypt password hashes in MongoDB.
- Keep users signed in across page refreshes and revoke the active session on logout.

## Run locally

1. Start MongoDB locally, or provide a MongoDB connection string.
2. In `backend`, copy `.env.example` to `.env`, set `MONGO_URI`, and replace `AUTH_SECRET` with a random secret of at least 32 characters.
3. Start the API:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

4. In another terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

The API listens on `http://localhost:5000`. Set `VITE_API_URL` in `frontend/.env` if it runs at another address.

## API

- `POST /api/auth/register` — `{ "name", "email", "password" }`
- `POST /api/auth/login` — `{ "email", "password" }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`
- `POST /api/auth/logout` — requires `Authorization: Bearer <token>`

Registration passwords must be 8–128 characters and contain an uppercase letter, a lowercase letter, and a number. Passwords are never stored in plaintext. The API returns a signed session token after registration or login; logout revokes it on the server.
