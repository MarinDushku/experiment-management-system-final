# Research Experiment Management System

A professional web-based platform for conducting EEG research experiments with secure two-device connectivity. Features real-time device pairing, experiment synchronization, and role-based access control for admin and participant devices.

## Two-Device EEG Experiment System

This system enables secure communication between:
- **Admin Device** (Ubuntu PC with OpenBCI): Controls experiments, views live EEG data
- **Participant Device** (Phone/Laptop): Receives experiment stimuli, responds to tasks

### Key Features

- 🔒 **Secure Device Pairing**: 6-digit authentication codes
- 🧠 **Real-time EEG Streaming**: Live brainwave data to admin only
- 📱 **Cross-Platform Support**: Works on phones, tablets, laptops
- 👥 **Role-Based Access**: Separate interfaces for admin and participants
- 🌐 **Network Discovery**: Automatic device detection on local network
- ⚡ **Real-time Sync**: WebSocket-based experiment coordination

## Quick Setup Guide

### Prerequisites

- **Admin Device**: Ubuntu 18.04+ OR Windows 10+ (for experiment control)
- **Node.js 18+ and npm**
- **MongoDB**
- **WiFi Network** (for device communication)
- **OpenBCI Hardware** (optional, for EEG experiments)

---

## 🐧 **Linux (Ubuntu) Setup**

### 1. System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18+
npm --version
```

### 2. MongoDB Installation

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod  # Verify running
```

---

## 🪟 **Windows Setup**

### 1. System Preparation

1. **Install Node.js**:
   - Download from: https://nodejs.org/en/download/
   - Choose "Windows Installer (.msi)" for your system (x64 recommended)
   - Run installer and follow the setup wizard
   - ✅ Check "Add to PATH" option

2. **Verify Installation**:
   ```cmd
   # Open Command Prompt (cmd) or PowerShell
   node --version
   npm --version
   ```

### 2. MongoDB Installation

**Option A: MongoDB Community Server (Recommended)**
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Choose "Windows" and run the `.msi` installer
3. During installation:
   - ✅ Choose "Complete" setup
   - ✅ Install MongoDB as a Service
   - ✅ Install MongoDB Compass (GUI tool)
4. MongoDB will start automatically as a Windows service

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at: https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string and update your `.env` file

**Verify MongoDB is Running**:
```cmd
# Check if MongoDB service is running
sc query MongoDB

# Or check if port 27017 is listening
netstat -an | findstr :27017
```

### 3. Git Installation (if needed)
- Download Git for Windows: https://git-scm.com/download/win
- Use Git Bash or Command Prompt for git commands

---

## 📦 **Project Installation (Both Linux & Windows)**

### 1. Clone the Repository

**Linux (Terminal)**:
```bash
git clone https://github.com/MarinDushku/experiment-management-system-final.git
cd experiment-management-system-final
```

**Windows (Command Prompt or Git Bash)**:
```cmd
git clone https://github.com/MarinDushku/experiment-management-system-final.git
cd experiment-management-system-final
```

### 2. Install Dependencies

**Both Linux & Windows**:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. User Account Setup

**Both Linux & Windows**:
```bash
# Create admin user (for experiment control)
cd backend
node scripts/createAdmin.js

# Create participant users (for experiment participation)
node scripts/createParticipant.js 5

# Verify accounts created
echo "Admin: username=md, password=12345678"
echo "Participants: username=participant1-5, password=participant123"
```

### 4. Network Configuration

**Linux**:
```bash
# Find your IP address for network access
ip addr show | grep "inet " | grep -v "127.0.0.1"
# Note your IP address (e.g., 192.168.1.100)

# Configure firewall (if enabled)
sudo ufw allow 3000  # Frontend
sudo ufw allow 5000  # Backend
```

**Windows**:
```cmd
# Find your IP address
ipconfig | findstr "IPv4"
# Note your IP address (e.g., 192.168.1.100)

# Configure Windows Firewall (if needed)
# Go to Windows Security > Firewall & network protection > Allow an app through firewall
# Or run as Administrator:
netsh advfirewall firewall add rule name="EEG System Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="EEG System Backend" dir=in action=allow protocol=TCP localport=5000
```

### 5. Start the Application

**Linux**:
```bash
# Start MongoDB (if not running)
sudo systemctl start mongod

# Start backend server (from backend directory)
cd backend
npm start
# Should show: "Server started on port 5000" and "WebSocket server ready"

# In another terminal, start frontend (from frontend directory)
cd frontend
npm start
# Should show: "webpack compiled with warnings" and start on port 3000
```

**Windows**:
```cmd
# MongoDB should already be running as a service
# If not, start it manually:
net start MongoDB

# Start backend server (from backend directory)
cd backend
npm start
# Should show: "Server started on port 5000" and "WebSocket server ready"

# In another Command Prompt window, start frontend:
cd frontend
npm start
# Should show: "webpack compiled with warnings" and start on port 3000
```

## Two-Device Operation Guide

### Network Access Setup

**Linux**:
```bash
# Find your admin device IP
hostname -I
# Example output: 192.168.1.100
```

**Windows**:
```cmd
# Find your admin device IP
ipconfig | findstr "IPv4"
# Look for: IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Access URLs**:
- **Admin Device**: http://localhost:3000
- **Participant Devices**: http://[ADMIN-IP]:3000 (e.g., http://192.168.1.100:3000)

### Device Pairing Process

#### Step 1: Admin Device Setup
1. Login as admin (`md` / `12345678`)
2. Navigate to **"Device Connection"** in the menu
3. Click **"Scan for Devices"** to discover available devices
4. Select a participant device from the list
5. Click **"Pair Device"** - a 6-digit code will be generated
6. **Share this code** with the participant

#### Step 2: Participant Device Setup
1. Open browser and go to http://[ADMIN-IP]:3000
2. Login as participant (`participant1` / `participant123`)
3. Navigate to **"Device Connection"**
4. Click **"Enter Pairing Code"**
5. **Enter the 6-digit code** provided by admin
6. Wait for pairing confirmation

#### Step 3: Run Experiments
1. **Admin**: Navigate to "Experiments" → Select experiment → "Run"
2. **Participant**: Will automatically receive experiment steps
3. **Admin**: Views live EEG data and controls experiment flow
4. **Participant**: Sees only stimuli, questions, and tasks

### Security Features

- ✅ **6-Digit Pairing Codes**: Secure device authentication
- ✅ **JWT Authentication**: User session management
- ✅ **Role-Based Access**: Admin vs participant permissions
- ✅ **Network Validation**: Local network only by default
- ✅ **Auto-Disconnect**: Sessions end when experiments complete

### Troubleshooting

#### Connection Issues

**Problem**: Participant device can't access admin device

**Linux**:
```bash
# Check IP address is correct
ip addr show

# Test network connectivity
ping [ADMIN-IP]

# Check firewall
sudo ufw status
sudo ufw allow 3000
sudo ufw allow 5000
```

**Windows**:
```cmd
# Check IP address is correct
ipconfig

# Test network connectivity
ping [ADMIN-IP]

# Check Windows Firewall
# Go to Windows Security > Firewall & network protection
# Ensure "experiment" related apps are allowed

# Or add firewall rules:
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe"
```

**Problem**: WebSocket connection fails
- Ensure both backend and frontend are running
- Check browser console for WebSocket errors
- Verify CORS configuration in backend

**Problem**: Pairing fails
- Ensure both devices are on same WiFi network
- Check that 6-digit code is entered correctly
- Try refreshing both browser pages

#### Common Solutions

1. **Restart Services**:

   **Linux**:
   ```bash
   # Kill existing processes
   pkill -f "node server.js"
   pkill -f "react-scripts start"
   
   # Restart MongoDB
   sudo systemctl restart mongod
   
   # Restart backend and frontend
   cd backend && npm start &
   cd frontend && npm start
   ```

   **Windows**:
   ```cmd
   # Kill existing Node.js processes
   taskkill /f /im node.exe
   
   # Restart MongoDB service
   net stop MongoDB
   net start MongoDB
   
   # Restart backend and frontend (in separate command prompts)
   cd backend && npm start
   # In another window:
   cd frontend && npm start
   ```

2. **Reset Database** (if needed):

   **Linux**:
   ```bash
   # Stop MongoDB
   sudo systemctl stop mongod
   
   # Clear data
   sudo rm -rf /var/lib/mongodb/*
   
   # Start MongoDB
   sudo systemctl start mongod
   
   # Recreate users
   cd backend
   node scripts/createAdmin.js
   node scripts/createParticipant.js 3
   ```

   **Windows**:
   ```cmd
   # Stop MongoDB service
   net stop MongoDB
   
   # Clear MongoDB data directory (default location)
   rmdir /s "C:\Program Files\MongoDB\Server\7.0\data"
   mkdir "C:\Program Files\MongoDB\Server\7.0\data"
   
   # Start MongoDB service
   net start MongoDB
   
   # Recreate users
   cd backend
   node scripts/createAdmin.js
   node scripts/createParticipant.js 3
   ```

3. **Check Logs**:

   **Linux**:
   ```bash
   # Backend logs
   cd backend && npm start
   
   # Frontend logs
   cd frontend && npm start
   
   # MongoDB logs
   sudo journalctl -u mongod
   ```

   **Windows**:
   ```cmd
   # Backend logs (Command Prompt)
   cd backend && npm start
   
   # Frontend logs (Another Command Prompt)
   cd frontend && npm start
   
   # MongoDB logs (Event Viewer or MongoDB Compass)
   # Go to Event Viewer > Windows Logs > Application
   # Filter by source: MongoDB
   ```

## User Accounts

### Default Admin Account
- **Username**: `md`
- **Password**: `12345678`
- **Role**: `admin`
- **Capabilities**: Full system access, experiment control, EEG data viewing

### Default Participant Accounts
- **Usernames**: `participant1`, `participant2`, `participant3`, etc.
- **Password**: `participant123`
- **Role**: `user`
- **Capabilities**: Experiment participation only

### Creating Additional Users

**Both Linux & Windows**:
```bash
# Create single participant
cd backend
node scripts/createParticipant.js john mypassword

# Create multiple participants
node scripts/createParticipant.js 10  # Creates participant1-10

# Create custom admin (if needed)
node scripts/createAdmin.js
```

## Network Security Recommendations

1. **Use Private Networks**: Keep experiments on isolated WiFi
2. **Change Default Passwords**: Update all user passwords
3. **Firewall Configuration**: Only allow necessary ports
4. **Monitor Connections**: Check device pairing regularly
5. **Session Management**: End sessions after experiments

## Production Deployment

**Linux (with PM2)**:
```bash
# Install PM2
sudo npm install -g pm2

# Start services
cd backend
pm2 start server.js --name "eeg-backend"

cd ../frontend
pm2 serve build 3000 --name "eeg-frontend"

# Configure auto-start
pm2 startup
pm2 save
```

**Windows (with PM2)**:
```cmd
# Install PM2 globally
npm install -g pm2

# Build frontend for production
cd frontend
npm run build
cd ..

# Start services
cd backend
pm2 start server.js --name "eeg-backend"

cd ../frontend
pm2 serve build 3000 --name "eeg-frontend"

# Configure auto-start
pm2 startup
pm2 save
```

**Windows (as Windows Service)**:
For automatic startup on Windows boot, consider using:
- **NSSM** (Non-Sucking Service Manager): https://nssm.cc/
- **node-windows**: npm package for creating Windows services

## System Architecture

```
Admin Device (Ubuntu PC + OpenBCI)
├── Backend Server (Port 5000)
│   ├── WebSocket Server (Device pairing)
│   ├── API Server (Data management)
│   └── EEG Bridge (OpenBCI integration)
├── Frontend App (Port 3000)
│   ├── Admin Interface (Experiment control)
│   ├── Device Management (Pairing interface)
│   └── Live EEG Viewer (Real-time data)
└── MongoDB Database (User & experiment data)

Participant Devices (Phone/Laptop)
└── Browser Client
    ├── Participant Interface (Stimuli display)
    ├── Device Connection (Pairing)
    └── WebSocket Client (Real-time sync)
```

## API Documentation

The system includes comprehensive API documentation available at:
- **Local**: http://localhost:5000/api/docs
- **Network**: http://[ADMIN-IP]:5000/api/docs

## Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review application logs for error messages
3. Ensure all network connectivity requirements are met
4. Verify user permissions and device pairing status

---

**Ready to conduct professional EEG research with secure multi-device connectivity!** 🧠⚡📱