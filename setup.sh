#!/bin/bash

echo "🚀 Setting up Blue Moon Scheduler with Authentication..."

# Create .env files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
EOF
fi

if [ ! -f server/.env ]; then
    echo "📝 Creating server/.env file..."
    cat > server/.env << EOF
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)
EOF
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the server: cd server && npm run dev"
echo "2. Start the frontend: npm run dev"
echo ""
echo "The application will be available at http://localhost:5173"
echo "The API will be available at http://localhost:3001"
