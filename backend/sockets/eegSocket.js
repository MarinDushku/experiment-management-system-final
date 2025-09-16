const { authenticateSocket } = require('./experimentSocket');

// EEG data streaming WebSocket handlers
const handleEEGEvents = (io) => {
  // Store active EEG streaming sessions
  const eegSessions = new Map();

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    
    // EEG streaming control
    socket.on('eeg-stream-start', (data) => {
      const { experimentId, streamConfig = {} } = data;
      
      console.log(`EEG stream start requested by ${socket.user.name} for experiment ${experimentId}`);
      
      // Only admin users can start EEG streaming
      if (socket.user.role !== 'admin') {
        socket.emit('eeg-stream-error', {
          error: 'Unauthorized: Only admin users can start EEG streaming',
          timestamp: Date.now()
        });
        return;
      }

      // Create streaming session
      const sessionId = `${experimentId}_${socket.id}`;
      eegSessions.set(sessionId, {
        sessionId,
        experimentId,
        adminSocketId: socket.id,
        adminUserId: socket.user.id,
        streamConfig: {
          sampleRate: streamConfig.sampleRate || 250, // Default 250 Hz
          channels: streamConfig.channels || 8, // Default 8 channels
          bufferSize: streamConfig.bufferSize || 1000,
          ...streamConfig
        },
        startTime: Date.now(),
        isActive: true,
        dataBuffer: []
      });

      // Join EEG streaming room
      socket.join(`eeg_stream_${experimentId}`);
      
      // Confirm stream started
      socket.emit('eeg-stream-started', {
        sessionId,
        experimentId,
        streamConfig: eegSessions.get(sessionId).streamConfig,
        timestamp: Date.now()
      });

      // Notify other admin devices
      socket.to('admin_devices').emit('eeg-stream-started', {
        sessionId,
        experimentId,
        adminUser: socket.user.name,
        timestamp: Date.now()
      });
    });

    socket.on('eeg-stream-stop', (data) => {
      const { experimentId, sessionId } = data;
      
      console.log(`EEG stream stop requested by ${socket.user.name} for experiment ${experimentId}`);
      
      // Find and stop the session
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        // Find session by experiment ID and admin socket ID
        for (const [sid, session] of eegSessions.entries()) {
          if (session.experimentId === experimentId && session.adminSocketId === socket.id) {
            targetSessionId = sid;
            break;
          }
        }
      }

      const session = eegSessions.get(targetSessionId);
      if (session) {
        session.isActive = false;
        session.endTime = Date.now();
        
        // Leave streaming room
        socket.leave(`eeg_stream_${experimentId}`);
        
        // Confirm stream stopped
        socket.emit('eeg-stream-stopped', {
          sessionId: targetSessionId,
          experimentId,
          duration: session.endTime - session.startTime,
          samplesCollected: session.dataBuffer.length,
          timestamp: Date.now()
        });

        // Notify other admin devices
        socket.to('admin_devices').emit('eeg-stream-stopped', {
          sessionId: targetSessionId,
          experimentId,
          adminUser: socket.user.name,
          timestamp: Date.now()
        });

        // Clean up session after a delay (keep for 5 minutes for potential data retrieval)
        setTimeout(() => {
          eegSessions.delete(targetSessionId);
          console.log(`EEG session ${targetSessionId} cleaned up`);
        }, 5 * 60 * 1000);
      }
    });

    // EEG data streaming (from OpenBCI service)
    socket.on('eeg-data', (data) => {
      const { experimentId, eegData, timestamp = Date.now() } = data;
      
      // Find active session for this experiment
      let activeSession = null;
      for (const session of eegSessions.values()) {
        if (session.experimentId === experimentId && session.isActive) {
          activeSession = session;
          break;
        }
      }

      if (activeSession) {
        // Add data to buffer
        const dataPoint = {
          timestamp,
          data: eegData,
          channels: activeSession.streamConfig.channels
        };
        
        activeSession.dataBuffer.push(dataPoint);
        
        // Keep buffer size manageable
        if (activeSession.dataBuffer.length > activeSession.streamConfig.bufferSize) {
          activeSession.dataBuffer.shift();
        }

        // Stream data to admin devices only
        socket.to('admin_devices').emit('eeg-data-realtime', {
          experimentId,
          sessionId: activeSession.sessionId,
          eegData: dataPoint,
          bufferSize: activeSession.dataBuffer.length
        });
      }
    });

    // EEG data retrieval
    socket.on('eeg-get-buffer', (data) => {
      const { sessionId, experimentId, lastN = 100 } = data;
      
      let session = eegSessions.get(sessionId);
      
      // If no sessionId provided, find by experiment ID
      if (!session && experimentId) {
        for (const s of eegSessions.values()) {
          if (s.experimentId === experimentId) {
            session = s;
            break;
          }
        }
      }

      if (session) {
        const buffer = session.dataBuffer.slice(-lastN);
        socket.emit('eeg-buffer-data', {
          sessionId: session.sessionId,
          experimentId: session.experimentId,
          data: buffer,
          totalSamples: session.dataBuffer.length,
          timestamp: Date.now()
        });
      } else {
        socket.emit('eeg-buffer-error', {
          error: 'Session not found',
          sessionId,
          experimentId
        });
      }
    });

    // EEG streaming status
    socket.on('eeg-stream-status', (data) => {
      const { experimentId } = data;
      
      const activeSessions = Array.from(eegSessions.values())
        .filter(session => 
          (!experimentId || session.experimentId === experimentId) && 
          session.isActive
        )
        .map(session => ({
          sessionId: session.sessionId,
          experimentId: session.experimentId,
          adminUserId: session.adminUserId,
          streamConfig: session.streamConfig,
          startTime: session.startTime,
          bufferSize: session.dataBuffer.length,
          duration: Date.now() - session.startTime
        }));

      socket.emit('eeg-stream-status', {
        activeSessions,
        timestamp: Date.now()
      });
    });

    // EEG configuration updates
    socket.on('eeg-config-update', (data) => {
      const { sessionId, config } = data;
      
      const session = eegSessions.get(sessionId);
      if (session && session.adminSocketId === socket.id) {
        // Update configuration
        session.streamConfig = {
          ...session.streamConfig,
          ...config
        };

        socket.emit('eeg-config-updated', {
          sessionId,
          streamConfig: session.streamConfig,
          timestamp: Date.now()
        });

        // Notify other admin devices
        socket.to('admin_devices').emit('eeg-config-updated', {
          sessionId,
          streamConfig: session.streamConfig,
          updatedBy: socket.user.name,
          timestamp: Date.now()
        });
      }
    });

    socket.on('disconnect', () => {
      // Clean up any active EEG sessions for this admin
      for (const [sessionId, session] of eegSessions.entries()) {
        if (session.adminSocketId === socket.id && session.isActive) {
          console.log(`Stopping EEG session ${sessionId} due to admin disconnect`);
          session.isActive = false;
          session.endTime = Date.now();
          
          // Notify other admin devices
          socket.to('admin_devices').emit('eeg-stream-stopped', {
            sessionId,
            experimentId: session.experimentId,
            reason: 'admin_disconnected',
            adminUser: socket.user.name,
            timestamp: Date.now()
          });
        }
      }
    });
  });

  // Periodic cleanup of old sessions
  setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of eegSessions.entries()) {
      if (!session.isActive && session.endTime && (now - session.endTime > maxAge)) {
        console.log(`Cleaning up old EEG session: ${sessionId}`);
        eegSessions.delete(sessionId);
      }
    }
  }, 60 * 60 * 1000); // Check every hour
};

module.exports = { handleEEGEvents };