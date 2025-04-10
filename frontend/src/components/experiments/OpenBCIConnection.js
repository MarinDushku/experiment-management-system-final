import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OpenBCIConnection.css';

const OpenBCIConnection = ({ onConnectionChange }) => {
    const [serialPort, setSerialPort] = useState('COM3'); // Default to COM3 for Windows
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    // Common serial ports for different platforms
    const commonPorts = {
        windows: ['COM3', 'COM4', 'COM5', 'COM6'],
        mac: ['/dev/cu.usbserial-DM00Q0QN', '/dev/cu.usbserial-*'],
        linux: ['/dev/ttyUSB0', '/dev/ttyUSB1']
    };

    // Check connection status on component mount
    useEffect(() => {
        checkConnectionStatus();
    }, []);

    const checkConnectionStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/openbci/status', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            setIsConnected(response.data.connected);
            
            // Notify parent component about connection status
            if (onConnectionChange) {
                onConnectionChange(response.data.connected);
            }
        } catch (error) {
            console.error("Error checking OpenBCI connection status:", error);
            setError("Error checking connection status");
        }
    };

    const handleDirectConnect = async () => {
        // Clear any previous messages
        setError('');
        setSuccess('');
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/openbci/direct-connect', 
                { serialPort }, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                setSuccess("Successfully connected to OpenBCI device using direct method");
                setIsConnected(true);
                
                // Notify parent component about connection
                if (onConnectionChange) {
                    onConnectionChange(true);
                }
            } else {
                setError("Failed to connect to OpenBCI device");
            }
        } catch (error) {
            console.error("Error with direct connection to OpenBCI device:", error);
            setError(error.response?.data?.message || "Error connecting to OpenBCI device");
        } finally {
            setIsLoading(false);
        }
    };

    const scanForDevices = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/openbci/scan', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.status === 'success') {
                setSuccess(`Found OpenBCI device on port: ${response.data.port}`);
                setSerialPort(response.data.port);
                setIsConnected(true);
                
                // Notify parent component about connection
                if (onConnectionChange) {
                    onConnectionChange(true);
                }
            } else {
                setError('No OpenBCI device found. Please check your connection.');
            }
        } catch (error) {
            console.error("Error scanning for OpenBCI devices:", error);
            setError(error.response?.data?.message || "Error scanning for OpenBCI devices");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        
        // Clear any previous messages
        setError('');
        setSuccess('');
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/openbci/connect', 
                { serialPort }, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                setSuccess("Successfully connected to OpenBCI device");
                setIsConnected(true);
                setShowModal(false);
                
                // Notify parent component about connection
                if (onConnectionChange) {
                    onConnectionChange(true);
                }
            } else {
                setError("Failed to connect to OpenBCI device");
            }
        } catch (error) {
            console.error("Error connecting to OpenBCI device:", error);
            setError(error.response?.data?.message || "Error connecting to OpenBCI device");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        // Clear any previous messages
        setError('');
        setSuccess('');
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/openbci/disconnect', 
                {}, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.success) {
                setSuccess("Successfully disconnected from OpenBCI device");
                setIsConnected(false);
                
                // Notify parent component about disconnection
                if (onConnectionChange) {
                    onConnectionChange(false);
                }
            } else {
                setError("Failed to disconnect from OpenBCI device");
            }
        } catch (error) {
            console.error("Error disconnecting from OpenBCI device:", error);
            setError(error.response?.data?.message || "Error disconnecting from OpenBCI device");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPort = (port) => {
        setSerialPort(port);
    };

    return (
        <div className="openbci-connection-card">
            <div className="openbci-header">
                <h3>Connect to OpenBCI Device</h3>
            </div>
            <div className="openbci-body">
                {isConnected ? (
                    <>
                        <div className="status-indicator connected">
                            <div className="status-dot"></div>
                            <span>OpenBCI device is connected and ready</span>
                        </div>
                        
                        <button 
                            className="btn disconnect-btn"
                            onClick={handleDisconnect} 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Disconnecting...</span>
                                </>
                            ) : (
                                <>
                                    <i className="icon-disconnect"></i>
                                    <span>Disconnect Device</span>
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="status-indicator disconnected">
                            <div className="status-dot"></div>
                            <span>OpenBCI device is not connected</span>
                        </div>
                        
                        <div className="button-group">
                            <button 
                                className="btn connect-btn"
                                onClick={() => setShowModal(true)}
                                disabled={isLoading}
                            >
                                <i className="icon-connect"></i>
                                <span>Connect to OpenBCI Device</span>
                            </button>
                            
                            <button 
                                className="btn direct-connect-btn"
                                onClick={handleDirectConnect}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner"></div>
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="icon-direct-connect"></i>
                                        <span>Direct Connect to COM3</span>
                                    </>
                                )}
                            </button>
                            
                            <button 
                                className="btn scan-btn"
                                onClick={scanForDevices}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner"></div>
                                        <span>Scanning...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="icon-scan"></i>
                                        <span>Scan for OpenBCI Devices</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
                
                {error && <div className="message error-message">{error}</div>}
                {success && <div className="message success-message">{success}</div>}
            </div>

            {/* Connection Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="connection-modal">
                        <div className="modal-header">
                            <h3>Connect to OpenBCI Device</h3>
                            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleConnect}>
                                <div className="form-group">
                                    <label htmlFor="serialPort">Serial Port</label>
                                    <input
                                        id="serialPort"
                                        type="text"
                                        value={serialPort}
                                        onChange={(e) => setSerialPort(e.target.value)}
                                        required
                                    />
                                    <div className="help-text">
                                        Enter the serial port where your OpenBCI device is connected.
                                    </div>
                                    
                                    <div className="port-selection">
                                        <div className="os-ports">
                                            <div className="os-label">Windows:</div>
                                            <div className="port-buttons">
                                                {commonPorts.windows.map((port, index) => (
                                                    <button 
                                                        key={index}
                                                        type="button" 
                                                        className="port-button"
                                                        onClick={() => handleSelectPort(port)}
                                                    >
                                                        {port}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="os-ports">
                                            <div className="os-label">Mac:</div>
                                            <div className="port-buttons">
                                                {commonPorts.mac.map((port, index) => (
                                                    <button 
                                                        key={index}
                                                        type="button" 
                                                        className="port-button"
                                                        onClick={() => handleSelectPort(port)}
                                                    >
                                                        {port}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="os-ports">
                                            <div className="os-label">Linux:</div>
                                            <div className="port-buttons">
                                                {commonPorts.linux.map((port, index) => (
                                                    <button 
                                                        key={index}
                                                        type="button" 
                                                        className="port-button"
                                                        onClick={() => handleSelectPort(port)}
                                                    >
                                                        {port}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="modal-actions">
                                    <button 
                                        type="button" 
                                        className="btn cancel-btn"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn connect-btn"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="spinner"></div>
                                                <span>Connecting...</span>
                                            </>
                                        ) : 'Connect'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OpenBCIConnection;