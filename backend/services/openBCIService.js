// openBCIService.js
const { spawn } = require('child_process');
const path = require('path');

class OpenBCIService {
    constructor() {
        this.pythonPath = 'python'; // Use 'python3' for Unix-based systems if necessary
        this.scriptPath = path.join(__dirname, '..', 'python', 'openbci_bridge.py');
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
                outputData += data.toString();
            });
            
            // Collect error data
            process.stderr.on('data', (data) => {
                errorData += data.toString();
                console.error(`Python error: ${data}`);
            });
            
            // Handle process completion
            process.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Python process exited with code ${code}`);
                    return reject(new Error(`Process exited with code ${code}: ${errorData}`));
                }
                
                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (error) {
                    console.error('Error parsing Python output:', error);
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
     * Connect to the OpenBCI device
     * @param {string} serialPort - Serial port name (e.g. COM3 on Windows, /dev/ttyUSB0 on Linux)
     * @returns {Promise<Object>} - Connection result
     */
    async connect(serialPort) {
        try {
            this.serialPort = serialPort;
            
            const result = await this.executePythonScript({
                action: 'connect',
                serial_port: serialPort
            });
            
            this.isConnected = (result.status === 'success');
            return result;
        } catch (error) {
            console.error('Error connecting to OpenBCI device:', error);
            this.isConnected = false;
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
                return { connected: false };
            }
            
            const result = await this.executePythonScript({
                action: 'check_connection',
                serial_port: this.serialPort
            });
            
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
            
            const result = await this.executePythonScript({
                action: 'start_recording',
                serial_port: this.serialPort
            });
            
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
            
            const result = await this.executePythonScript({
                action: 'stop_recording',
                serial_port: this.serialPort,
                experiment_id: experimentId,
                duration: duration,
                output_file: filename
            });
            
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
            
            const result = await this.executePythonScript({
                action: 'disconnect',
                serial_port: this.serialPort
            });
            
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