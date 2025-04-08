// backend/routes/responses.js

const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const { protect, authorize } = require('../middleware/auth');

// Create a new response - allow users, researchers, and admins
router.post('/', protect, responseController.createResponse);

// Get responses for an experiment - only allow researchers and admins
router.get('/', protect, authorize(['researcher', 'admin']), responseController.getResponsesByExperiment);

module.exports = router;