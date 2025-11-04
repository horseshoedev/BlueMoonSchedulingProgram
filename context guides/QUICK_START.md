# Quick Start Guide

## 🚀 Getting Started with Blue Moon Scheduler

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### 1. Setup
Run the setup script to install all dependencies and create environment files:

```bash
npm run setup
```

### 2. Start the Application
Start both the frontend and backend servers:

```bash
npm run dev:all
```

This will start:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 3. Create Your Account
1. Open http://localhost:5173 in your browser
2. Click "Sign up here" to create a new account
3. Fill in your details:
   - Full name
   - Email address
   - Password (minimum 6 characters)
   - Confirm password
4. Click "Create account"

### 4. Start Scheduling!
Once logged in, you can:
- View your dashboard
- Set your availability
- Manage groups
- Configure settings
- Logout when done

### Alternative: Manual Setup

If you prefer to set up manually:

1. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Create environment files**:
   
   Create `.env` in the root:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```
   
   Create `server/.env`:
   ```
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

3. **Start servers**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

### Troubleshooting

**Port already in use?**
- Change the PORT in `server/.env` to a different number
- Update `VITE_API_URL` in `.env` to match

**CORS errors?**
- Ensure the backend is running on port 3001
- Check that `VITE_API_URL` points to the correct backend URL

**Can't create account?**
- Check that the backend server is running
- Verify all required fields are filled
- Ensure password is at least 6 characters
- Check that passwords match

### Need Help?

- Check the [Authentication Documentation](AUTHENTICATION.md) for detailed technical information
- Review the [README](README.md) for general project information
- Check the browser console for error messages
- Verify both servers are running and accessible

### Security Note

This is a development setup. For production deployment, please refer to the security considerations in the [Authentication Documentation](AUTHENTICATION.md).
