# Developer Setup Guide

This guide will help you set up the Research Experiment Management System for development on your local machine.

## Prerequisites

### Required Software

- **Node.js** (v18+ recommended)
- **npm** or **yarn** package manager
- **MongoDB** (v6+ recommended) or Docker for MongoDB
- **Python** (v3.8+ for OpenBCI integration)
- **Git** for version control
- **Docker** (optional, for containerized development)

### Hardware Requirements

- **Minimum**: 8GB RAM, 2GB free disk space
- **Recommended**: 16GB RAM, 5GB free disk space
- **OpenBCI Device** (optional, for EEG features)

### Development Tools (Recommended)

- **VS Code** or similar IDE
- **Postman** or similar API testing tool
- **MongoDB Compass** for database management
- **Git client** (command line or GUI)

## Clone the Repository

```bash
git clone https://github.com/yourusername/experiment-management-system.git
cd experiment-management-system
```

## Environment Setup

### 1. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/experiment_management_dev
MONGODB_TEST_URI=mongodb://localhost:27017/experiment_management_test

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50000000

# OpenBCI Configuration
OPENBCI_PORT=COM3
OPENBCI_BOARD_ID=0
```

#### Database Setup

**Option 1: Local MongoDB Installation**

1. Install MongoDB following [official instructions](https://docs.mongodb.com/manual/installation/)
2. Start MongoDB service:
```bash
# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option 2: Docker MongoDB**

```bash
docker run -d --name experiment-mongo \
  -p 27017:27017 \
  -v mongo-data:/data/db \
  mongo:latest
```

#### Initialize Database

Create an admin user:

```bash
cd backend
npm run create-admin
```

#### Start Backend Development Server

```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

### 2. Frontend Setup

#### Install Dependencies

```bash
cd ../frontend
npm install --legacy-peer-deps
```

#### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
GENERATE_SOURCEMAP=false
```

#### Start Frontend Development Server

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### 3. Python/OpenBCI Setup

#### Install Python Dependencies

```bash
cd ../backend
pip install -r requirements.txt
```

#### Test OpenBCI Integration

```bash
cd python
python -m pytest tests/test_openbci_bridge.py -v
```

## Docker Development Setup (Alternative)

### Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose

### Quick Start with Docker

```bash
# Clone repository
git clone https://github.com/yourusername/experiment-management-system.git
cd experiment-management-system

# Create environment files
cp .env.docker .env

# Build and start all services
docker-compose up --build
```

Services will be available at:
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:5000`
- MongoDB: `localhost:27017`

### Docker Development Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

## Development Workflow

### Project Structure

```
experiment-management-system/
├── backend/
│   ├── controllers/        # API route handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   ├── tests/             # Backend tests
│   ├── python/            # OpenBCI integration
│   └── uploads/           # File uploads
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── test/          # Frontend tests
│   └── public/            # Static files
├── docs/                  # Documentation
├── docker-compose.yml     # Docker configuration
└── README.md
```

### Running Tests

#### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration

# Watch mode for development
npm run test:watch
```

#### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests with Cypress
npm run cypress:open
```

#### Python Tests

```bash
cd backend
python -m pytest tests/ -v
```

### Code Quality Tools

#### Linting and Formatting

Backend (if configured):
```bash
cd backend
npm run lint
npm run format
```

Frontend (if configured):
```bash
cd frontend
npm run lint
npm run format
```

### API Documentation

#### Swagger UI

Access interactive API documentation:
- Development: `http://localhost:5000/api/docs`
- Update OpenAPI spec: `docs/api/openapi.yaml`

#### Generating API Documentation

```bash
cd docs/api
# API documentation is automatically generated from OpenAPI spec
```

## Database Management

### MongoDB Compass

1. Install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to: `mongodb://localhost:27017`
3. Database: `experiment_management_dev`

### Common Database Operations

#### Reset Development Database

```bash
cd backend
node scripts/resetDatabase.js
```

#### Seed Test Data

```bash
cd backend
node scripts/seedTestData.js
```

#### Database Backup

```bash
mongodump --db experiment_management_dev --out backup/
```

### Database Schema

Key collections:
- `users` - User accounts and authentication
- `experiments` - Research experiments
- `trials` - Individual experiment trials
- `steps` - Experimental steps and stimuli
- `responses` - Participant responses and results

## OpenBCI Development

### Hardware Setup

1. Connect OpenBCI Cyton board via USB or Bluetooth
2. Install OpenBCI GUI for testing
3. Configure serial port in `.env` file

### Testing Without Hardware

The system includes mock functionality for development without physical OpenBCI hardware:

```javascript
// In your .env file
OPENBCI_MOCK_MODE=true
```

### Python Integration

#### Virtual Environment Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

#### Running Python Scripts

```bash
# Test OpenBCI connection
python python/openbci_bridge.py

# Run data analysis
python python/brainwave_visualizer.py
```

## Troubleshooting

### Common Development Issues

#### Port Conflicts

```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>

# Find process using port 5000
lsof -i :5000
kill -9 <PID>
```

#### Database Connection Issues

```bash
# Check MongoDB status
brew services list | grep mongodb  # Mac
sudo systemctl status mongod        # Linux
sc query MongoDB                    # Windows

# Reset MongoDB
brew services restart mongodb-community  # Mac
sudo systemctl restart mongod            # Linux
```

#### Node.js Version Issues

```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use recommended Node.js version
nvm install 18
nvm use 18
```

#### Python Environment Issues

```bash
# Reinstall Python dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# Check Python path
which python
python --version
```

### Docker Issues

#### Container Build Failures

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# View detailed logs
docker-compose logs --details backend
```

#### Volume Permission Issues

```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# Reset Docker volumes
docker-compose down -v
docker-compose up --build
```

## Development Best Practices

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-experiment-type

# Make commits with clear messages
git commit -m "Add audio stimulus support to experiments"

# Push feature branch
git push origin feature/new-experiment-type

# Create pull request
```

### Code Style

- Follow existing code formatting
- Add comments for complex logic
- Write tests for new features
- Update documentation

### Testing Guidelines

- Write unit tests for all new functions
- Add integration tests for API endpoints
- Test error conditions and edge cases
- Maintain test coverage above 80%

### Security Considerations

- Never commit sensitive data (.env files)
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security guidelines

## IDE Configuration

### VS Code Recommended Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "ms-python.python",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode-remote.remote-containers"
  ]
}
```

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.defaultInterpreterPath": "./backend/venv/bin/python"
}
```

## Next Steps

1. **Complete environment setup** following this guide
2. **Run the test suite** to ensure everything works
3. **Explore the codebase** starting with key files
4. **Review the API documentation** to understand endpoints
5. **Check the issues tracker** for contribution opportunities

For additional help:
- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review [Contributing Guidelines](./contributing.md)
- Join the development community discussions