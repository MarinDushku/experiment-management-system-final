#!/bin/bash

# Experiment Management System Docker Setup Script

echo "🔬 Setting up Experiment Management System with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove existing images to force rebuild
echo "🗑️ Removing existing images..."
docker rmi -f $(docker images | grep experiment | awk '{print $3}') 2>/dev/null || true

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to initialize..."
sleep 20

# Create admin user
echo "👤 Creating admin user..."
docker-compose exec backend node scripts/createAdmin.js

echo "✅ Setup complete!"
echo ""
echo "📊 Access your application:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:5000"
echo "   MongoDB: mongodb://admin:password123@localhost:27017/experiment-management"
echo ""
echo "🔑 Default admin credentials:"
echo "   Username: md"
echo "   Password: 12345678"
echo ""
echo "🔍 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛠️ To stop the application:"
echo "   docker-compose down"