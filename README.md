# Research Experiment Management System

A web-based platform for managing research experiments with structured trials and steps, featuring user authentication and role-based access control.

## Setup Guide for Ubuntu Server

### Prerequisites

- Ubuntu 18.04 LTS or newer
- Sudo privileges

### Installation Steps

#### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y



2. Install Node.js and npm

# Install Node.js 14.x
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

3. Install MongoDB

# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Reload package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start and enable MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

4. Clone and Setup the Project

# Clone repository (replace with your repository URL)
git clone https://github.com/yourusername/experiment-management-system.git
cd experiment-management-system

# Install backend dependencies
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit the .env file with your configuration
nano .env

# Run admin user setup script
node scripts/createAdmin.js

# Return to project root
cd ..

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..


5. Set Up Process Management with PM2
# Install PM2 globally
sudo npm install -g pm2

# Start the application
cd backend
pm2 start server.js --name "experiment-system"

# Set PM2 to start on system boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u <your-username> --hp /home/<your-username>
pm2 save

6. Configure Nginx as Reverse Proxy

7. Access the Application
The application should now be accessible through your server IP address or domain name.
Default Admin User
After running the setup script, you can log in with the following credentials:

Username: md
Password: 12345678

Windows Development Setup
For local development on Windows, follow these steps:

Install Node.js and MongoDB from their official websites
Clone the repository
Run npm install in both the backend and frontend directories
Start the backend with npm run dev in the backend directory
Start the frontend with npm start in the frontend directory

Project Structure
The project follows a standard structure:

backend/ - Server-side code with Express.js
frontend/ - Client-side code with React
deployment/ - Configuration files for deployment