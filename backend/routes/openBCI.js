// routes/openBCI.js
const express = require('express');
const router = express.Router();
const openBCIController = require('../controllers/openBCIController');
const { protect } = require('../middleware/auth');

// Create async handler middleware
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Connection status check
router.get('/status', protect, asyncHandler(async (req, res) => {
  console.log('Checking OpenBCI connection status');
  await openBCIController.checkStatus(req, res);
}));

// Connect to OpenBCI device
router.post('/connect', protect, asyncHandler(async (req, res) => {
  console.log('Connecting to OpenBCI device');
  await openBCIController.connect(req, res);
}));

// Disconnect from OpenBCI device
router.post('/disconnect', protect, asyncHandler(async (req, res) => {
  console.log('Disconnecting from OpenBCI device');
  await openBCIController.disconnect(req, res);
}));

// Scan for OpenBCI devices
router.get('/scan', protect, asyncHandler(async (req, res) => {
  console.log('Scanning for OpenBCI devices');
  await openBCIController.scanDevices(req, res);
}));

// Direct connect to specified port
router.post('/direct-connect', protect, asyncHandler(async (req, res) => {
  console.log('Direct connecting to OpenBCI');
  await openBCIController.directConnect(req, res);
}));

// Experiment-specific endpoints
router.post('/experiment/:id/start', protect, asyncHandler(async (req, res) => {
  console.log(`Starting recording for experiment ${req.params.id}`);
  req.body.experimentId = req.params.id;
  await openBCIController.startRecording(req, res);
}));

router.post('/experiment/:id/stop', protect, asyncHandler(async (req, res) => {
  console.log(`Stopping recording for experiment ${req.params.id}`);
  req.body.experimentId = req.params.id;
  await openBCIController.stopRecording(req, res);
}));

// Diagnostic route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'OpenBCI routes are working correctly',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware for this router
router.use((err, req, res, next) => {
  console.error('OpenBCI Router Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in OpenBCI routes',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;