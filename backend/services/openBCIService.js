// openBCIService.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class OpenBCIService {
    constructor() {
        // Use system Python instead of hardcoded path
        this.pythonPath = 'python';
        this.scriptPath = path.join(__dirname, '..', 'python', 'openbci_bridge.py');
        
        // Log the paths for debugging
        console.log('Python executable path:', this.pythonPath);
        console.log('Python script path:', this.scriptPath);
        
        this.serialPort = null;
        this.isConnected = false;
        this.boardType = null;
    }

    /**
     * Execute Python script with arguments
     * @param {Object} args - Command line arguments
     * @returns {Promise<Object>} - Script output
     */
    async executePythonScript(args) {
        return new Promise((resolve, reject) => {
            // Combine all arguments
            const allArgs = [this.scriptPath, ...Object.entries(args).map(([key, value]) => `--${key}=${value}`)];
            
            console.log(`Executing: ${this.pythonPath} ${allArgs.join(' ')}`);
            
            // Spawn Python process
            const process = spawn(this.pythonPath, allArgs);
            
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
            
            // Set timeout to kill process if it takes too long
            const timeout = setTimeout(() => {
                console.error('Python process timed out after 30 seconds');
                process.kill();
                reject(new Error('Process timed out after 30 seconds'));
            }, 30000);
            
            // Handle process completion
            process.on('close', (code) => {
                clearTimeout(timeout);
                console.log(`Python process exited with code ${code}`);
                
                if (code !== 0) {
                    console.error(`Process exited with code ${code}: ${errorData}`);
                    return reject(new Error(`Process exited with code ${code}: ${errorData}`));
                }
                
                try {
                    // Try to extract JSON with regex first
                    const jsonRegex = /(\{[\s\S]*\})/;
                    const jsonMatches = outputData.match(jsonRegex);
                    let jsonData = '';
                    
                    if (jsonMatches && jsonMatches.length > 0) {
                        jsonData = jsonMatches[0];
                        console.log(`Extracted JSON with regex: ${jsonData}`);
                    } else {
                        // Fallback to traditional method
                        const jsonStartIndex = outputData.indexOf('{');
                        const jsonEndIndex = outputData.lastIndexOf('}');
                        
                        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                            jsonData = outputData.substring(jsonStartIndex, jsonEndIndex + 1);
                            console.log(`Extracted JSON with index method: ${jsonData}`);
                        } else {
                            throw new Error('No JSON data found in Python output');
                        }
                    }
                    
                    // Check if JSON is valid before parsing
                    try {
                        JSON.parse(jsonData);
                    } catch (e) {
                        // Clean up JSON by removing any non-JSON characters
                        jsonData = jsonData.replace(/[\r\n\t]/g, '');
                        // Handle any unescaped quotes or other common issues
                        jsonData = jsonData.replace(/\\(?!["\\/bfnrt])/g, '\\\\');
                    }
                    
                    console.log(`Final JSON data: ${jsonData}`);
                    const result = JSON.parse(jsonData);
                    
                    // Save board type if connection was successful
                    if (args.action === 'connect' && result.status === 'success') {
                        this.boardType = result.board_type;
                    }
                    
                    resolve(result);
                } catch (error) {
                    console.error('Error parsing Python output:', error);
                    console.error('Raw output:', outputData);
                    
                    // Check for success patterns in output even if JSON parsing failed
                    if (args.action === 'connect' && 
                        (outputData.includes('connected successfully') || outputData.includes('board connected'))) {
                        console.log('Connection appears successful despite JSON parsing error');
                        resolve({
                            status: 'success',
                            message: 'Connected successfully (parsed from output)',
                            board_type: outputData.includes('Cyton+Daisy') ? 'cyton_daisy' : 'cyton'
                        });
                    } else {
                        reject(new Error(`Error parsing Python output: ${error.message}`));
                    }
                }
            });
            
            // Handle process errors
            process.on('error', (error) => {
                clearTimeout(timeout);
                console.error('Failed to start Python process:', error);
                reject(error);
            });
        });
    }

    /**
     * Try a direct connection test using serial module
     * @param {string} port - COM port to test
     * @returns {Promise<boolean>} - Whether the port is available and has an OpenBCI device
     */
    async testSerialPort(port) {
        return new Promise((resolve, reject) => {
            const testScriptPath = path.join(path.dirname(this.scriptPath), 'test_port.py');
            
            // Create test script if it doesn't exist
            if (!fs.existsSync(testScriptPath)) {
                const testPortCode = `
import serial
import time
import json

try:
    # Try to open the COM port directly
    port = "${port}"
    print(f"Testing port {port}...")
    ser = serial.Serial(port, 115200, timeout=2)
    time.sleep(2)
    
    # Send a simple command to the board
    ser.write(b'v')
    time.sleep(1)
    
    # Read response
    response = ser.read(100)
    response_str = response.decode('utf-8', errors='ignore')
    print(f"Response from board: {response_str}")
    
    ser.close()
    
    # Check if response contains "OpenBCI"
    if "OpenBCI" in response_str:
        result = {
            "status": "success",
            "message": "OpenBCI device found",
            "response": response_str
        }
    else:
        result = {
            "status": "error",
            "message": "Device found but not recognized as OpenBCI",
            "response": response_str
        }
except Exception as e:
    result = {
        "status": "error",
        "message": str(e)
    }

print(json.dumps(result))
`;
                fs.writeFileSync(testScriptPath, testPortCode);
            }
            
            // Execute the test script
            const process = spawn(this.pythonPath, [testScriptPath]);
            
            let outputData = '';
            let errorData = '';
            
            // Collect output data
            process.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`Test port stdout: ${output}`);
                outputData += output;
            });
            
            // Collect error data
            process.stderr.on('data', (data) => {
                const error = data.toString();
                console.error(`Test port stderr: ${error}`);
                errorData += error;
            });
            
            // Handle process completion
            process.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Test port process exited with code ${code}: ${errorData}`);
                    return resolve(false);
                }
                
                try {
                    // Try to extract JSON
                    const jsonRegex = /(\{[\s\S]*\})/;
                    const jsonMatches = outputData.match(jsonRegex);
                    
                    if (jsonMatches && jsonMatches.length > 0) {
                        const result = JSON.parse(jsonMatches[0]);
                        resolve(result.status === 'success');
                    } else if (outputData.includes('OpenBCI')) {
                        // Direct detection from output
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (error) {
                    console.error('Error parsing test port output:', error);
                    // Check output directly if parsing fails
                    resolve(outputData.includes('OpenBCI'));
                }
            });
            
            // Handle process errors
            process.on('error', (error) => {
                console.error('Failed to start test port process:', error);
                resolve(false);
            });
        });
    }

    /**
     * Scan for available OpenBCI devices on common COM ports
     * @returns {Promise<Object>} - Scan results
     */
    async scanPorts() {
        const commonPorts = ['COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8'];
        console.log('Scanning common COM ports for OpenBCI devices...');
        
        // First try direct serial test, which is more reliable
        for (const port of commonPorts) {
            try {
                console.log(`Testing port with serial: ${port}`);
                const isOpenBCI = await this.testSerialPort(port);
                
                if (isOpenBCI) {
                    console.log(`Found OpenBCI device on port: ${port} using direct test`);
                    
                    // Try BrainFlow connection
                    try {
                        // Add a delay before trying BrainFlow connection
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        console.log(`Confirming with BrainFlow on port: ${port}`);
                        const result = await this.executePythonScript({
                            action: 'connect',
                            serial_port: port
                        });
                        
                        if (result.status === 'success') {
                            this.serialPort = port;
                            this.isConnected = true;
                            this.boardType = result.board_type;
                            
                            return {
                                status: 'success',
                                message: `Found OpenBCI device on port: ${port}`,
                                port: port,
                                board_type: result.board_type,
                                data: result
                            };
                        }
                    } catch (brainflowError) {
                        console.log(`BrainFlow connection failed but device detected: ${brainflowError.message}`);
                        
                        // Use the direct test result instead
                        this.serialPort = port;
                        this.isConnected = true;
                        this.boardType = 'unknown';
                        
                        return {
                            status: 'success',
                            message: `Found OpenBCI device on port: ${port} (direct test)`,
                            port: port,
                            board_type: 'unknown'
                        };
                    }
                }
            } catch (error) {
                console.log(`Error testing port ${port}: ${error.message}`);
            }
        }
        
        // Fall back to BrainFlow scanning if direct test didn't work
        for (const port of commonPorts) {
            try {
                console.log(`Trying port with BrainFlow: ${port}`);
                const result = await this.executePythonScript({
                    action: 'connect',
                    serial_port: port
                });
                
                if (result.status === 'success') {
                    console.log(`Found OpenBCI device on port: ${port}`);
                    this.serialPort = port;
                    this.isConnected = true;
                    this.boardType = result.board_type;
                    return {
                        status: 'success',
                        message: `Found OpenBCI device on port: ${port}`,
                        port: port,
                        board_type: result.board_type,
                        data: result
                    };
                }
            } catch (error) {
                console.log(`No device found on port: ${port}`);
            }
        }
        
        return {
            status: 'error',
            message: 'No OpenBCI device found on common COM ports'
        };
    }

    /**
     * Connect to the OpenBCI device
     * @param {string} serialPort - Serial port name (e.g. COM3 on Windows, /dev/ttyUSB0 on Linux)
     * @returns {Promise<Object>} - Connection result
     */
    async connect(serialPort) {
        try {
            console.log(`Attempting to connect to OpenBCI on port: ${serialPort}`);
            
            // First verify with direct serial test
            const isOpenBCI = await this.testSerialPort(serialPort);
            
            if (!isOpenBCI) {
                console.warn(`Direct test did not detect OpenBCI on port: ${serialPort}`);
            } else {
                console.log(`Direct test confirmed OpenBCI on port: ${serialPort}`);
            }
            
            // Add a delay before BrainFlow connection attempt
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.serialPort = serialPort;
            
            const result = await this.executePythonScript({
                action: 'connect',
                serial_port: serialPort
            });
            
            console.log(`Connection result: ${JSON.stringify(result)}`);
            
            this.isConnected = (result.status === 'success');
            if (this.isConnected) {
                this.boardType = result.board_type;
            }
            
            return result;
        } catch (error) {
            console.error('Error connecting to OpenBCI device:', error);
            
            // Check if direct test passed but BrainFlow failed
            const isOpenBCI = await this.testSerialPort(serialPort);
            
            if (isOpenBCI) {
                console.log('Device detected with direct test despite BrainFlow error');
                this.serialPort = serialPort;
                this.isConnected = true;
                this.boardType = 'unknown';
                
                return {
                    status: 'success',
                    message: 'Connected successfully with direct test',
                    board_type: 'unknown'
                };
            }
            
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Reset the board connection
     * @returns {Promise<Object>} - Reset result
     */
    async resetBoard() {
        try {
            if (!this.serialPort) {
                throw new Error('No serial port set');
            }
            
            // First disconnect
            try {
                await this.disconnect();
            } catch (error) {
                console.log('Error during disconnect phase of reset:', error.message);
            }
            
            // Wait longer
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Try to connect again
            return await this.connect(this.serialPort);
        } catch (error) {
            console.error('Error resetting board:', error);
            throw error;
        }
    }

    /**
     * Check if the OpenBCI board is connected
     * @returns {Promise<boolean>} - Whether the board is connected
     */
    async checkConnection() {
        try {
            if (!this.serialPort) {
                console.log('No serial port set, returning not connected');
                return { status: 'error', connected: false, message: 'No serial port set' };
            }
            
            // First try direct serial test
            console.log(`Checking connection with direct test on port: ${this.serialPort}`);
            const isOpenBCI = await this.testSerialPort(this.serialPort);
            
            if (isOpenBCI) {
                console.log('Device confirmed with direct test');
                this.isConnected = true;
                
                return {
                    status: 'success',
                    connected: true,
                    message: 'Connected (confirmed with direct test)',
                    board_type: this.boardType || 'unknown'
                };
            }
            
            // Fall back to BrainFlow check
            console.log(`Checking connection with BrainFlow on port: ${this.serialPort}`);
            const result = await this.executePythonScript({
                action: 'check_connection',
                serial_port: this.serialPort
            });
            
            console.log(`Check connection result: ${JSON.stringify(result)}`);
            
            this.isConnected = (result.status === 'success' && result.connected);
            return result;
        } catch (error) {
            console.error('Error checking OpenBCI connection:', error);
            
            // Try direct test if BrainFlow failed
            try {
                const isOpenBCI = await this.testSerialPort(this.serialPort);
                
                if (isOpenBCI) {
                    console.log('Device detected with direct test despite error');
                    this.isConnected = true;
                    
                    return {
                        status: 'success',
                        connected: true,
                        message: 'Connected (confirmed with direct test)',
                        board_type: this.boardType || 'unknown'
                    };
                }
            } catch (directError) {
                console.error('Direct test also failed:', directError);
            }
            
            this.isConnected = false;
            return { status: 'error', connected: false, error: error.message };
        }
    }

    /**
     * Start recording EEG data
     * @returns {Promise<Object>} - Recording result
     */
    async startRecording() {
        try {
            if (!this.serialPort) {
                throw new Error('OpenBCI device not connected (no serial port)');
            }
            
            // Verify connection before starting
            const connectionStatus = await this.checkConnection();
            
            if (!connectionStatus.connected) {
                throw new Error('OpenBCI device not connected (failed check)');
            }
            
            console.log(`Starting recording on port: ${this.serialPort}`);
            const result = await this.executePythonScript({
                action: 'start_recording',
                serial_port: this.serialPort
            });
            
            console.log(`Start recording result: ${JSON.stringify(result)}`);
            
            return result;
        } catch (error) {
            console.error('Error starting EEG recording:', error);
            throw error;
        }
    }

    /**
     * Stop recording and save the data
     * @param {string} experimentId - Experiment ID for saving data
     * @param {number} duration - Duration to record in seconds
     * @param {string} experimentName - Name of the experiment
     * @returns {Promise<Object>} - Recording result with file path
     */
    async stopRecording(experimentId, duration = 5, experimentName = '') {
        try {
            if (!this.serialPort) {
                throw new Error('OpenBCI device not connected (no serial port)');
            }
            
            // Verify connection before stopping
            const connectionStatus = await this.checkConnection();
            
            if (!connectionStatus.connected && !this.isConnected) {
                throw new Error('OpenBCI device not connected (failed check)');
            }
            
            // Prepare filename with experiment name
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const filename = `eeg_${experimentName || 'unnamed'}_${timestamp}.csv`;
            
            console.log(`Stopping recording on port: ${this.serialPort}, experiment: ${experimentId}, filename: ${filename}`);
            const result = await this.executePythonScript({
                action: 'stop_recording',
                serial_port: this.serialPort,
                experiment_id: experimentId,
                duration: duration,
                output_file: filename
            });
            
            console.log(`Stop recording result: ${JSON.stringify(result)}`);
            
            return {
                ...result,
                filename: filename
            };
        } catch (error) {
            console.error('Error stopping EEG recording:', error);
            throw error;
        }
    }

    /**
     * Disconnect from the OpenBCI board
     * @returns {Promise<Object>} - Disconnection result
     */
    async disconnect() {
        try {
            if (!this.serialPort) {
                this.isConnected = false;
                return { status: 'success', message: 'Already disconnected' };
            }
            
            console.log(`Disconnecting from port: ${this.serialPort}`);
            const result = await this.executePythonScript({
                action: 'disconnect',
                serial_port: this.serialPort
            });
            
            console.log(`Disconnect result: ${JSON.stringify(result)}`);
            
            this.isConnected = false;
            this.serialPort = null;
            this.boardType = null;
            return result;
        } catch (error) {
            console.error('Error disconnecting from OpenBCI device:', error);
            this.isConnected = false;
            this.serialPort = null;
            this.boardType = null;
            throw error;
        }
    }

    /**
     * Get connection status
     * @returns {boolean} - Whether the board is connected
     */
    isDeviceConnected() {
        return this.isConnected;
    }
    
    /**
     * Get board type
     * @returns {string|null} - Board type (cyton, cyton_daisy, or null if not connected)
     */
    getBoardType() {
        return this.boardType;
    }
}

module.exports = new OpenBCIService();