const express = require('express');
const router = express.Router();
const { 
  createTrial, 
  getTrials, 
  getTrialById, 
  updateTrial, 
  deleteTrial 
} = require('../controllers/trialController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection middleware to all routes
router.use(protect);
// Apply researcher/admin authorization to all routes
router.use(authorize(['researcher', 'admin']));

router.route('/')
  .post(createTrial)
  .get(getTrials);

router.route('/:id')
  .get(getTrialById)
  .put(updateTrial)
  .delete(deleteTrial);

module.exports = router;