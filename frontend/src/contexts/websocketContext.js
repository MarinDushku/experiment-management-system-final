import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './authContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Socket connections for different namespaces
  const [mainSocket, setMainSocket] = useState(null);
  const [experimentSocket, setExperimentSocket] = useState(null);
  const [deviceSocket, setDeviceSocket] = useState(null);
  const [eegSocket, setEegSocket] = useState(null);
  
  const reconnectTimeoutRef = useRef(null);
  const connectionAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connections
  useEffect(() => {
    if (!user || !token) {
      disconnectAll();
      return;
    }

    connect();

    // Cleanup on unmount
    return () => {
      disconnectAll();
    };
  }, [user, token]);

  const connect = () => {
    if (connectionAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      setConnectionStatus('failed');
      return;
    }

    try {
      setConnectionStatus('connecting');

      const serverUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      
      const socketOptions = {
        auth: {
          token: token
        },
        headers: {
          Authorization: `Bearer ${token}`
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      };

      // Create main socket connection
      const main = io(serverUrl, socketOptions);
      
      // Create namespace connections
      const experiment = io(`${serverUrl}/experiment`, socketOptions);
      const device = io(`${serverUrl}/device`, socketOptions);
      const eeg = io(`${serverUrl}/eeg`, socketOptions);

      // Main socket event handlers
      main.on('connect', () => {
        console.log('Main WebSocket connected');
        connectionAttempts.current = 0;
        setIsConnected(true);
        setConnectionStatus('connected');
      });

      main.on('connection-established', (data) => {
        console.log('Connection established:', data);
      });

      main.on('disconnect', (reason) => {
        console.log('Main WebSocket disconnected:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        if (reason === 'io server disconnect') {
          // Server-initiated disconnect, attempt to reconnect
          attemptReconnect();
        }
      });

      main.on('connect_error', (error) => {
        console.error('Main WebSocket connection error:', error);
        setConnectionStatus('error');
        attemptReconnect();
      });

      // Set up namespace event handlers
      setupNamespaceHandlers(experiment, device, eeg);

      // Store socket connections
      setMainSocket(main);
      setExperimentSocket(experiment);
      setDeviceSocket(device);
      setEegSocket(eeg);

    } catch (error) {
      console.error('Error creating WebSocket connections:', error);
      setConnectionStatus('error');
      attemptReconnect();
    }
  };

  const setupNamespaceHandlers = (experiment, device, eeg) => {
    // Experiment socket handlers
    experiment.on('connect', () => {
      console.log('Experiment WebSocket connected');
      
      // Join appropriate room based on user role
      if (user?.role === 'admin') {
        experiment.emit('join-as-admin');
      }
    });

    experiment.on('disconnect', (reason) => {
      console.log('Experiment WebSocket disconnected:', reason);
    });

    // Device socket handlers
    device.on('connect', () => {
      console.log('Device WebSocket connected');
    });

    device.on('disconnect', (reason) => {
      console.log('Device WebSocket disconnected:', reason);
    });

    // EEG socket handlers
    eeg.on('connect', () => {
      console.log('EEG WebSocket connected');
    });

    eeg.on('disconnect', (reason) => {
      console.log('EEG WebSocket disconnected:', reason);
    });
  };

  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    connectionAttempts.current += 1;
    
    if (connectionAttempts.current > maxReconnectAttempts) {
      setConnectionStatus('failed');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, connectionAttempts.current), 30000); // Exponential backoff, max 30s
    
    setConnectionStatus('reconnecting');
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${connectionAttempts.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      disconnectAll();
      connect();
    }, delay);
  };

  const disconnectAll = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    [mainSocket, experimentSocket, deviceSocket, eegSocket].forEach(socket => {
      if (socket) {
        socket.disconnect();
      }
    });

    setMainSocket(null);
    setExperimentSocket(null);
    setDeviceSocket(null);
    setEegSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const reconnect = () => {
    connectionAttempts.current = 0;
    disconnectAll();
    setTimeout(connect, 1000);
  };

  // Emit event to specific namespace
  const emit = (namespace, event, data) => {
    let socket;
    
    switch (namespace) {
      case 'experiment':
        socket = experimentSocket;
        break;
      case 'device':
        socket = deviceSocket;
        break;
      case 'eeg':
        socket = eegSocket;
        break;
      default:
        socket = mainSocket;
    }

    if (socket && socket.connected) {
      socket.emit(event, data);
      return true;
    } else {
      console.warn(`Cannot emit ${event} to ${namespace}: socket not connected`);
      return false;
    }
  };

  // Subscribe to events on specific namespace
  const on = (namespace, event, handler) => {
    let socket;
    
    switch (namespace) {
      case 'experiment':
        socket = experimentSocket;
        break;
      case 'device':
        socket = deviceSocket;
        break;
      case 'eeg':
        socket = eegSocket;
        break;
      default:
        socket = mainSocket;
    }

    if (socket) {
      socket.on(event, handler);
      
      // Return cleanup function
      return () => {
        if (socket) {
          socket.off(event, handler);
        }
      };
    }
    
    return () => {}; // No-op cleanup
  };

  // Remove event listener from specific namespace
  const off = (namespace, event, handler) => {
    let socket;
    
    switch (namespace) {
      case 'experiment':
        socket = experimentSocket;
        break;
      case 'device':
        socket = deviceSocket;
        break;
      case 'eeg':
        socket = eegSocket;
        break;
      default:
        socket = mainSocket;
    }

    if (socket) {
      socket.off(event, handler);
    }
  };

  const value = {
    // Connection status
    isConnected,
    connectionStatus,
    
    // Socket instances
    mainSocket,
    experimentSocket,
    deviceSocket,
    eegSocket,
    
    // Connection management
    connect,
    disconnect: disconnectAll,
    reconnect,
    
    // Event handling
    emit,
    on,
    off,
    
    // Helper methods
    isNamespaceConnected: (namespace) => {
      switch (namespace) {
        case 'experiment':
          return experimentSocket?.connected || false;
        case 'device':
          return deviceSocket?.connected || false;
        case 'eeg':
          return eegSocket?.connected || false;
        default:
          return mainSocket?.connected || false;
      }
    }
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};