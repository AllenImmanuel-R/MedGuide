# MedGuide Authentication Setup

This guide will help you set up the complete authentication system with user login/signup connected to a Node.js Express backend using MongoDB.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB installed locally or MongoDB Atlas account
- npm or yarn package manager

## Project Structure

```
medguide-empathic-helper-main/
├── backend/                 # Express.js backend
│   ├── config/
│   │   └── database.js     # MongoDB connection
│   ├── controllers/
│   │   └── auth.js         # Authentication controllers
│   ├── middleware/
│   │   ├── auth.js         # JWT middleware
│   │   └── errorHandler.js # Error handling middleware
│   ├── models/
│   │   └── User.js         # User model
│   ├── routes/
│   │   └── auth.js         # Authentication routes
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── server.js           # Main server file
├── src/                     # React frontend
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   └── layout/
│   │       └── Navbar.tsx  # Updated with auth
│   ├── context/
│   │   └── AuthContext.tsx # Authentication state management
│   ├── pages/
│   │   ├── Login.tsx       # Login page
│   │   ├── Signup.tsx      # Signup page
│   │   └── ...             # Other pages
│   └── App.tsx             # Updated with auth routes
├── .env.example            # Frontend environment template
└── package.json
```

## Setup Instructions

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit the .env file with your configuration:**
   ```env
   NODE_ENV=development
   PORT=5000
   
   # Database - Use one of the following:
   # Local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/medguide
   # Or MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medguide
   
   # JWT Configuration
   JWT_SECRET=your_very_secure_jwt_secret_key_at_least_32_characters_long
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   
   # Client URL for CORS
   CLIENT_URL=http://localhost:8080
   ```

4. **Install backend dependencies (if not already done):**
   ```bash
   npm install
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   The backend will be running on `http://localhost:5000`

### 2. Frontend Setup

1. **Navigate back to the root directory:**
   ```bash
   cd ..
   ```

2. **Create frontend environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit the .env file:**
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

4. **Install frontend dependencies (if not already done):**
   ```bash
   npm install
   ```

5. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be running on `http://localhost:8080`

### 3. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The database will be created automatically when you first register a user

#### Option B: MongoDB Atlas (Recommended for production)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your backend `.env` file

## API Endpoints

The backend provides the following authentication endpoints:

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/updatedetails` - Update user details
- `PUT /api/v1/auth/updatepassword` - Update user password

## Frontend Features

### Authentication Pages
- **Login Page** (`/login`) - User sign-in with email and password
- **Signup Page** (`/signup`) - User registration with name, email, and password confirmation

### Protected Routes
- All existing pages (Dashboard, Reports, Chat, Clinics, About) are now protected and require authentication
- Unauthenticated users are redirected to the login page

### Navigation Updates
- Shows login/signup buttons for unauthenticated users
- Shows user menu with logout option for authenticated users
- Navigation items are only visible to authenticated users

## Authentication Flow

1. **Registration:**
   - User fills signup form with name, email, password, and password confirmation
   - Frontend validates the form using Zod schema
   - Request is sent to backend API
   - Backend validates data, hashes password, and saves user to database
   - JWT token is generated and sent back to frontend
   - Token is stored in localStorage and used for future requests

2. **Login:**
   - User enters email and password
   - Frontend validates the form
   - Backend verifies credentials and generates JWT token
   - Token is stored and user is redirected to dashboard

3. **Authentication Persistence:**
   - JWT token is stored in localStorage
   - On app reload, token is checked and user is automatically logged in if token is valid
   - Axios interceptors handle adding the token to all API requests

4. **Logout:**
   - Token is removed from localStorage
   - User is redirected to login page

## Security Features

- Passwords are hashed using bcryptjs with salt rounds
- JWT tokens with configurable expiration
- Input validation on both frontend (Zod) and backend (Mongoose)
- CORS configuration for secure API access
- Protected routes with authentication middleware
- Secure HTTP-only cookies option

## Testing the Setup

1. **Start both servers** (backend on :5000, frontend on :8080)
2. **Visit** `http://localhost:8080`
3. **You should be redirected to the login page**
4. **Click "Sign up"** to create a new account
5. **Fill the registration form** and submit
6. **You should be logged in and redirected to the dashboard**
7. **Test logout** from the user menu in the top-right corner

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running locally or check Atlas connection string
   - Verify the MONGODB_URI in your backend .env file

2. **CORS Issues:**
   - Check that CLIENT_URL in backend .env matches your frontend URL
   - Ensure frontend VITE_API_URL points to correct backend URL

3. **JWT Token Issues:**
   - Generate a strong JWT_SECRET (at least 32 characters)
   - Check that JWT_EXPIRE and JWT_COOKIE_EXPIRE are set correctly

4. **Frontend Build Issues:**
   - Ensure all required packages are installed
   - Check that environment variables are properly set

5. **Authentication Not Working:**
   - Open browser dev tools and check Network tab for API calls
   - Check Console tab for any JavaScript errors
   - Verify backend logs for any server errors

## Next Steps

- Add password reset functionality
- Implement email verification
- Add OAuth integration (Google, GitHub, etc.)
- Add role-based access control
- Implement refresh tokens for better security
- Add user profile management
- Add two-factor authentication

## Dependencies Added

### Frontend:
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Form validation resolvers
- `zod` - Schema validation
- `axios` - HTTP client

### Backend:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `cookie-parser` - Cookie parsing middleware
- `nodemon` - Development server (dev dependency)