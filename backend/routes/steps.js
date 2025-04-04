const express = require('express');
const router = express.Router();
const { 
  createStep, 
  getSteps, 
  getStepById, 
  updateStep, 
  deleteStep 
} = require('../controllers/stepController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply protection middleware to all routes
router.use(protect);
// Apply researcher/admin authorization to all routes
router.use(authorize(['researcher', 'admin']));

router.route('/')
  .post(upload.single('audioFile'), createStep)
  .get(getSteps);

router.route('/:id')
  .get(getStepById)
  .put(upload.single('audioFile'), updateStep)
  .delete(deleteStep);

module.exports = router;