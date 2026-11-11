# User Profile Management System

React, Express, and MongoDB app for account registration, login, profile viewing/editing, password changes, and logout.

## Features

- Register and log in with validated input.
- View and edit the authenticated user's name and email.
- Change a password after verifying the current password.
- Hash passwords before storing them in MongoDB.
- Protect profile APIs so each user can access only their own account.

## Run locally

1. Start MongoDB locally or provide a MongoDB connection string.
2. In `backend`, copy `.env.example` to `.env`, set `MONGO_URI`, and replace `AUTH_SECRET` with a random secret of at least 32 characters.
3. Start the backend in one terminal:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

4. Start the frontend in a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

The API listens on `http://localhost:5000`. Set `VITE_API_URL` in `frontend/.env` if the API runs at a different address.

## Useful files

- `frontend/src/Components/Register.jsx` and `Login.jsx` — registration and sign-in forms.
- `frontend/src/Components/Dashboard.jsx` — view/edit profile and change password.
- `backend/models/user.js` — MongoDB user schema.
- `backend/Routes/authroutes.js` — registration, login, and logout APIs.
- `backend/Routes/profileRoutes.js` — authenticated profile and password APIs.
- `backend/middleware/authMiddleware.js` — checks signed-in user identity.

## API

- `POST /api/auth/register` — create account.
- `POST /api/auth/login` — authenticate.
- `GET /api/auth/me` — return signed-in user.
- `POST /api/auth/logout` — revoke current session.
- `GET /api/profile` — view current user's profile.
- `PUT /api/profile` — update name and email.
- `PUT /api/profile/change-password` — verify current password and set new password.

Profile routes require `Authorization: Bearer <token>`. Passwords must be 8-128 characters and include an uppercase letter, lowercase letter, and number. Passwords are hashed with Node.js `scrypt`; they are never stored in plaintext.
