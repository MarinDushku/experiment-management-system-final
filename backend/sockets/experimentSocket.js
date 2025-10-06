// Experiment WebSocket event handlers
const handleExperimentEvents = (io, connectedDevices, devicePairs) => {
  io.on('connection', (socket) => {
    console.log(`Experiment socket connected: ${socket.user.username} (${socket.id})`);

    // Join user to their own room for notifications
    socket.join(`user_${socket.user._id}`);

    // Device pairing events
    socket.on('device-pair-request', (data) => {
      console.log('Device pair request:', data);
      // Emit to admin devices only
      socket.to('admin_devices').emit('device-pair-request', {
        ...data,
        socketId: socket.id,
        user: socket.user
      });
    });

    socket.on('device-pair-response', (data) => {
      console.log('Device pair response:', data);
      // Send response to specific device
      io.to(data.targetSocketId).emit('device-pair-response', data);
    });

    socket.on('device-connected', (data) => {
      console.log('Device connected to experiment:', data);
      socket.join(`experiment_${data.experimentId}`);

      // Notify other devices in the same experiment
      socket.to(`experiment_${data.experimentId}`).emit('device-connected', {
        socketId: socket.id,
        user: socket.user,
        role: data.role
      });
    });

    // Experiment control events
    socket.on('experiment-start', (data) => {
      console.log('Experiment start:', data);
      socket.join(`experiment_${data.experimentId}`);

      // Broadcast to participant devices in this experiment
      socket.to(`experiment_${data.experimentId}`).emit('experiment-start', {
        experimentId: data.experimentId,
        currentStep: data.currentStep,
        timestamp: Date.now()
      });
    });

    socket.on('experiment-stop', (data) => {
      console.log('Experiment stop:', data);

      // Broadcast to all devices in this experiment
      socket.to(`experiment_${data.experimentId}`).emit('experiment-stop', {
        experimentId: data.experimentId,
        timestamp: Date.now()
      });
    });

    socket.on('experiment-pause', (data) => {
      console.log('Experiment pause:', data);

      socket.to(`experiment_${data.experimentId}`).emit('experiment-pause', {
        experimentId: data.experimentId,
        timestamp: Date.now()
      });
    });

    socket.on('step-change', (data) => {
      console.log('Step change:', data);

      // Broadcast step change to participant devices
      socket.to(`experiment_${data.experimentId}`).emit('step-change', {
        experimentId: data.experimentId,
        currentStep: data.currentStep,
        stepIndex: data.stepIndex,
        trialIndex: data.trialIndex,
        timestamp: Date.now()
      });
    });

    socket.on('step-complete', (data) => {
      console.log('Step complete from participant:', data);

      // Notify admin devices
      socket.to('admin_devices').emit('step-complete', {
        experimentId: data.experimentId,
        stepIndex: data.stepIndex,
        trialIndex: data.trialIndex,
        participantId: socket.user._id,
        timestamp: Date.now()
      });
    });

    // EEG data streaming events
    socket.on('eeg-recording-start', (data) => {
      console.log('EEG recording start:', data);

      socket.to(`experiment_${data.experimentId}`).emit('eeg-recording-start', {
        experimentId: data.experimentId,
        timestamp: Date.now()
      });
    });

    socket.on('eeg-recording-stop', (data) => {
      console.log('EEG recording stop:', data);

      socket.to(`experiment_${data.experimentId}`).emit('eeg-recording-stop', {
        experimentId: data.experimentId,
        timestamp: Date.now()
      });
    });

    socket.on('eeg-data-stream', (data) => {
      // Stream EEG data only to admin devices
      socket.to('admin_devices').emit('eeg-data-stream', {
        experimentId: data.experimentId,
        eegData: data.eegData,
        timestamp: Date.now()
      });
    });

    // Time synchronization
    socket.on('time-sync', () => {
      socket.emit('time-sync', {
        serverTime: Date.now()
      });
    });

    // Role-based room joining
    socket.on('join-as-admin', () => {
      socket.join('admin_devices');
      console.log(`User ${socket.user.username} joined as admin`);
    });

    socket.on('join-as-participant', (data) => {
      socket.join('participant_devices');
      if (data.experimentId) {
        socket.join(`experiment_${data.experimentId}`);
      }
      console.log(`User ${socket.user.username} joined as participant for experiment ${data.experimentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Experiment socket disconnected: ${socket.user.username} (${socket.id})`);
    });
  });
};

module.exports = { handleExperimentEvents };
