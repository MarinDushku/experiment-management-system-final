const Trial = require('../models/Trial');
const Step = require('../models/Step');

// Create a new trial
exports.createTrial = async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    
    // Validate that all step IDs exist
    if (steps && steps.length > 0) {
      const stepIds = steps.map(s => s.step);
      const foundSteps = await Step.find({ _id: { $in: stepIds } });
      
      if (foundSteps.length !== stepIds.length) {
        return res.status(400).json({ message: 'One or more steps not found' });
      }
    }
    
    const trial = new Trial({
      name,
      description,
      steps: steps || [],
      createdBy: req.user.id
    });
    
    const savedTrial = await trial.save();
    
    // Populate the steps data before returning
    const populatedTrial = await Trial.findById(savedTrial._id).populate('steps.step');
    
    res.status(201).json(populatedTrial);
  } catch (err) {
    console.error('Error creating trial:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all trials
exports.getTrials = async (req, res) => {
  try {
    // For admin, get all trials. For others, get only their own
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    
    const trials = await Trial.find(query)
      .populate('steps.step')
      .sort({ createdAt: -1 });
    
    res.json(trials);
  } catch (err) {
    console.error('Error getting trials:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get trial by ID
exports.getTrialById = async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id).populate('steps.step');
    
    if (!trial) {
      return res.status(404).json({ message: 'Trial not found' });
    }
    
    // Check authorization (admin can see all trials)
    if (req.user.role !== 'admin' && trial.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this trial' });
    }
    
    res.json(trial);
  } catch (err) {
    console.error('Error getting trial:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update trial
exports.updateTrial = async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    
    // Validate that all step IDs exist if steps are provided
    if (steps && steps.length > 0) {
      const stepIds = steps.map(s => s.step);
      const foundSteps = await Step.find({ _id: { $in: stepIds } });
      
      if (foundSteps.length !== stepIds.length) {
        return res.status(400).json({ message: 'One or more steps not found' });
      }
    }
    
    // Find the trial
    let trial = await Trial.findById(req.params.id);
    
    if (!trial) {
      return res.status(404).json({ message: 'Trial not found' });
    }
    
    // Check authorization (admin can update any trial)
    if (req.user.role !== 'admin' && trial.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this trial' });
    }
    
    // Update fields
    trial.name = name;
    trial.description = description;
    trial.steps = steps || [];
    
    await trial.save();
    
    // Populate steps before returning
    const updatedTrial = await Trial.findById(trial._id).populate('steps.step');
    
    res.json(updatedTrial);
  } catch (err) {
    console.error('Error updating trial:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete trial
exports.deleteTrial = async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id);
    
    if (!trial) {
      return res.status(404).json({ message: 'Trial not found' });
    }
    
    // Check authorization (admin can delete any trial)
    if (req.user.role !== 'admin' && trial.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this trial' });
    }
    
    await Trial.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Trial removed' });
  } catch (err) {
    console.error('Error deleting trial:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};