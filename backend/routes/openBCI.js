// routes/openBCI.js
const express = require('express');
const router = express.Router();
const openBCIController = require('../controllers/openBCIController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Port scanning endpoint
router.get('/scan', auth, openBCIController.scanPorts);

// Reset board connection
router.post('/reset', auth, openBCIController.resetBoard);

// Get available serial ports
router.get('/ports', auth, openBCIController.getSerialPorts);

// Connect to OpenBCI device
router.post('/connect', auth, openBCIController.connect);

// Check connection status
router.get('/status', auth, openBCIController.getConnectionStatus);

// Disconnect from OpenBCI device
router.post('/disconnect', auth, openBCIController.disconnect);

// Start recording EEG data
router.post('/start-recording', auth, openBCIController.startRecording);

// Stop recording and save data
router.post('/stop-recording', auth, openBCIController.stopRecording);

router.post('/direct-connect', auth, openBCIController.directConnect);
module.exports = router;