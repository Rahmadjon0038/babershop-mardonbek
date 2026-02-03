# Mardonbek Sartaroshxona API

Professional backend with authentication, SQLite database, and Swagger documentation.

## Features

- User registration with unique username validation
- Login with JWT tokens (access & refresh)
- Profile API with authentication
- Better-SQLite3 database
- Swagger documentation at `/docs`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

4. Run production server:
```bash
npm start
```

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens

### Profile
- `GET /profile` - Get user profile (requires Bearer token)

## Documentation

Visit `http://localhost:3000/docs` for interactive Swagger documentation.

## Project Structure

```
/src
  /middleware
    auth.js         # JWT authentication middleware
  /routes
    auth.js         # Register & login routes
    profile.js      # Profile routes
  db.js             # Database setup
  swagger.js        # Swagger configuration
  server.js         # Main server file
data.sqlite         # SQLite database
```
