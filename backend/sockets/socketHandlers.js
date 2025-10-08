const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Import specific socket handlers
const { handleDeviceEvents } = require('./deviceSocket');
const { handleExperimentEvents } = require('./experimentSocket');
const { handleEEGEvents } = require('./eegSocket');

// Shared state across all namespaces
const connectedDevices = new Map();
const devicePairs = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      console.error('Socket auth failed: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    console.log('Attempting to verify socket token...');
    const jwtSecret = process.env.JWT_SECRET || 'eeg_experiment_secret_key_2024_secure_development_mode';
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id || decoded.user?.id; // Support both token formats
    console.log('Token decoded successfully for user ID:', userId);

    const user = await User.findById(userId).select('-password');

    if (!user) {
      console.error('Socket auth failed: User not found for ID:', userId);
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.user = user;

    console.log(`Socket authenticated for user: ${user.username}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token format'));
    }
    next(new Error('Authentication error: Invalid token'));
  }
};

// Main socket handler initialization
module.exports = (namespaces) => {
  const { main, experiment, device, eeg } = namespaces;

  // Apply authentication middleware to all namespaces
  main.use(authenticateSocket);
  experiment.use(authenticateSocket);
  device.use(authenticateSocket);
  eeg.use(authenticateSocket);

  // Main namespace - general connection handling
  main.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected to main namespace with socket ID: ${socket.id}`);

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

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.username} disconnected from main: ${reason}`);

      // Remove from connected devices
      const deviceInfo = connectedDevices.get(socket.id);
      connectedDevices.delete(socket.id);

      // Remove any device pairs involving this socket
      for (const [pairId, pair] of devicePairs.entries()) {
        if (pair.adminSocketId === socket.id || pair.participantSocketId === socket.id) {
          // Notify the other device in the pair
          const otherSocketId = pair.adminSocketId === socket.id ? pair.participantSocketId : pair.adminSocketId;
          if (otherSocketId && connectedDevices.has(otherSocketId)) {
            main.to(otherSocketId).emit('device-pair-disconnected', {
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

  // Initialize namespace-specific handlers with shared state
  handleDeviceEvents(device, connectedDevices, devicePairs);
  handleExperimentEvents(experiment, connectedDevices, devicePairs);
  handleEEGEvents(eeg, connectedDevices, devicePairs);

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [socketId, deviceInfo] of connectedDevices.entries()) {
      if (now - deviceInfo.connectedAt > staleThreshold) {
        // Check if socket is still connected in any namespace
        const mainSocket = main.sockets.get(socketId);
        const experimentSocket = experiment.sockets.get(socketId);
        const deviceSocket = device.sockets.get(socketId);
        const eegSocket = eeg.sockets.get(socketId);

        if (!mainSocket?.connected && !experimentSocket?.connected &&
            !deviceSocket?.connected && !eegSocket?.connected) {
          connectedDevices.delete(socketId);
          console.log(`Cleaned up stale device connection: ${socketId}`);
        }
      }
    }
  }, 60000); // Run every minute

  console.log('Socket.IO namespaces initialized: /, /experiment, /device, /eeg');
};
