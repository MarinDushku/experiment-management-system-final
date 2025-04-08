// backend/routes/openBCI.js
const express = require('express');
const router = express.Router();
const openBCIController = require('../controllers/openBCIController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Connect to OpenBCI device
router.post('/connect', auth, roleCheck(['researcher', 'admin']), openBCIController.connectDevice);

// Disconnect from OpenBCI device
router.post('/disconnect', auth, roleCheck(['researcher', 'admin']), openBCIController.disconnectDevice);

// Check OpenBCI connection status
router.get('/status', auth, roleCheck(['researcher', 'admin']), openBCIController.checkConnectionStatus);

// Start experiment with EEG recording
router.post('/experiment/:experimentId/start', auth, roleCheck(['researcher', 'admin']), openBCIController.startExperimentWithEEG);

// Stop experiment with EEG recording
router.post('/experiment/:experimentId/stop', auth, roleCheck(['researcher', 'admin']), openBCIController.stopExperimentWithEEG);

module.exports = router;