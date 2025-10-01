// openBCIController.js
const { spawn } = require('child_process');
const openBCIService = require('../services/openBCIService');
const EEGRecording = require('../models/EEGRecording');
const path = require('path');
const fs = require('fs');

// Define the script path using path.join for cross-platform compatibility
const scriptPath = path.join(__dirname, '..', 'python', 'openbci_bridge.py');

/**
 * Robust JSON extraction from Python output
 * @param {string} outputData - Raw output from Python script
 * @returns {Object} - Parsed JSON object
 */
function extractJsonFromOutput(outputData) {
    try {
        // Method 1: Find JSON by looking for complete JSON blocks
        const jsonPattern = /\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/g;
        const matches = outputData.match(jsonPattern);
        
        if (matches && matches.length > 0) {
            // Try to parse each match, starting from the last one (most likely to be the result)
            for (let i = matches.length - 1; i >= 0; i--) {
                try {
                    const parsed = JSON.parse(matches[i]);
                    if (parsed && typeof parsed === 'object') {
                        console.log(`Successfully parsed JSON from match ${i}: ${matches[i]}`);
                        return parsed;
                    }
                } catch (e) {
                    continue;
                }
            }
        }
        
        // Method 2: Look for lines that start and end with braces
        const lines = outputData.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
                try {
                    const parsed = JSON.parse(line);
                    console.log(`Successfully parsed JSON from line: ${line}`);
                    return parsed;
                } catch (e) {
                    continue;
                }
            }
        }
        
        // Method 3: Fallback to original method
        const jsonStartIndex = outputData.indexOf('{');
        const jsonEndIndex = outputData.lastIndexOf('}');
        
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            const jsonData = outputData.substring(jsonStartIndex, jsonEndIndex + 1);
            try {
                const parsed = JSON.parse(jsonData);
                console.log(`Successfully parsed JSON with fallback method: ${jsonData}`);
                return parsed;
            } catch (e) {
                throw new Error(`Failed to parse JSON: ${e.message}. Raw output: ${outputData}`);
            }
        }
        
        throw new Error(`No valid JSON found in output: ${outputData}`);
    } catch (error) {
        console.error('JSON extraction error:', error);
        throw error;
    }
}

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
        
        // Create a delay to ensure proper device initialization
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to use 'python' command from PATH first
        const pythonPath = 'python3';
        
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
                // Use the robust JSON extraction function
                const result = extractJsonFromOutput(outputData);
                
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
                
                // Check if the connection appears successful despite JSON parsing errors
                if (outputData.includes('Connected') || outputData.includes('connected successfully')) {
                    openBCIService.serialPort = port;
                    openBCIService.isConnected = true;
                    
                    return res.json({
                        success: true,
                        message: 'Connection appears successful despite parsing errors',
                        data: { status: 'success', board_type: 'cyton_daisy' }
                    });
                }
                
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
        
        // Add timeout to avoid hanging
        setTimeout(() => {
            if (!res.headersSent) {
                return res.status(408).json({
                    success: false,
                    message: 'Connection attempt timed out after 30 seconds'
                });
            }
        }, 30000);
        
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
        
        // Use direct simple scan first (non-brainflow)
        const pythonPath = 'python3';
        const testPortScript = path.join(__dirname, '..', 'python', 'test_port.py');
        
        // Check if test_port.py exists, if not create it
        if (!fs.existsSync(testPortScript)) {
            const testPortCode = `
import serial
import time
import json
import sys

def scan_ports():
    """Scan common ports for OpenBCI devices."""
    ports = ['COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8']
    results = []
    
    for port in ports:
        try:
            print(f"Testing port {port}...")
            ser = serial.Serial(port, 115200, timeout=2)
            time.sleep(1)
            
            # Send 'v' command to get board version
            ser.write(b'v')
            time.sleep(1)
            
            # Read response
            response = ser.read(100)
            response_str = response.decode('utf-8', errors='ignore')
            
            # Close port
            ser.close()
            
            # Check if this looks like an OpenBCI board
            if 'OpenBCI' in response_str:
                results.append({
                    'port': port,
                    'status': 'available',
                    'response': response_str.strip()
                })
                print(f"Found OpenBCI device on {port}")
            else:
                print(f"No OpenBCI device found on {port}")
        except Exception as e:
            print(f"Error checking {port}: {e}")
    
    return results

if __name__ == "__main__":
    results = scan_ports()
    print(json.dumps({
        'status': 'success' if len(results) > 0 else 'error',
        'message': f"Found {len(results)} OpenBCI devices" if len(results) > 0 else "No OpenBCI devices found",
        'ports': results
    }))
`;
            fs.writeFileSync(testPortScript, testPortCode);
        }
        
        // Execute the scanning script
        const process = spawn(pythonPath, [testPortScript]);
        
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
        process.on('close', async (code) => {
            try {
                if (code !== 0) {
                    console.error(`Scan process exited with code ${code}: ${errorData}`);
                    
                    // Fall back to the service method
                    const fallbackResult = await openBCIService.scanPorts();
                    return res.json(fallbackResult);
                }
                
                // Try to parse the JSON from the output
                let result;
                try {
                    result = extractJsonFromOutput(outputData);
                } catch (parseError) {
                    console.error('JSON parsing failed, falling back to service method:', parseError);
                    result = await openBCIService.scanPorts();
                }
                
                return res.json(result);
            } catch (error) {
                console.error('Error parsing scan results:', error);
                
                // Fall back to the service method
                const fallbackResult = await openBCIService.scanPorts();
                return res.json(fallbackResult);
            }
        });
        
        // Handle process errors
        process.on('error', async (error) => {
            console.error('Failed to start scan process:', error);
            
            // Fall back to the service method
            const fallbackResult = await openBCIService.scanPorts();
            return res.json(fallbackResult);
        });
        
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
        
        // First try to disconnect
        try {
            await openBCIService.disconnect();
        } catch (error) {
            console.log('No active connection to disconnect:', error.message);
        }
        
        // Wait a bit longer
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try to connect with direct method
        const { serialPort } = req.body || {};
        const port = serialPort || openBCIService.serialPort || 'COM3';
        
        console.log(`Attempting to reconnect on port: ${port}`);
        
        // Use python command from PATH
        const pythonPath = 'python3';
        
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
            if (code !== 0) {
                console.error(`Reset process exited with code ${code}: ${errorData}`);
                return res.status(500).json({
                    success: false,
                    message: `Reset process exited with code ${code}: ${errorData}`
                });
            }
            
            try {
                // Use the robust JSON extraction function
                const result = extractJsonFromOutput(outputData);
                
                if (result.status === 'success') {
                    // Update the OpenBCI service state
                    openBCIService.serialPort = port;
                    openBCIService.isConnected = true;
                    
                    return res.json({
                        success: true,
                        message: 'Successfully reset and reconnected to OpenBCI device',
                        data: result
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: result.message || 'Failed to reset OpenBCI device'
                    });
                }
            } catch (error) {
                console.error('Error parsing Python output:', error);
                
                // Check if the reset appears successful despite JSON parsing errors
                if (outputData.includes('Connected') || outputData.includes('connected successfully')) {
                    openBCIService.serialPort = port;
                    openBCIService.isConnected = true;
                    
                    return res.json({
                        success: true,
                        message: 'Reset appears successful despite parsing errors',
                        data: { status: 'success', board_type: 'cyton_daisy' }
                    });
                }
                
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
        console.error('Error resetting board:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Error resetting OpenBCI board connection' 
        });
    }
};

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

exports.startRecording = async (req, res) => {
    try {
        const { experimentName } = req.body || {};
        
        console.log('Starting EEG recording session with name:', experimentName);
        const result = await openBCIService.startRecording(experimentName);
        console.log('Start recording result:', JSON.stringify(result));
        
        if (result.status === 'success') {
            return res.json({ 
                success: true, 
                message: 'Successfully started EEG recording with visualization',
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
            // Get current date/time
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - (duration * 1000 || 5000)); // Calculate start time based on duration
            
            // Create EEG recording entry in database matching your schema
            const eegRecording = new EEGRecording({
                experiment: experimentId,
                experimentName: experimentName || 'Unnamed Experiment',
                startTime: startTime,
                endTime: endTime,
                samplingRate: recordingResult.sampling_rate || 250,
                channelCount: recordingResult.channels || 16,
                sampleCount: recordingResult.samples || 0,
                filePath: recordingResult.file_path || recordingResult.filename
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

// Add missing methods that the frontend expects
exports.checkStatus = exports.getConnectionStatus;
exports.scanDevices = exports.scanPorts;

module.exports = exports;