# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when developing, deploying, or using the Research Experiment Management System.

## Quick Diagnostics

### System Health Check

Run this script to check if all services are working:

```bash
#!/bin/bash
echo "=== System Health Check ==="

# Check if services are running
echo "Checking services..."
curl -f http://localhost:5000/api/test && echo "✅ Backend API: OK" || echo "❌ Backend API: Failed"
curl -f http://localhost:3000 && echo "✅ Frontend: OK" || echo "❌ Frontend: Failed"

# Check database connection
echo "Checking MongoDB..."
mongo --eval "db.adminCommand('ismaster')" > /dev/null 2>&1 && echo "✅ MongoDB: OK" || echo "❌ MongoDB: Failed"

# Check OpenBCI (if hardware connected)
echo "Checking OpenBCI..."
python -c "import serial; print('✅ Serial communication: OK')" 2>/dev/null || echo "❌ Serial communication: Check hardware"

echo "=== Health Check Complete ==="
```

## Backend Issues

### Server Won't Start

#### Error: `EADDRINUSE: address already in use`

**Cause**: Another process is using port 5000

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
# Or use a different port
PORT=5001 npm start
```

#### Error: `Cannot find module`

**Cause**: Missing dependencies or incorrect path

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be v18+

# Clear npm cache
npm cache clean --force
```

#### Error: `MongoDB connection failed`

**Cause**: MongoDB not running or incorrect connection string

**Solution**:
```bash
# Check MongoDB status
brew services list | grep mongodb  # Mac
sudo systemctl status mongod        # Linux
sc query MongoDB                    # Windows

# Start MongoDB
brew services start mongodb-community  # Mac
sudo systemctl start mongod            # Linux
net start MongoDB                      # Windows

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/experiment_management_dev
```

### Database Issues

#### Error: `MongooseError: Operation buffering timed out`

**Cause**: Database connection timeout

**Solution**:
```bash
# Check MongoDB is accessible
mongo mongodb://localhost:27017/experiment_management_dev

# Increase connection timeout in config
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
});

# Restart MongoDB service
sudo systemctl restart mongod
```

#### Error: `E11000 duplicate key error`

**Cause**: Trying to insert duplicate unique values

**Solution**:
```bash
# Check for existing data
mongo experiment_management_dev
> db.users.find({username: "duplicate_username"})

# Drop problematic indexes
> db.users.dropIndex("index_name")

# Recreate indexes
npm run create-admin
```

#### Database Schema Issues

**Problem**: Model validation errors after schema changes

**Solution**:
```bash
# Reset development database
mongo experiment_management_dev
> db.dropDatabase()

# Reinitialize with new schema
npm run create-admin

# Run migrations if available
npm run migrate
```

### Authentication Issues

#### Error: `jwt malformed`

**Cause**: Invalid or corrupted JWT token

**Solution**:
```bash
# Check JWT_SECRET in .env
JWT_SECRET=your_super_secret_jwt_key_here

# Clear browser localStorage/sessionStorage
# In browser console:
localStorage.clear();
sessionStorage.clear();

# Restart backend to reset sessions
```

#### Error: `Access denied. No token provided`

**Cause**: Missing Authorization header

**Solution**:
```bash
# Ensure token is included in requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/experiments
```

### File Upload Issues

#### Error: `ENOENT: no such file or directory, open 'uploads/...'`

**Cause**: Upload directory doesn't exist

**Solution**:
```bash
# Create upload directories
mkdir -p uploads/audio uploads/eeg

# Check permissions
chmod 755 uploads/
chmod 755 uploads/audio/
chmod 755 uploads/eeg/

# Set correct ownership (Linux/Mac)
sudo chown -R $USER:$USER uploads/
```

#### Error: `File too large`

**Cause**: File exceeds size limit

**Solution**:
```bash
# Increase limits in middleware/upload.js
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});
```

## Frontend Issues

### Development Server Issues

#### Error: `npm start` fails with dependency conflicts

**Cause**: Conflicting package versions

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Or use yarn
rm -rf node_modules yarn.lock
yarn install
```

#### Error: `Module not found: Can't resolve`

**Cause**: Incorrect import paths or missing files

**Solution**:
```bash
# Check file exists and path is correct
ls -la src/components/ExperimentCard.js

# Check import statement
import ExperimentCard from '../components/ExperimentCard';

# Restart development server
npm start
```

### Build Issues

#### Error: `npm run build` fails

**Cause**: Various build-time errors

**Solution**:
```bash
# Check for console.log statements (if linting is strict)
# Remove or comment out debug statements

# Check for unused variables
# Remove or use them

# Increase memory if build fails due to memory issues
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Check for TypeScript errors (if using TypeScript)
npx tsc --noEmit
```

#### Error: `JavaScript heap out of memory`

**Cause**: Insufficient memory for build process

**Solution**:
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build

# Or permanently in package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=8192' react-scripts build"
}
```

### Runtime Issues

#### Error: API calls failing (CORS issues)

**Cause**: Cross-origin requests blocked

**Solution**:
```bash
# Check backend CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:80'],
  credentials: true
}));

# Check API URL in frontend .env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Error: Components not rendering

**Cause**: JavaScript errors or incorrect state

**Solution**:
```bash
# Check browser console for errors
# Open DevTools (F12) -> Console tab

# Check React DevTools
# Install React Developer Tools browser extension

# Add error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## OpenBCI/Hardware Issues

### Device Connection Issues

#### Error: `SerialException: could not open port`

**Cause**: Serial port unavailable or incorrect

**Solution**:
```bash
# List available serial ports (Linux/Mac)
ls /dev/tty*
ls /dev/cu*  # Mac specifically

# Check port permissions (Linux)
sudo usermod -a -G dialout $USER
# Logout and login again

# Windows: Check Device Manager for COM ports

# Test port directly
python -c "import serial; s = serial.Serial('/dev/ttyUSB0', 115200); print('Port OK'); s.close()"
```

#### Error: `OpenBCI device not responding`

**Cause**: Hardware connection or power issues

**Solution**:
```bash
# Check hardware connections
# - USB cable firmly connected
# - Device powered on
# - Electrodes properly connected

# Reset OpenBCI device
# 1. Unplug USB
# 2. Wait 10 seconds
# 3. Reconnect USB

# Test with OpenBCI GUI software first
# Download from: https://github.com/OpenBCI/OpenBCI_GUI
```

### Data Collection Issues

#### Error: `EEG data appears noisy or invalid`

**Cause**: Poor electrode contact or interference

**Solution**:
```bash
# Check electrode impedance
# - Should be < 50kΩ for good signal
# - Apply more conductive gel if needed
# - Clean electrode contacts

# Check for interference sources
# - Turn off nearby electronics
# - Use shielded cables
# - Ground the participant properly

# Verify sampling rate
python -c "
import numpy as np
data = np.loadtxt('eeg_file.csv', delimiter=',')
print(f'Data shape: {data.shape}')
print(f'Sampling rate check: {len(data) / 60} Hz per minute')
"
```

#### Error: `Data collection stops unexpectedly`

**Cause**: Hardware disconnect or buffer overflow

**Solution**:
```bash
# Increase buffer sizes in Python code
board.prepare_session()
board.config_board('x1060100X')  # Enable all channels

# Add error handling
try:
    data = board.get_board_data()
except Exception as e:
    print(f"Data collection error: {e}")
    # Restart collection
```

## Python Integration Issues

### Environment Issues

#### Error: `ModuleNotFoundError: No module named 'brainflow'`

**Cause**: Missing Python dependencies

**Solution**:
```bash
# Activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# If still fails, install directly
pip install brainflow
pip install numpy pandas matplotlib
```

#### Error: `ImportError: DLL load failed` (Windows)

**Cause**: Missing Visual C++ redistributables

**Solution**:
```bash
# Install Visual C++ Redistributables
# Download from Microsoft website

# Or use conda instead of pip
conda create -n eeg_env python=3.9
conda activate eeg_env
conda install -c conda-forge brainflow numpy pandas
```

### BrainFlow Issues

#### Error: `BOARD_NOT_READY_ERROR`

**Cause**: Board not properly initialized

**Solution**:
```python
# Proper initialization sequence
from brainflow.board_shim import BoardShim, BrainFlowInputParams

def initialize_board():
    BoardShim.enable_dev_board_logger()
    
    params = BrainFlowInputParams()
    params.serial_port = '/dev/ttyUSB0'  # or 'COM3' on Windows
    
    board = BoardShim(0, params)  # 0 = Cyton board
    
    try:
        board.prepare_session()
        print("Board initialized successfully")
        return board
    except Exception as e:
        print(f"Board initialization failed: {e}")
        return None
```

## Docker Issues

### Container Build Issues

#### Error: `Docker build fails with network timeout`

**Cause**: Network connectivity or proxy issues

**Solution**:
```bash
# Check Docker daemon status
docker info

# Use different base image registry
# In Dockerfile, change FROM node:18 to:
FROM node:18-alpine

# Build with no cache
docker build --no-cache -t experiment-backend .

# Configure proxy if behind corporate firewall
docker build --build-arg HTTP_PROXY=http://proxy:8080 .
```

#### Error: `npm install fails in Docker`

**Cause**: Platform-specific dependency issues

**Solution**:
```dockerfile
# In Dockerfile, use specific platform
FROM --platform=linux/amd64 node:18

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps --no-audit

# Clear npm cache
RUN npm cache clean --force
```

### Container Runtime Issues

#### Error: `Container exits immediately`

**Cause**: Application crashes or configuration issues

**Solution**:
```bash
# Check container logs
docker-compose logs backend

# Run container interactively
docker run -it experiment-backend /bin/bash

# Check environment variables
docker-compose exec backend env

# Verify port mapping
docker-compose ps
```

#### Error: `Services can't communicate`

**Cause**: Network configuration issues

**Solution**:
```bash
# Check Docker network
docker network ls
docker network inspect experiment-management-system_default

# Verify service names in docker-compose.yml match connection strings
# Use service names for internal communication:
MONGODB_URI=mongodb://mongo:27017/experiment_management_dev

# Test connectivity between services
docker-compose exec backend ping mongo
```

### Volume and Permission Issues

#### Error: `Permission denied` in volumes

**Cause**: File permission mismatches

**Solution**:
```bash
# Fix file ownership (Linux/Mac)
sudo chown -R $USER:$USER .

# Set proper permissions
chmod -R 755 uploads/

# In docker-compose.yml, use user directive
services:
  backend:
    user: "${UID}:${GID}"
    
# Set UID and GID in .env
echo "UID=$(id -u)" >> .env
echo "GID=$(id -g)" >> .env
```

## Testing Issues

### Test Failures

#### Error: Tests timeout or hang

**Cause**: Async operations not properly handled

**Solution**:
```javascript
// Increase test timeout
describe('Integration Tests', () => {
  jest.setTimeout(30000);  // 30 seconds
  
  afterEach(async () => {
    // Properly clean up after each test
    await mongoose.connection.dropDatabase();
  });
});

// Use proper async/await
it('should create experiment', async () => {
  const response = await request(app)
    .post('/api/experiments')
    .send(testData);
    
  expect(response.status).toBe(201);
});
```

#### Error: `MongoMemoryServer` issues

**Cause**: In-memory database connection problems

**Solution**:
```javascript
// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27018,  // Use different port
      dbName: 'test_db'
    }
  });
  
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

### Coverage Issues

#### Error: Low test coverage warnings

**Cause**: Insufficient test coverage

**Solution**:
```bash
# Generate detailed coverage report
npm run test:coverage -- --verbose

# Check which lines are not covered
open coverage/lcov-report/index.html

# Add tests for uncovered code paths
# Focus on error conditions and edge cases
```

## Performance Issues

### Slow API Responses

#### Cause: Database queries not optimized

**Solution**:
```javascript
// Add indexes to frequently queried fields
const experimentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status: { type: String, enum: ['Active', 'Completed', 'Draft'], index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Use aggregation for complex queries
const experiments = await Experiment.aggregate([
  { $match: { status: 'Active' } },
  { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'creator' } },
  { $project: { name: 1, description: 1, 'creator.username': 1 } }
]);
```

### High Memory Usage

#### Cause: Memory leaks or large data processing

**Solution**:
```javascript
// Implement pagination
const getExperiments = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return await Experiment.find()
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'username');
};

// Stream large files instead of loading into memory
const fs = require('fs');
const csv = require('csv-parser');

const processEEGFile = (filename) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filename)
      .pipe(csv())
      .on('data', (data) => {
        // Process row by row
        results.push(processRow(data));
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};
```

## Deployment Issues

### Production Environment

#### Error: `502 Bad Gateway` (Nginx)

**Cause**: Backend service not accessible

**Solution**:
```bash
# Check backend service status
docker-compose ps

# Check Nginx configuration
docker-compose exec nginx nginx -t

# Check upstream servers
# In nginx.conf:
upstream backend {
    server backend:5000;  # Use service name, not localhost
}

# Restart services in correct order
docker-compose restart backend
docker-compose restart nginx
```

#### Error: Environment variables not loaded

**Cause**: Missing or incorrect .env files

**Solution**:
```bash
# Check .env files exist
ls -la .env*

# Verify Docker Compose loads env files
docker-compose config

# Use explicit env_file in docker-compose.yml
services:
  backend:
    env_file:
      - .env
      - .env.production
```

## Security Issues

### SSL/TLS Issues

#### Error: Certificate errors

**Cause**: Invalid or expired SSL certificates

**Solution**:
```bash
# Generate self-signed certificate for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Or use Let's Encrypt for production
certbot --nginx -d yourdomain.com

# Update Nginx configuration
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### Authentication Issues

#### Error: Session management problems

**Cause**: JWT token handling issues

**Solution**:
```javascript
// Implement proper token refresh
const refreshToken = async () => {
  try {
    const response = await axios.post('/api/auth/refresh');
    localStorage.setItem('token', response.data.token);
    return response.data.token;
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
};

// Add request interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Getting Help

### Diagnostic Information to Collect

When seeking help, include:

```bash
# System information
uname -a
node --version
npm --version
python --version
docker --version

# Service status
docker-compose ps
curl -I http://localhost:5000/api/test

# Error logs
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend

# Database status
mongo --eval "db.stats()"
```

### Support Channels

1. **GitHub Issues**: Create issue with diagnostic information
2. **Documentation**: Check all documentation sections
3. **Community Forums**: Search for similar issues
4. **Direct Contact**: For security or urgent issues

### Creating Effective Bug Reports

Include:
- **Environment details** (OS, versions, configuration)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Error messages** and stack traces
- **Screenshots or recordings** if relevant
- **Workarounds** you've tried

This troubleshooting guide covers the most common issues. For persistent problems, don't hesitate to reach out to the community or maintainers for assistance.