const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Import specific socket handlers
const deviceSocket = require('./deviceSocket');
const experimentSocket = require('./experimentSocket');
const eegSocket = require('./eegSocket');

// Store connected devices and their information
const connectedDevices = new Map();
const devicePairs = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.user = user;
    
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Main socket handler initialization
module.exports = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected with socket ID: ${socket.id}`);
    
    // Store device information
    const deviceInfo = {
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.userRole,
      username: socket.user.username,
      connectedAt: new Date(),
      deviceType: socket.handshake.headers['user-agent'] || 'unknown',
      ip: socket.handshake.address
    };
    
    connectedDevices.set(socket.id, deviceInfo);
    
    // Join user to their own room for targeted messaging
    socket.join(`user:${socket.userId}`);
    
    // Emit connection success
    socket.emit('connection-established', {
      message: 'Connected successfully',
      deviceId: socket.id,
      role: socket.userRole,
      connectedDevices: Array.from(connectedDevices.values())
    });

    // Broadcast to all other users that a device connected
    socket.broadcast.emit('device-connected', deviceInfo);

    // Initialize handlers for different socket event categories
    deviceSocket(io, socket, connectedDevices, devicePairs);
    experimentSocket(io, socket, connectedDevices, devicePairs);
    eegSocket(io, socket, connectedDevices, devicePairs);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.username} disconnected: ${reason}`);
      
      // Remove from connected devices
      const deviceInfo = connectedDevices.get(socket.id);
      connectedDevices.delete(socket.id);
      
      // Remove any device pairs involving this socket
      for (const [pairId, pair] of devicePairs.entries()) {
        if (pair.adminSocketId === socket.id || pair.participantSocketId === socket.id) {
          // Notify the other device in the pair
          const otherSocketId = pair.adminSocketId === socket.id ? pair.participantSocketId : pair.adminSocketId;
          if (otherSocketId && connectedDevices.has(otherSocketId)) {
            io.to(otherSocketId).emit('device-pair-disconnected', {
              pairId,
              disconnectedDevice: deviceInfo,
              reason: 'Device disconnected'
            });
          }
          devicePairs.delete(pairId);
        }
      }
      
      // Broadcast disconnection to other users
      socket.broadcast.emit('device-disconnected', {
        socketId: socket.id,
        deviceInfo,
        reason
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [socketId, deviceInfo] of connectedDevices.entries()) {
      if (now - deviceInfo.connectedAt > staleThreshold) {
        // Check if socket is still connected
        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          connectedDevices.delete(socketId);
          console.log(`Cleaned up stale device connection: ${socketId}`);
        }
      }
    }
  }, 60000); // Run every minute
};