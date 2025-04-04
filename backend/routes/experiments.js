const express = require('express');
const router = express.Router();
const { 
  createExperiment, 
  getExperiments, 
  getExperimentById, 
  updateExperiment, 
  deleteExperiment,
  runExperiment
} = require('../controllers/experimentController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection middleware to all routes
router.use(protect);
// Apply researcher/admin authorization to all routes
router.use(authorize(['researcher', 'admin']));

router.route('/')
  .post(createExperiment)
  .get(getExperiments);

router.route('/:id')
  .get(getExperimentById)
  .put(updateExperiment)
  .delete(deleteExperiment);

router.post('/:id/run', runExperiment);

module.exports = router;