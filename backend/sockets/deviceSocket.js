const { authenticateSocket } = require('./experimentSocket');

// Device management WebSocket handlers
const handleDeviceEvents = (io) => {
  // Store active device connections
  const activeDevices = new Map();

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    // Register device
    activeDevices.set(socket.id, {
      socketId: socket.id,
      userId: socket.user.id,
      userName: socket.user.name,
      userRole: socket.user.role,
      connectedAt: Date.now(),
      status: 'connected'
    });

    // Device discovery and status
    socket.on('device-scan', () => {
      console.log('Device scan requested by:', socket.user.name);
      
      // Return list of available devices (excluding the requester)
      const availableDevices = Array.from(activeDevices.values())
        .filter(device => device.socketId !== socket.id)
        .map(device => ({
          socketId: device.socketId,
          userName: device.userName,
          userRole: device.userRole,
          status: device.status,
          connectedAt: device.connectedAt
        }));

      socket.emit('device-scan-results', availableDevices);
    });

    socket.on('device-status', () => {
      const deviceInfo = activeDevices.get(socket.id);
      socket.emit('device-status', {
        ...deviceInfo,
        timestamp: Date.now()
      });
    });

    // Device pairing
    socket.on('pair-request', (data) => {
      const { targetSocketId, pairingCode } = data;
      
      console.log(`Pair request from ${socket.user.name} to ${targetSocketId}`);
      
      // Send pairing request to target device
      socket.to(targetSocketId).emit('pair-request', {
        fromSocketId: socket.id,
        fromUserName: socket.user.name,
        fromUserRole: socket.user.role,
        pairingCode: pairingCode,
        timestamp: Date.now()
      });
    });

    socket.on('pair-response', (data) => {
      const { targetSocketId, accepted, pairingCode } = data;
      
      console.log(`Pair response from ${socket.user.name}: ${accepted ? 'accepted' : 'rejected'}`);
      
      // Send response back to original requester
      socket.to(targetSocketId).emit('pair-response', {
        fromSocketId: socket.id,
        fromUserName: socket.user.name,
        fromUserRole: socket.user.role,
        accepted: accepted,
        pairingCode: pairingCode,
        timestamp: Date.now()
      });

      if (accepted) {
        // Update device status to paired
        const currentDevice = activeDevices.get(socket.id);
        const targetDevice = activeDevices.get(targetSocketId);
        
        if (currentDevice && targetDevice) {
          currentDevice.pairedWith = targetSocketId;
          currentDevice.status = 'paired';
          targetDevice.pairedWith = socket.id;
          targetDevice.status = 'paired';
          
          // Join both devices to a paired room
          const pairRoomId = `pair_${Math.min(socket.id, targetSocketId)}_${Math.max(socket.id, targetSocketId)}`;
          socket.join(pairRoomId);
          socket.to(targetSocketId).emit('join-pair-room', pairRoomId);
        }
      }
    });

    socket.on('unpair', (data) => {
      const { targetSocketId } = data;
      
      console.log(`Unpair request from ${socket.user.name} to ${targetSocketId}`);
      
      const currentDevice = activeDevices.get(socket.id);
      const targetDevice = activeDevices.get(targetSocketId);
      
      if (currentDevice && targetDevice) {
        // Remove pairing
        delete currentDevice.pairedWith;
        delete targetDevice.pairedWith;
        currentDevice.status = 'connected';
        targetDevice.status = 'connected';
        
        // Notify target device
        socket.to(targetSocketId).emit('unpaired', {
          fromSocketId: socket.id,
          fromUserName: socket.user.name,
          timestamp: Date.now()
        });
      }
    });

    // Connection quality monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('connection-quality', (data) => {
      const device = activeDevices.get(socket.id);
      if (device) {
        device.connectionQuality = data;
        device.lastPing = Date.now();
      }
    });

    // Network information
    socket.on('network-info', (data) => {
      const device = activeDevices.get(socket.id);
      if (device) {
        device.networkInfo = {
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
          ...data
        };
      }
    });

    socket.on('disconnect', () => {
      console.log(`Device disconnected: ${socket.user.name} (${socket.id})`);
      
      const disconnectedDevice = activeDevices.get(socket.id);
      if (disconnectedDevice && disconnectedDevice.pairedWith) {
        // Notify paired device about disconnection
        socket.to(disconnectedDevice.pairedWith).emit('pair-disconnected', {
          socketId: socket.id,
          userName: socket.user.name,
          timestamp: Date.now()
        });
        
        // Update paired device status
        const pairedDevice = activeDevices.get(disconnectedDevice.pairedWith);
        if (pairedDevice) {
          delete pairedDevice.pairedWith;
          pairedDevice.status = 'connected';
        }
      }
      
      // Remove from active devices
      activeDevices.delete(socket.id);
      
      // Broadcast updated device list to all connected devices
      const remainingDevices = Array.from(activeDevices.values());
      socket.broadcast.emit('device-list-updated', remainingDevices);
    });

    // Send initial device list to newly connected device
    const deviceList = Array.from(activeDevices.values())
      .filter(device => device.socketId !== socket.id);
    socket.emit('device-list-updated', deviceList);
  });

  // Periodic cleanup of stale devices
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [socketId, device] of activeDevices.entries()) {
      if (now - device.connectedAt > staleThreshold && !device.lastPing) {
        console.log(`Removing stale device: ${device.userName} (${socketId})`);
        activeDevices.delete(socketId);
      }
    }
  }, 60000); // Check every minute
};

module.exports = { handleDeviceEvents };