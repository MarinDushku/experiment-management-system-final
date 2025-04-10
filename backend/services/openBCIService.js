// openBCIService.js
const { spawn } = require('child_process');
const path = require('path');

class OpenBCIService {
    constructor() {
        // Updated Python path to point directly to your Python installation
        this.pythonPath = 'C:\\Program Files\\Python312\\python.exe'; // Your Python executable
        this.scriptPath = 'C:\\Users\\dushk\\Desktop\\experiment-management-system\\backend\\python\\openbci_bridge.py'; // Full path to the Python script
        
        // Log the paths for debugging
        console.log('Python executable path:', this.pythonPath);
        console.log('Python script path:', this.scriptPath);
        
        this.serialPort = null;
        this.isConnected = false;
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
            
            // Handle process completion
            process.on('close', (code) => {
                console.log(`Python process exited with code ${code}`);
                
                if (code !== 0) {
                    console.error(`Process exited with code ${code}: ${errorData}`);
                    return reject(new Error(`Process exited with code ${code}: ${errorData}`));
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
                    resolve(result);
                } catch (error) {
                    console.error('Error parsing Python output:', error);
                    console.error('Raw output:', outputData);
                    reject(new Error(`Error parsing Python output: ${error.message}`));
                }
            });
            
            // Handle process errors
            process.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                reject(error);
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
        
        for (const port of commonPorts) {
            try {
                console.log(`Trying port: ${port}`);
                const result = await this.executePythonScript({
                    action: 'connect',
                    serial_port: port
                });
                
                if (result.status === 'success') {
                    console.log(`Found OpenBCI device on port: ${port}`);
                    this.serialPort = port;
                    this.isConnected = true;
                    return {
                        status: 'success',
                        message: `Found OpenBCI device on port: ${port}`,
                        port: port,
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
            this.serialPort = serialPort;
            
            const result = await this.executePythonScript({
                action: 'connect',
                serial_port: serialPort
            });
            
            console.log(`Connection result: ${JSON.stringify(result)}`);
            
            this.isConnected = (result.status === 'success');
            return result;
        } catch (error) {
            console.error('Error connecting to OpenBCI device:', error);
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
            await this.disconnect();
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 2000));
            
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
                return { connected: false };
            }
            
            console.log(`Checking connection on port: ${this.serialPort}`);
            const result = await this.executePythonScript({
                action: 'check_connection',
                serial_port: this.serialPort
            });
            
            console.log(`Check connection result: ${JSON.stringify(result)}`);
            
            this.isConnected = (result.status === 'success' && result.connected);
            return result;
        } catch (error) {
            console.error('Error checking OpenBCI connection:', error);
            this.isConnected = false;
            return { connected: false, error: error.message };
        }
    }

    /**
     * Start recording EEG data
     * @returns {Promise<Object>} - Recording result
     */
    async startRecording() {
        try {
            if (!this.serialPort || !this.isConnected) {
                throw new Error('OpenBCI device not connected');
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
            if (!this.serialPort || !this.isConnected) {
                throw new Error('OpenBCI device not connected');
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
            return result;
        } catch (error) {
            console.error('Error disconnecting from OpenBCI device:', error);
            this.isConnected = false;
            this.serialPort = null;
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
}

module.exports = new OpenBCIService();