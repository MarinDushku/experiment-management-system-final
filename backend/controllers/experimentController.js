const Experiment = require('../models/Experiment');
const Trial = require('../models/Trial');

// @desc    Create an experiment
// @route   POST /api/experiments
// @access  Private/Researcher
exports.createExperiment = async (req, res) => {
  try {
    const { name, description, trials } = req.body;
    
    // Validate trials if provided
    if (trials && trials.length > 0) {
      const trialIds = trials.map(t => t.trial);
      const foundTrials = await Trial.find({ _id: { $in: trialIds } });
      
      if (foundTrials.length !== trialIds.length) {
        return res.status(400).json({ message: 'One or more trials not found' });
      }
    }
    
    const experiment = await Experiment.create({
      name,
      description,
      trials: trials || [],
      createdBy: req.user.id
    });
    
    const populatedExperiment = await Experiment.findById(experiment._id)
      .populate('trials.trial');
    
    res.status(201).json(populatedExperiment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all experiments
// @route   GET /api/experiments
// @access  Private/Researcher
exports.getExperiments = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    
    const experiments = await Experiment.find(query)
      .sort({ createdAt: -1 })
      .populate('trials.trial');
    
    res.json(experiments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get experiment by ID
// @route   GET /api/experiments/:id
// @access  Private/Researcher
exports.getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .populate({
        path: 'trials.trial',
        populate: {
          path: 'steps.step',
          model: 'Step'
        }
      });
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && experiment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this experiment' });
    }
    
    res.json(experiment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update an experiment
// @route   PUT /api/experiments/:id
// @access  Private/Researcher
exports.updateExperiment = async (req, res) => {
  try {
    const { name, description, trials, status } = req.body;
    
    let experiment = await Experiment.findById(req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && experiment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this experiment' });
    }
    
    // Validate trials if provided
    if (trials && trials.length > 0) {
      const trialIds = trials.map(t => t.trial);
      const foundTrials = await Trial.find({ _id: { $in: trialIds } });
      
      if (foundTrials.length !== trialIds.length) {
        return res.status(400).json({ message: 'One or more trials not found' });
      }
    }
    
    // Update experiment
    experiment.name = name || experiment.name;
    experiment.description = description || experiment.description;
    experiment.trials = trials || experiment.trials;
    
    if (status && ['Draft', 'Active', 'Completed'].includes(status)) {
      experiment.status = status;
    }
    
    await experiment.save();
    
    const updatedExperiment = await Experiment.findById(experiment._id)
      .populate('trials.trial');
    
    res.json(updatedExperiment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete an experiment
// @route   DELETE /api/experiments/:id
// @access  Private/Researcher
exports.deleteExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && experiment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this experiment' });
    }
    
    await Experiment.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Experiment removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Run an experiment
// @route   POST /api/experiments/:id/run
// @access  Private/Researcher
exports.runExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .populate({
        path: 'trials.trial',
        populate: {
          path: 'steps.step',
          model: 'Step'
        }
      });
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && experiment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to run this experiment' });
    }
    
    if (!experiment.trials || experiment.trials.length === 0) {
      return res.status(400).json({ message: 'Experiment must have at least one trial assigned to run' });
    }
    
    // Set status to Active
    experiment.status = 'Active';
    await experiment.save();
    
    res.json({ 
      message: 'Experiment started successfully',
      experiment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};