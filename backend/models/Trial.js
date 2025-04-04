const mongoose = require('mongoose');

const TrialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  steps: [{
    step: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step'
    },
    order: {
      type: Number,
      required: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Trial', TrialSchema);