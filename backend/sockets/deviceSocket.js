// Device management WebSocket handlers
const handleDeviceEvents = (io, connectedDevices, devicePairs) => {
  io.on('connection', (socket) => {
    console.log(`Device socket connected: ${socket.user.username} (${socket.id})`);

    // Device discovery and status
    socket.on('device-scan', () => {
      console.log('Device scan requested by:', socket.user.username);

      // Return list of available devices (excluding the requester)
      const availableDevices = Array.from(connectedDevices.values())
        .filter(device => device.socketId !== socket.id)
        .map(device => ({
          socketId: device.socketId,
          userName: device.username,
          userRole: device.userRole,
          status: device.status || 'connected',
          connectedAt: device.connectedAt
        }));

      socket.emit('device-scan-results', availableDevices);
    });

    socket.on('device-status', () => {
      const deviceInfo = connectedDevices.get(socket.id);
      if (deviceInfo) {
        socket.emit('device-status', {
          ...deviceInfo,
          timestamp: Date.now()
        });
      }
    });

    // Device pairing
    socket.on('pair-request', (data) => {
      const { targetSocketId, pairingCode } = data;

      console.log(`Pair request from ${socket.user.username} to ${targetSocketId} with code ${pairingCode}`);

      // Send pairing request to target device
      io.to(targetSocketId).emit('pair-request', {
        fromSocketId: socket.id,
        fromUserName: socket.user.username,
        fromUserRole: socket.userRole,
        pairingCode: pairingCode,
        timestamp: Date.now()
      });
    });

    socket.on('pair-response', (data) => {
      const { targetSocketId, accepted, pairingCode } = data;

      console.log(`Pair response from ${socket.user.username}: ${accepted ? 'accepted' : 'rejected'}`);

      // Send response back to original requester
      io.to(targetSocketId).emit('pair-response', {
        fromSocketId: socket.id,
        fromUserName: socket.user.username,
        fromUserRole: socket.userRole,
        accepted: accepted,
        pairingCode: pairingCode,
        timestamp: Date.now()
      });

      if (accepted) {
        // Update device status to paired
        const currentDevice = connectedDevices.get(socket.id);
        const targetDevice = connectedDevices.get(targetSocketId);

        if (currentDevice && targetDevice) {
          currentDevice.pairedWith = targetSocketId;
          currentDevice.status = 'paired';
          targetDevice.pairedWith = socket.id;
          targetDevice.status = 'paired';

          // Create pair record
          const pairId = `pair_${Math.min(socket.id, targetSocketId)}_${Math.max(socket.id, targetSocketId)}`;
          devicePairs.set(pairId, {
            pairId,
            adminSocketId: socket.userRole === 'admin' ? socket.id : targetSocketId,
            participantSocketId: socket.userRole === 'admin' ? targetSocketId : socket.id,
            createdAt: Date.now()
          });

          // Join both devices to a paired room
          socket.join(pairId);
          io.to(targetSocketId).emit('join-pair-room', pairId);

          console.log(`Devices paired successfully: ${pairId}`);
        }
      }
    });

    socket.on('unpair', (data) => {
      const { targetSocketId } = data;

      console.log(`Unpair request from ${socket.user.username} to ${targetSocketId}`);

      const currentDevice = connectedDevices.get(socket.id);
      const targetDevice = connectedDevices.get(targetSocketId);

      if (currentDevice && targetDevice) {
        // Remove pairing
        delete currentDevice.pairedWith;
        delete targetDevice.pairedWith;
        currentDevice.status = 'connected';
        targetDevice.status = 'connected';

        // Remove pair record
        for (const [pairId, pair] of devicePairs.entries()) {
          if (pair.adminSocketId === socket.id || pair.participantSocketId === socket.id) {
            devicePairs.delete(pairId);
            console.log(`Removed pair: ${pairId}`);
          }
        }

        // Notify target device
        io.to(targetSocketId).emit('unpaired', {
          fromSocketId: socket.id,
          fromUserName: socket.user.username,
          timestamp: Date.now()
        });
      }
    });

    // Connection quality monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('connection-quality', (data) => {
      const device = connectedDevices.get(socket.id);
      if (device) {
        device.connectionQuality = data;
        device.lastPing = Date.now();
      }
    });

    // Network information
    socket.on('network-info', (data) => {
      const device = connectedDevices.get(socket.id);
      if (device) {
        device.networkInfo = {
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
          ...data
        };
      }
    });

    socket.on('disconnect', () => {
      console.log(`Device socket disconnected: ${socket.user.username} (${socket.id})`);

      const disconnectedDevice = connectedDevices.get(socket.id);
      if (disconnectedDevice && disconnectedDevice.pairedWith) {
        // Notify paired device about disconnection
        io.to(disconnectedDevice.pairedWith).emit('pair-disconnected', {
          socketId: socket.id,
          userName: socket.user.username,
          timestamp: Date.now()
        });

        // Update paired device status
        const pairedDevice = connectedDevices.get(disconnectedDevice.pairedWith);
        if (pairedDevice) {
          delete pairedDevice.pairedWith;
          pairedDevice.status = 'connected';
        }

        // Remove pair record
        for (const [pairId, pair] of devicePairs.entries()) {
          if (pair.adminSocketId === socket.id || pair.participantSocketId === socket.id) {
            devicePairs.delete(pairId);
          }
        }
      }

      // Broadcast updated device list to all connected devices
      const remainingDevices = Array.from(connectedDevices.values());
      socket.broadcast.emit('device-list-updated', remainingDevices);
    });

    // Send initial device list to newly connected device
    const deviceList = Array.from(connectedDevices.values())
      .filter(device => device.socketId !== socket.id);
    socket.emit('device-list-updated', deviceList);
  });
};

module.exports = { handleDeviceEvents };
