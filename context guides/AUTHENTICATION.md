# Authentication System

This document describes the authentication system implemented in the Blue Moon Scheduler application.

## Features

- **Secure User Registration**: Users can create accounts with email and password
- **Secure Login**: JWT-based authentication with password hashing
- **Protected Routes**: All main application features require authentication
- **Session Management**: Persistent login sessions with localStorage
- **Logout Functionality**: Secure logout with token cleanup
- **Form Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error messages for user feedback

## Architecture

### Frontend (React + TypeScript)
- **AuthContext**: Manages authentication state and provides auth methods
- **useAuth Hook**: Custom hook for accessing authentication context
- **ProtectedRoute**: Component that guards routes requiring authentication
- **Login/Register Components**: Beautiful, responsive forms with validation
- **AuthWrapper**: Handles the login/register flow switching

### Backend (Node.js + Express)
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: express-validator for request validation
- **CORS Support**: Cross-origin resource sharing enabled
- **Error Handling**: Comprehensive error responses

## Security Features

1. **Password Security**:
   - Passwords are hashed using bcryptjs with salt rounds
   - Minimum 6 character password requirement
   - Password confirmation validation

2. **JWT Tokens**:
   - 24-hour token expiration
   - Secure secret key (configurable via environment)
   - Token validation on protected routes

3. **Input Validation**:
   - Email format validation
   - Password strength requirements
   - XSS protection through input sanitization

4. **Session Management**:
   - Secure token storage in localStorage
   - Automatic token cleanup on logout
   - Persistent sessions across browser refreshes

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)
- `GET /api/health` - Health check

### Request/Response Examples

#### Register
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "confirmPassword": "password123"
}

Response:
{
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm run setup
   ```

2. **Start Development Servers**:
   ```bash
   # Start both frontend and backend
   npm run dev:all
   
   # Or start separately
   npm run dev:server  # Backend only
   npm run dev         # Frontend only
   ```

3. **Environment Configuration**:
   - Frontend: `.env` file with `VITE_API_URL`
   - Backend: `server/.env` file with `PORT` and `JWT_SECRET`

## Usage

### For Users
1. Visit the application at `http://localhost:5173`
2. Click "Sign up here" to create a new account
3. Fill in the registration form with your details
4. After successful registration, you'll be automatically logged in
5. Use the logout button in the header to sign out

### For Developers
1. Import `useAuth` hook in components that need authentication
2. Use `ProtectedRoute` to wrap components requiring authentication
3. Access user data via `useAuth().user`
4. Call `login()`, `register()`, or `logout()` methods as needed

## Security Considerations

### Production Deployment
1. **Change JWT Secret**: Use a strong, unique secret key
2. **Use HTTPS**: Always use HTTPS in production
3. **Database**: Replace in-memory storage with a proper database
4. **Rate Limiting**: Implement rate limiting for auth endpoints
5. **Environment Variables**: Use secure environment variable management
6. **Token Refresh**: Consider implementing token refresh mechanism
7. **Password Policies**: Implement stronger password requirements
8. **Account Lockout**: Add account lockout after failed attempts

### Additional Security Measures
- Implement CSRF protection
- Add request logging and monitoring
- Use secure headers (helmet.js)
- Implement proper error handling without information leakage
- Regular security audits and dependency updates

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend CORS is properly configured
2. **Token Expired**: Tokens expire after 24 hours, user needs to re-login
3. **Validation Errors**: Check that all required fields are provided
4. **Server Not Running**: Ensure backend server is running on port 3001

### Debug Mode
- Check browser console for client-side errors
- Check server console for backend errors
- Verify environment variables are set correctly
- Test API endpoints directly using tools like Postman
