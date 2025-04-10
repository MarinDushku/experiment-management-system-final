// openBCIController.js
const { spawn } = require('child_process');
const openBCIService = require('../services/openBCIService');
const EEGRecording = require('../models/EEGRecording');

/**
 * Direct connection to OpenBCI using the command that worked in testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.directConnect = async (req, res) => {
    try {
        const { serialPort } = req.body;
        const port = serialPort || 'COM3'; // Default to COM3 if not provided
        
        console.log(`Attempting direct connection to OpenBCI on port: ${port}`);
        
        // Use the exact command that worked in your testing
        const pythonPath = 'C:\\Program Files\\Python312\\python.exe';
        const scriptPath = 'C:\\Users\\dushk\\Desktop\\experiment-management-system\\backend\\python\\openbci_bridge.py';
        
        const process = spawn(pythonPath, [
            scriptPath,
            `--action=connect`,
            `--serial_port=${port}`
        ]);
        
        let outputData = '';
        let errorData = '';
        
        // Collect output data
        process.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`Python stdout: ${output}`);
            outputData += output;
        });
        
        // Collect error data
        process.stderr.on('data', (data) => {
            const error = data.toString();
            console.error(`Python stderr: ${error}`);
            errorData += error;
        });
        
        // Handle process completion
        process.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            
            if (code !== 0) {
                console.error(`Process exited with code ${code}: ${errorData}`);
                return res.status(500).json({
                    success: false,
                    message: `Process exited with code ${code}: ${errorData}`
                });
            }
            
            try {
                // Find the JSON data in the output (it might be mixed with debug messages)
                let jsonData = outputData;
                const jsonStartIndex = outputData.indexOf('{');
                const jsonEndIndex = outputData.lastIndexOf('}');
                
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    jsonData = outputData.substring(jsonStartIndex, jsonEndIndex + 1);
                }
                
                console.log(`Parsed JSON data: ${jsonData}`);
                const result = JSON.parse(jsonData);
                
                if (result.status === 'success') {
                    // Update the OpenBCI service state
                    openBCIService.serialPort = port;
                    openBCIService.isConnected = true;
                    
                    return res.json({
                        success: true,
                        message: 'Successfully connected to OpenBCI device using direct method',
                        data: result
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: result.message || 'Failed to connect to OpenBCI device'
                    });
                }
            } catch (error) {
                console.error('Error parsing Python output:', error);
                console.error('Raw output:', outputData);
                return res.status(500).json({
                    success: false,
                    message: `Error parsing Python output: ${error.message}`
                });
            }
        });
        
        // Handle process errors
        process.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            return res.status(500).json({
                success: false,
                message: `Failed to start Python process: ${error.message}`
            });
        });
    } catch (error) {
        console.error('Error in direct connect:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error connecting to OpenBCI device'
        });
    }
};

/**
 * Scan for available OpenBCI devices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.scanPorts = async (req, res) => {
    try {
        console.log('Starting port scan for OpenBCI devices');
        const result = await openBCIService.scanPorts();
        console.log('Port scan result:', result);
        
        return res.json(result);
    } catch (error) {
        console.error('Error scanning ports:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error scanning for OpenBCI devices' 
        });
    }
};

/**
 * Reset the OpenBCI board connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetBoard = async (req, res) => {
    try {
        console.log('Resetting OpenBCI board connection');
        const result = await openBCIService.resetBoard();
        console.log('Reset result:', result);
        
        if (result.status === 'success') {
            return res.json({ 
                success: true, 
                message: 'Successfully reset OpenBCI board connection',
                data: result
            });
        } else {
            console.error('Failed to reset board:', result.message);
            return res.status(400).json({ 
                success: false, 
                message: result.message || 'Failed to reset OpenBCI board connection' 
            });
        }
    } catch (error) {
        console.error('Error resetting board:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error resetting OpenBCI board connection' 
        });
    }
};

/**
 * Connect to OpenBCI device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.connect = async (req, res) => {
    try {
        const { serialPort } = req.body;
        
        if (!serialPort) {
            return res.status(400).json({ 
                success: false, 
                message: 'Serial port is required' 
            });
        }
        
        console.log(`Attempting to connect to OpenBCI on port: ${serialPort}`);
        const result = await openBCIService.connect(serialPort);
        console.log('Connection result:', JSON.stringify(result));
        
        if (result.status === 'success') {
            return res.json({ 
                success: true, 
                message: 'Successfully connected to OpenBCI device',
                data: result
            });
        } else {
            console.error('Failed to connect:', result.message);
            return res.status(400).json({ 
                success: false, 
                message: result.message || 'Failed to connect to OpenBCI device' 
            });
        }
    } catch (error) {
        console.error('Detailed connection error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error connecting to OpenBCI device' 
        });
    }
};

/**
 * Check OpenBCI connection status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConnectionStatus = async (req, res) => {
    try {
        console.log('Checking OpenBCI connection status');
        const result = await openBCIService.checkConnection();
        console.log('Connection status result:', JSON.stringify(result));
        
        return res.json({ 
            connected: result.connected,
            message: result.message,
            data: result
        });
    } catch (error) {
        console.error('Error checking connection status:', error);
        return res.status(500).json({ 
            connected: false,
            message: error.message || 'Error checking OpenBCI connection status' 
        });
    }
};

/**
 * Disconnect from OpenBCI device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.disconnect = async (req, res) => {
    try {
        console.log('Attempting to disconnect from OpenBCI');
        const result = await openBCIService.disconnect();
        console.log('Disconnect result:', JSON.stringify(result));
        
        if (result.status === 'success') {
            return res.json({ 
                success: true, 
                message: 'Successfully disconnected from OpenBCI device',
                data: result
            });
        } else {
            console.error('Failed to disconnect:', result.message);
            return res.status(400).json({ 
                success: false, 
                message: result.message || 'Failed to disconnect from OpenBCI device' 
            });
        }
    } catch (error) {
        console.error('Detailed disconnect error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error disconnecting from OpenBCI device' 
        });
    }
};

/**
 * Start recording EEG data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.startRecording = async (req, res) => {
    try {
        console.log('Starting EEG recording session');
        const result = await openBCIService.startRecording();
        console.log('Start recording result:', JSON.stringify(result));
        
        if (result.status === 'success') {
            return res.json({ 
                success: true, 
                message: 'Successfully started EEG recording',
                data: result
            });
        } else {
            console.error('Failed to start recording:', result.message);
            return res.status(400).json({ 
                success: false, 
                message: result.message || 'Failed to start EEG recording' 
            });
        }
    } catch (error) {
        console.error('Detailed start recording error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error starting EEG recording' 
        });
    }
};

/**
 * Stop recording EEG data and save
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.stopRecording = async (req, res) => {
    try {
        const { experimentId, duration, experimentName } = req.body;
        
        if (!experimentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Experiment ID is required' 
            });
        }
        
        console.log(`Stopping EEG recording for experiment: ${experimentId} with name: ${experimentName}`);
        const recordingResult = await openBCIService.stopRecording(
            experimentId, 
            duration || 5,
            experimentName || ''
        );
        console.log('Stop recording result:', JSON.stringify(recordingResult));
        
        if (recordingResult.status === 'success') {
            // Create EEG recording entry in database
            const eegRecording = new EEGRecording({
                experimentId,
                experimentName,
                filePath: recordingResult.filename,
                recordingDate: new Date(),
                duration: duration || 5,
                channels: recordingResult.channels || 16,
                samplingRate: recordingResult.sampling_rate || 250,
                metadata: recordingResult
            });
            
            await eegRecording.save();
            console.log('EEG recording saved to database:', eegRecording._id);
            
            return res.json({ 
                success: true, 
                message: 'Successfully stopped and saved EEG recording',
                recordingId: eegRecording._id,
                data: recordingResult
            });
        } else {
            console.error('Failed to stop recording:', recordingResult.message);
            return res.status(400).json({ 
                success: false, 
                message: recordingResult.message || 'Failed to stop EEG recording' 
            });
        }
    } catch (error) {
        console.error('Detailed stop recording error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error stopping EEG recording' 
        });
    }
};

/**
 * Get available serial ports for OpenBCI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSerialPorts = async (req, res) => {
    try {
        // This is a placeholder for actual serial port detection
        // You would need to implement hardware detection logic or provide common ports
        
        const os = req.query.os || 'unknown';
        let ports = [];
        
        switch (os.toLowerCase()) {
            case 'windows':
                ports = ['COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8'];
                break;
            case 'mac':
                ports = ['/dev/cu.usbserial-DM00Q0QN', '/dev/cu.usbserial-*'];
                break;
            case 'linux':
                ports = ['/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyUSB2'];
                break;
            default:
                ports = [
                    'COM3', 'COM4', 'COM5', 'COM6',
                    '/dev/ttyUSB0', '/dev/ttyUSB1',
                    '/dev/cu.usbserial-*'
                ];
        }
        
        return res.json({ 
            success: true, 
            ports
        });
    } catch (error) {
        console.error('Error getting serial ports:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error getting available serial ports' 
        });
    }
};

module.exports = exports;