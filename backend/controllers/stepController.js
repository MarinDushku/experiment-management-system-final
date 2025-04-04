const Step = require('../models/Step');
const fs = require('fs');
const path = require('path');

// Create a new step
exports.createStep = async (req, res) => {
  try {
    const { name, type, duration, details } = req.body;
    
    // Create the step
    const step = new Step({
      name,
      type,
      duration,
      details: details ? JSON.parse(details) : {},
      createdBy: req.user.id
    });
    
    // If a file was uploaded (for Music type)
    if (req.file && type === 'Music') {
      step.details.audioFile = req.file.path;
    }
    
    await step.save();
    
    res.status(201).json(step);
  } catch (err) {
    console.error('Error creating step:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all steps
exports.getSteps = async (req, res) => {
  try {
    // For admin, get all steps. For others, get only their own
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    
    const steps = await Step.find(query).sort({ createdAt: -1 });
    res.json(steps);
  } catch (err) {
    console.error('Error getting steps:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get step by ID
exports.getStepById = async (req, res) => {
  try {
    const step = await Step.findById(req.params.id);
    
    if (!step) {
      return res.status(404).json({ message: 'Step not found' });
    }
    
    // Check authorization (admin can see all steps)
    if (req.user.role !== 'admin' && step.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this step' });
    }
    
    res.json(step);
  } catch (err) {
    console.error('Error getting step:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update step
exports.updateStep = async (req, res) => {
  try {
    const { name, type, duration, details } = req.body;
    
    // Find the step
    let step = await Step.findById(req.params.id);
    
    if (!step) {
      return res.status(404).json({ message: 'Step not found' });
    }
    
    // Check authorization (admin can update any step)
    if (req.user.role !== 'admin' && step.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this step' });
    }
    
    // Update fields
    step.name = name || step.name;
    step.type = type || step.type;
    step.duration = duration || step.duration;
    
    // Update details if provided
    if (details) {
      step.details = JSON.parse(details);
    }
    
    // If a file was uploaded (for Music type)
    if (req.file && step.type === 'Music') {
      // Delete the old file if it exists
      if (step.details.audioFile && fs.existsSync(step.details.audioFile)) {
        fs.unlinkSync(step.details.audioFile);
      }
      
      step.details.audioFile = req.file.path;
    }
    
    await step.save();
    
    res.json(step);
  } catch (err) {
    console.error('Error updating step:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete step
exports.deleteStep = async (req, res) => {
  try {
    const step = await Step.findById(req.params.id);
    
    if (!step) {
      return res.status(404).json({ message: 'Step not found' });
    }
    
    // Check authorization (admin can delete any step)
    if (req.user.role !== 'admin' && step.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this step' });
    }
    
    // Delete the audio file if it exists (for Music type)
    if (step.type === 'Music' && step.details.audioFile && fs.existsSync(step.details.audioFile)) {
      fs.unlinkSync(step.details.audioFile);
    }
    
    await Step.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Step removed' });
  } catch (err) {
    console.error('Error deleting step:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};