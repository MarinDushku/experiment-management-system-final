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

- **Ubuntu 18.04 LTS or newer** (for admin device)
- **Node.js 14+ and npm**
- **MongoDB**
- **WiFi Network** (for device communication)
- **OpenBCI Hardware** (optional, for EEG experiments)

### Installation Steps

#### 1. System Preparation

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

#### 2. MongoDB Installation

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

#### 3. Project Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/experiment-management-system.git
cd experiment-management-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

#### 4. User Account Setup

```bash
# Create admin user (for experiment control)
cd backend
node scripts/createAdmin.js

# Create participant users (for experiment participation)
node scripts/createParticipant.js 5  # Creates 5 participants

# Verify accounts created
echo "Admin: username=md, password=12345678"
echo "Participants: username=participant1-5, password=participant123"
```

#### 5. Network Configuration

```bash
# Find your IP address for network access
ip addr show | grep "inet " | grep -v "127.0.0.1"
# Note your IP address (e.g., 192.168.1.100)

# Configure firewall (if enabled)
sudo ufw allow 3000  # Frontend
sudo ufw allow 5000  # Backend
```

#### 6. Start the Application

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

## Two-Device Operation Guide

### Network Access Setup

1. **Find Your Admin Device IP**:
   ```bash
   hostname -I
   # Example output: 192.168.1.100
   ```

2. **Access URLs**:
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

2. **Reset Database** (if needed):
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

3. **Check Logs**:
   ```bash
   # Backend logs
   cd backend && npm start
   
   # Frontend logs
   cd frontend && npm start
   
   # MongoDB logs
   sudo journalctl -u mongod
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

For production use with PM2:

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