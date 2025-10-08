import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './websocketContext';
import { useAuth } from './authContext';

const DeviceContext = createContext();

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

export const DeviceProvider = ({ children }) => {
  const { user } = useAuth();
  const { emit, on, off, deviceSocket, isNamespaceConnected } = useWebSocket();

  // Device state
  const [availableDevices, setAvailableDevices] = useState([]);
  const [pairedDevice, setPairedDevice] = useState(null);
  const [pairingRequests, setPairingRequests] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Pairing state
  const [pairingCode, setPairingCode] = useState(null);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingStep, setPairingStep] = useState('idle'); // idle, generating, waiting, confirming, paired
  const [pairingError, setPairingError] = useState(null);

  // Monitor socket connection changes
  useEffect(() => {
    if (!deviceSocket) return;

    const handleConnect = () => {
      console.log('Device socket connected event');
      setForceUpdate(prev => prev + 1);
    };

    const handleDisconnect = () => {
      console.log('Device socket disconnected event');
      setForceUpdate(prev => prev + 1);
    };

    deviceSocket.on('connect', handleConnect);
    deviceSocket.on('disconnect', handleDisconnect);

    return () => {
      deviceSocket.off('connect', handleConnect);
      deviceSocket.off('disconnect', handleDisconnect);
    };
  }, [deviceSocket]);

  // Derive device status directly from socket connection state
  const deviceStatus = React.useMemo(() => {
    if (!deviceSocket) return 'disconnected';
    if (!deviceSocket.connected) return 'disconnected';
    if (pairedDevice) return 'paired';
    return 'connected';
  }, [deviceSocket, deviceSocket?.connected, pairedDevice, forceUpdate]);

  // Set up event listeners when device socket connects
  useEffect(() => {
    if (!deviceSocket?.connected) {
      console.log('Device socket not connected');
      return;
    }

    console.log('Device socket connected, setting up event listeners');

    // Set up device event listeners
    const cleanup = [
      on('device', 'device-scan-results', handleDeviceScanResults),
      on('device', 'device-list-updated', handleDeviceListUpdated),
      on('device', 'pair-request', handlePairRequest),
      on('device', 'pair-response', handlePairResponse),
      on('device', 'pair-response-error', handlePairResponseError),
      on('device', 'unpaired', handleUnpaired),
      on('device', 'pair-disconnected', handlePairDisconnected),
      on('device', 'device-status', handleDeviceStatus)
    ];

    // Request initial device status
    emit('device', 'device-status');

    return () => {
      cleanup.forEach(cleanupFn => cleanupFn());
    };
  }, [deviceSocket?.connected, on, off, emit]);

  const handleDeviceScanResults = useCallback((devices) => {
    console.log('Device scan results:', devices);
    console.log(`Found ${devices.length} devices:`, devices.map(d => `${d.userName} (${d.userRole})`));
    setAvailableDevices(devices);
    setIsScanning(false);
  }, []);

  const handleDeviceListUpdated = useCallback((devices) => {
    console.log('Device list updated:', devices);
    setAvailableDevices(devices);
  }, []);

  const handlePairRequest = useCallback((request) => {
    console.log('Received pair request:', request);
    setPairingRequests(prev => {
      // Avoid duplicates
      if (prev.some(req => req.fromSocketId === request.fromSocketId)) {
        return prev;
      }
      return [...prev, { ...request, timestamp: Date.now() }];
    });
  }, []);

  const handlePairResponse = useCallback((response) => {
    console.log('Received pair response:', response);

    if (response.accepted) {
      setPairedDevice({
        socketId: response.fromSocketId,
        userName: response.fromUserName,
        userRole: response.fromUserRole,
        pairedAt: Date.now()
      });
      setPairingStep('paired');
      setPairingError(null);

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowPairingModal(false);
        setPairingCode(null);
      }, 2000);
    } else {
      setPairingStep('idle');
      setPairingError(response.error || 'Pairing request was rejected');

      // Close modal after showing error
      setTimeout(() => {
        setShowPairingModal(false);
        setPairingCode(null);
        setPairingError(null);
      }, 3000);
    }
  }, []);

  const handlePairResponseError = useCallback((error) => {
    console.error('Pair response error:', error);
    setPairingError(error.message || 'An error occurred during pairing');
  }, []);

  const handleUnpaired = useCallback((data) => {
    console.log('Device unpaired:', data);
    setPairedDevice(null);
    setPairingStep('idle');
  }, []);

  const handlePairDisconnected = useCallback((data) => {
    console.log('Paired device disconnected:', data);
    setPairedDevice(null);
    setPairingStep('idle');
  }, []);

  const handleDeviceStatus = useCallback((status) => {
    console.log('Device status received from server:', status);
    // Status is now derived from socket connection, so this is just for logging
  }, []);

  // Device discovery
  const scanForDevices = useCallback(() => {
    if (!deviceSocket?.connected) {
      console.warn('Device socket not connected');
      return;
    }

    console.log('Scanning for devices...');
    setIsScanning(true);
    emit('device', 'device-scan');

    // Timeout scanning after 10 seconds
    setTimeout(() => {
      setIsScanning(false);
    }, 10000);
  }, [emit, deviceSocket]);

  // Device pairing
  const requestPairing = useCallback((targetDevice) => {
    if (!deviceSocket?.connected) {
      console.warn('Device socket not connected');
      return;
    }

    // Generate 6-digit pairing code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    setPairingCode(code);
    setPairingStep('waiting');
    setShowPairingModal(true);

    // Send pairing request
    emit('device', 'pair-request', {
      targetSocketId: targetDevice.socketId,
      pairingCode: code
    });

    console.log(`Sent pairing request to ${targetDevice.userName} with code ${code}`);
  }, [emit, deviceSocket]);

  const respondToPairingRequest = useCallback((request, accepted, enteredCode = null) => {
    if (!deviceSocket?.connected) {
      console.warn('Device socket not connected');
      return;
    }

    emit('device', 'pair-response', {
      targetSocketId: request.fromSocketId,
      accepted: accepted,
      pairingCode: request.pairingCode,
      enteredCode: enteredCode
    });

    // Update pairing requests
    setPairingRequests(prev =>
      prev.filter(req => req.fromSocketId !== request.fromSocketId)
    );

    if (accepted) {
      setPairedDevice({
        socketId: request.fromSocketId,
        userName: request.fromUserName,
        userRole: request.fromUserRole,
        pairedAt: Date.now()
      });
      setPairingStep('paired');
    }

    console.log(`Responded to pairing request: ${accepted ? 'accepted' : 'rejected'}`);
  }, [emit, deviceSocket]);

  const unpairDevice = useCallback(() => {
    if (!pairedDevice || !deviceSocket?.connected) {
      return;
    }

    emit('device', 'unpair', {
      targetSocketId: pairedDevice.socketId
    });

    setPairedDevice(null);
    setPairingStep('idle');
    console.log('Unpaired device');
  }, [emit, deviceSocket, pairedDevice]);

  // Pairing modal management
  const closePairingModal = useCallback(() => {
    setShowPairingModal(false);
    setPairingCode(null);
    setPairingStep('idle');
  }, []);

  const dismissPairingRequest = useCallback((requestId) => {
    setPairingRequests(prev => 
      prev.filter(req => req.fromSocketId !== requestId)
    );
  }, []);

  // Connection quality monitoring
  const checkConnectionQuality = useCallback(() => {
    if (!deviceSocket?.connected) {
      return;
    }

    const startTime = Date.now();

    emit('device', 'ping');

    const cleanup = on('device', 'pong', (data) => {
      const latency = Date.now() - startTime;
      console.log('Device connection latency:', latency, 'ms');

      emit('device', 'connection-quality', {
        latency: latency,
        timestamp: Date.now()
      });

      cleanup();
    });
  }, [emit, on, deviceSocket]);

  // Generate pairing code for display
  const generatePairingCode = useCallback(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPairingCode(code);
    setPairingStep('generating');
    setShowPairingModal(true);
    return code;
  }, []);

  const value = {
    // Device state
    availableDevices,
    pairedDevice,
    pairingRequests,
    deviceStatus,
    isScanning,

    // Pairing state
    pairingCode,
    showPairingModal,
    pairingStep,
    pairingError,

    // Device discovery
    scanForDevices,

    // Device pairing
    requestPairing,
    respondToPairingRequest,
    unpairDevice,
    generatePairingCode,

    // Modal management
    closePairingModal,
    dismissPairingRequest,

    // Utilities
    checkConnectionQuality,

    // Helper methods
    isPaired: !!pairedDevice,
    canPair: deviceStatus === 'connected' && !pairedDevice,
    isAdmin: user?.role === 'admin'
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};