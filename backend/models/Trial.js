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
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for performance
TrialSchema.index({ createdBy: 1 });
TrialSchema.index({ createdAt: -1 });
TrialSchema.index({ createdBy: 1, createdAt: -1 }); // Compound index for user's trials sorted by date

module.exports = mongoose.model('Trial', TrialSchema);