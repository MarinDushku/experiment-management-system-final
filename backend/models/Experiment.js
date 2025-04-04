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
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Experiment', ExperimentSchema);