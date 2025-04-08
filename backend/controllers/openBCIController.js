const openBCIService = require('../services/openBCIService');
const Experiment = require('../models/Experiment');
const EEGRecording = require('../models/EEGRecording');

/**
 * Connect to OpenBCI device
 */
exports.connectDevice = async (req, res) => {
    try {
        const { serialPort } = req.body;
        
        if (!serialPort) {
            return res.status(400).json({ 
                success: false, 
                message: "Serial port is required" 
            });
        }
        
        const result = await openBCIService.connect(serialPort);
        
        if (result.status === 'success') {
            return res.status(200).json({ 
                success: true, 
                message: "Successfully connected to OpenBCI device" 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: `Failed to connect to OpenBCI device: ${result.message}` 
            });
        }
    } catch (error) {
        console.error("Error in connectDevice:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error connecting to OpenBCI device", 
            error: error.message 
        });
    }
};

/**
 * Disconnect from OpenBCI device
 */
exports.disconnectDevice = async (req, res) => {
    try {
        const result = await openBCIService.disconnect();
        
        if (result.status === 'success') {
            return res.status(200).json({ 
                success: true, 
                message: "Successfully disconnected from OpenBCI device" 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: `Failed to disconnect from OpenBCI device: ${result.message}` 
            });
        }
    } catch (error) {
        console.error("Error in disconnectDevice:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error disconnecting from OpenBCI device", 
            error: error.message 
        });
    }
};

/**
 * Check OpenBCI connection status
 */
exports.checkConnectionStatus = async (req, res) => {
    try {
        const result = await openBCIService.checkConnection();
        
        return res.status(200).json({ 
            success: true, 
            connected: result.connected 
        });
    } catch (error) {
        console.error("Error in checkConnectionStatus:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error checking OpenBCI device connection", 
            error: error.message 
        });
    }
};

/**
 * Start experiment with EEG recording
 */
exports.startExperimentWithEEG = async (req, res) => {
    try {
        const { experimentId } = req.params;
        
        // Check if experiment exists
        const experiment = await Experiment.findById(experimentId);
        if (!experiment) {
            return res.status(404).json({ 
                success: false, 
                message: "Experiment not found" 
            });
        }
        
        // Check if OpenBCI is connected
        const connectionStatus = await openBCIService.checkConnection();
        
        if (!connectionStatus.connected) {
            return res.status(400).json({ 
                success: false, 
                message: "OpenBCI device is not connected", 
                needsHeadset: true 
            });
        }
        
        // Start recording
        const result = await openBCIService.startRecording();
        
        if (result.status === 'success') {
            return res.status(200).json({ 
                success: true, 
                message: "Experiment started with EEG recording",
                timestamp: result.timestamp
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: `Failed to start EEG recording: ${result.message}` 
            });
        }
    } catch (error) {
        console.error("Error in startExperimentWithEEG:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error starting experiment with EEG", 
            error: error.message 
        });
    }
};

/**
 * Stop experiment with EEG recording
 */
exports.stopExperimentWithEEG = async (req, res) => {
    try {
        const { experimentId } = req.params;
        const { duration, experimentName } = req.body;
        
        // Check if experiment exists
        const experiment = await Experiment.findById(experimentId);
        if (!experiment) {
            return res.status(404).json({ 
                success: false, 
                message: "Experiment not found" 
            });
        }
        
        // Stop recording
        const result = await openBCIService.stopRecording(experimentId, duration);
        
        if (result.status === 'success') {
            // Create EEG recording entry in database
            const eegRecording = new EEGRecording({
                experiment: experimentId,
                experimentName: experimentName, // Add experiment name
                startTime: new Date(result.timestamp),
                endTime: new Date(),
                samplingRate: result.sampling_rate,
                channelCount: result.channels,
                sampleCount: result.samples,
                filePath: result.filename
            });
            
            await eegRecording.save();
            
            // Update experiment with recording reference
            experiment.eegRecordings = experiment.eegRecordings || [];
            experiment.eegRecordings.push(eegRecording._id);
            await experiment.save();
            
            return res.status(200).json({ 
                success: true, 
                message: "Experiment stopped and EEG data saved", 
                recordingId: eegRecording._id 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: `Failed to stop EEG recording: ${result.message}` 
            });
        }
    } catch (error) {
        console.error("Error in stopExperimentWithEEG:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error stopping experiment with EEG", 
            error: error.message 
        });
    }
};
exports.getEEGRecordingsByExperiment = async (req, res) => {
    try {
      const { experimentId, experimentName } = req.query;
      
      let query = {};
      
      if (experimentId) {
        query.experiment = experimentId;
      }
      
      if (experimentName) {
        query.experimentName = experimentName;
      }
      
      // If neither is provided, return error
      if (Object.keys(query).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Must provide experimentId or experimentName' 
        });
      }
      
      const recordings = await EEGRecording.find(query).sort({ startTime: 1 });
      
      return res.status(200).json({ 
        success: true, 
        data: recordings 
      });
    } catch (error) {
      console.error('Error getting EEG recordings:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  };