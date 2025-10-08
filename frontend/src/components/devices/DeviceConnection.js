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
    reconnect,
    disconnect
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
    pairingError,
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
  const [codeInput, setCodeInput] = useState('');
  const [showCodeInputModal, setShowCodeInputModal] = useState(false);
  const [currentPairingRequest, setCurrentPairingRequest] = useState(null);

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

  const handleAcceptPairing = (request) => {
    setCurrentPairingRequest(request);
    setShowCodeInputModal(true);
    setCodeInput('');
  };

  const handleRejectPairing = (request) => {
    respondToPairingRequest(request, false);
  };

  const handleSubmitCode = () => {
    if (!codeInput || codeInput.replace('-', '').length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    const cleanCode = codeInput.replace('-', '');
    respondToPairingRequest(currentPairingRequest, true, cleanCode);
    setShowCodeInputModal(false);
    setCodeInput('');
    setCurrentPairingRequest(null);
  };

  const handleCodeInputChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) value = value.slice(0, 6);

    // Format as XXX-XXX
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }

    setCodeInput(value);
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

      {/* Pairing Request Alert Banner */}
      {pairingRequests.length > 0 && (
        <div className="pairing-alert-banner">
          <span className="alert-icon">🔔</span>
          <span className="alert-text">
            {pairingRequests.length} device{pairingRequests.length > 1 ? 's' : ''} requesting to pair
          </span>
          <span className="alert-arrow">↓ Scroll down to respond</span>
        </div>
      )}

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
      <div className="connection-actions">
        {!isConnected ? (
          <button onClick={reconnect} className="btn-primary">
            Reconnect
          </button>
        ) : (
          <button onClick={disconnect} className="btn-danger">
            Disconnect
          </button>
        )}
      </div>

      {/* Device Management */}
      {isConnected && (
        <div className="device-management">
          {/* Paired Device Display */}
          {isPaired && pairedDevice && (
            <div className="paired-device">
              <h3>✓ Connected Device</h3>
              <div className="device-card paired">
                <div className="device-info">
                  <div className="paired-indicator">
                    <span className="status-dot connected"></span>
                    <span className="device-name">{pairedDevice.userName}</span>
                  </div>
                  <span className="device-role">Role: {pairedDevice.userRole}</span>
                  <span className="paired-time">
                    Connected at: {new Date(pairedDevice.pairedAt).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={unpairDevice}
                  className="btn-danger"
                >
                  Disconnect
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
          {pairingRequests.length > 0 ? (
            <div className="pairing-requests">
              <h3>⚠ Pairing Requests ({pairingRequests.length})</h3>
              {pairingRequests.map((request) => (
                <div key={request.fromSocketId} className="pairing-request">
                  <div className="request-info">
                    <span className="requester-name">{request.fromUserName}</span>
                    <span className="requester-role">({request.fromUserRole})</span>
                    <span className="request-time">
                      {new Date(request.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="request-actions">
                    <button
                      onClick={() => handleAcceptPairing(request)}
                      className="btn-success"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectPairing(request)}
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
          ) : (
            <div className="no-pairing-requests">
              {/* Empty - no requests */}
            </div>
          )}
        </div>
      )}

      {/* Pairing Modal - Requester Side */}
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
                  <p className="code-instructions">
                    The other device needs to enter this code to complete pairing.
                  </p>
                  <div className="waiting-indicator">
                    <div className="spinner"></div>
                    <span>Waiting for code verification...</span>
                  </div>
                </div>
              )}

              {pairingStep === 'paired' && (
                <div className="pairing-success">
                  <div className="success-icon">✓</div>
                  <p>Successfully paired with <strong>{selectedDevice?.userName}</strong>!</p>
                </div>
              )}

              {pairingError && (
                <div className="pairing-error">
                  <div className="error-icon">✗</div>
                  <p className="error-message">{pairingError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Input Modal - Responder Side */}
      {showCodeInputModal && (
        <div className="modal-overlay">
          <div className="modal-content code-input-modal">
            <div className="modal-header">
              <h3>Enter Pairing Code</h3>
              <button
                onClick={() => {
                  setShowCodeInputModal(false);
                  setCodeInput('');
                  setCurrentPairingRequest(null);
                }}
                className="close-button"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>{currentPairingRequest?.fromUserName}</strong> wants to pair with this device.
              </p>
              <p className="code-instruction">
                Enter the 6-digit code shown on their device:
              </p>
              <div className="code-input-container">
                <input
                  type="text"
                  className="code-input-field"
                  placeholder="XXX-XXX"
                  value={codeInput}
                  onChange={handleCodeInputChange}
                  maxLength={7}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitCode();
                    }
                  }}
                />
              </div>
              {pairingError && (
                <div className="error-message-inline">
                  {pairingError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  onClick={handleSubmitCode}
                  className="btn-primary"
                  disabled={codeInput.replace('-', '').length !== 6}
                >
                  Verify & Pair
                </button>
                <button
                  onClick={() => {
                    setShowCodeInputModal(false);
                    setCodeInput('');
                    setCurrentPairingRequest(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceConnection;