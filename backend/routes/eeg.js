// backend/routes/eeg.js
const express = require('express');
const router = express.Router();
const { getEEGStatus, checkEEGConnection } = require('../controllers/experimentController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection middleware to all routes
router.use(protect);
// Apply researcher/admin authorization to all routes
router.use(authorize(['researcher', 'admin']));

router.get('/status', getEEGStatus);
router.get('/check-connection', checkEEGConnection);

module.exports = router;