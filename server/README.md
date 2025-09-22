# Blue Moon Scheduler Server

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file in the server directory with:
```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. Create a `.env` file in the root directory with:
```
VITE_API_URL=http://localhost:3001/api
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)
- `POST /api/auth/logout` - Logout user (requires authentication)
- `GET /api/health` - Health check

## Security Notes

- Change the JWT_SECRET in production
- In production, use a proper database instead of in-memory storage
- Implement rate limiting
- Add HTTPS
- Use environment-specific configurations
