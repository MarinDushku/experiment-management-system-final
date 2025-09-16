const mongoose = require('mongoose');

const ExperimentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  trials: [{
    trial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trial'
    },
    order: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Completed'],
    default: 'Draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eegRecordings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EEGRecording'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for performance
ExperimentSchema.index({ createdBy: 1 });
ExperimentSchema.index({ createdAt: -1 });
ExperimentSchema.index({ status: 1 });
ExperimentSchema.index({ createdBy: 1, status: 1 }); // Compound index for user's experiments by status
ExperimentSchema.index({ createdBy: 1, createdAt: -1 }); // Compound index for user's experiments sorted by date

module.exports = mongoose.model('Experiment', ExperimentSchema);