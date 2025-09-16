import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/websocketContext';
import { useDevice } from '../../contexts/deviceContext';
import { useAuth } from '../../contexts/authContext';
import './DeviceConnection.css';

const DeviceConnection = () => {
  const { user } = useAuth();
  const { 
    connectionStatus, 
    isConnected, 
    isNamespaceConnected,
    reconnect 
  } = useWebSocket();
  
  const {
    availableDevices,
    pairedDevice,
    pairingRequests,
    deviceStatus,
    isScanning,
    pairingCode,
    showPairingModal,
    pairingStep,
    scanForDevices,
    requestPairing,
    respondToPairingRequest,
    unpairDevice,
    closePairingModal,
    dismissPairingRequest,
    isPaired,
    canPair,
    isAdmin
  } = useDevice();

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceList, setShowDeviceList] = useState(false);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'reconnecting': return '#FF9800';
      case 'disconnected': return '#757575';
      case 'error': return '#F44336';
      case 'failed': return '#D32F2F';
      default: return '#757575';
    }
  };

  const getDeviceStatusColor = () => {
    switch (deviceStatus) {
      case 'paired': return '#4CAF50';
      case 'connected': return '#2196F3';
      case 'disconnected': return '#757575';
      default: return '#757575';
    }
  };

  const handleScanDevices = () => {
    setShowDeviceList(true);
    scanForDevices();
  };

  const handleRequestPairing = (device) => {
    setSelectedDevice(device);
    requestPairing(device);
  };

  const handleRespondToPairing = (request, accepted) => {
    respondToPairingRequest(request, accepted);
  };

  const formatPairingCode = (code) => {
    if (!code) return '';
    // Format as XXX-XXX for better readability
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  return (
    <div className="device-connection">
      <div className="connection-header">
        <h2>Device Connection</h2>
        <div className="connection-status">
          <div 
            className="status-indicator"
            style={{ backgroundColor: getConnectionStatusColor() }}
          />
          <span className="status-text">
            WebSocket: {connectionStatus}
          </span>
        </div>
      </div>

      {/* Connection Details */}
      <div className="connection-details">
        <div className="detail-item">
          <span className="label">User:</span>
          <span className="value">{user?.name} ({user?.role})</span>
        </div>
        <div className="detail-item">
          <span className="label">Device Status:</span>
          <span 
            className="value"
            style={{ color: getDeviceStatusColor() }}
          >
            {deviceStatus}
          </span>
        </div>
        <div className="detail-item">
          <span className="label">Namespaces:</span>
          <div className="namespace-status">
            <span className={isNamespaceConnected('experiment') ? 'connected' : 'disconnected'}>
              Experiment
            </span>
            <span className={isNamespaceConnected('device') ? 'connected' : 'disconnected'}>
              Device
            </span>
            <span className={isNamespaceConnected('eeg') ? 'connected' : 'disconnected'}>
              EEG
            </span>
          </div>
        </div>
      </div>

      {/* Connection Actions */}
      {!isConnected && (
        <div className="connection-actions">
          <button onClick={reconnect} className="btn-primary">
            Reconnect
          </button>
        </div>
      )}

      {/* Device Management */}
      {isConnected && (
        <div className="device-management">
          {/* Paired Device Display */}
          {isPaired && pairedDevice && (
            <div className="paired-device">
              <h3>Paired Device</h3>
              <div className="device-card paired">
                <div className="device-info">
                  <span className="device-name">{pairedDevice.userName}</span>
                  <span className="device-role">({pairedDevice.userRole})</span>
                  <span className="paired-time">
                    Paired: {new Date(pairedDevice.pairedAt).toLocaleTimeString()}
                  </span>
                </div>
                <button 
                  onClick={unpairDevice}
                  className="btn-secondary"
                >
                  Unpair
                </button>
              </div>
            </div>
          )}

          {/* Device Discovery */}
          {canPair && (
            <div className="device-discovery">
              <div className="discovery-header">
                <h3>Available Devices</h3>
                <button 
                  onClick={handleScanDevices}
                  disabled={isScanning}
                  className="btn-primary"
                >
                  {isScanning ? 'Scanning...' : 'Scan for Devices'}
                </button>
              </div>

              {showDeviceList && (
                <div className="device-list">
                  {isScanning && (
                    <div className="scanning-indicator">
                      <div className="spinner"></div>
                      <span>Scanning for devices...</span>
                    </div>
                  )}

                  {availableDevices.length === 0 && !isScanning && (
                    <div className="no-devices">
                      No devices found. Make sure other devices are connected to the same network.
                    </div>
                  )}

                  {availableDevices.map((device) => (
                    <div key={device.socketId} className="device-card">
                      <div className="device-info">
                        <span className="device-name">{device.userName}</span>
                        <span className="device-role">({device.userRole})</span>
                        <span className="device-status">
                          Status: {device.status}
                        </span>
                        <span className="connection-time">
                          Connected: {new Date(device.connectedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRequestPairing(device)}
                        className="btn-primary"
                        disabled={device.status === 'paired'}
                      >
                        {device.status === 'paired' ? 'Already Paired' : 'Request Pairing'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pairing Requests */}
          {pairingRequests.length > 0 && (
            <div className="pairing-requests">
              <h3>Pairing Requests</h3>
              {pairingRequests.map((request) => (
                <div key={request.fromSocketId} className="pairing-request">
                  <div className="request-info">
                    <span className="requester-name">{request.fromUserName}</span>
                    <span className="requester-role">({request.fromUserRole})</span>
                    <span className="pairing-code">
                      Code: {formatPairingCode(request.pairingCode)}
                    </span>
                    <span className="request-time">
                      {new Date(request.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="request-actions">
                    <button 
                      onClick={() => handleRespondToPairing(request, true)}
                      className="btn-success"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleRespondToPairing(request, false)}
                      className="btn-danger"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => dismissPairingRequest(request.fromSocketId)}
                      className="btn-secondary"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pairing Modal */}
      {showPairingModal && (
        <div className="modal-overlay">
          <div className="modal-content pairing-modal">
            <div className="modal-header">
              <h3>Device Pairing</h3>
              <button 
                onClick={closePairingModal}
                className="close-button"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {pairingStep === 'waiting' && (
                <div className="pairing-waiting">
                  <div className="pairing-code-display">
                    <span className="code-label">Pairing Code:</span>
                    <span className="pairing-code-large">
                      {formatPairingCode(pairingCode)}
                    </span>
                  </div>
                  <p>
                    Share this code with <strong>{selectedDevice?.userName}</strong> to pair devices.
                  </p>
                  <div className="waiting-indicator">
                    <div className="spinner"></div>
                    <span>Waiting for response...</span>
                  </div>
                </div>
              )}

              {pairingStep === 'paired' && (
                <div className="pairing-success">
                  <div className="success-icon">✓</div>
                  <p>Successfully paired with <strong>{selectedDevice?.userName}</strong>!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceConnection;