const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Music', 'Question', 'Rest'],
    required: true
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for type-specific data
    default: {}
  },
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
StepSchema.index({ createdBy: 1 });
StepSchema.index({ type: 1 });
StepSchema.index({ createdAt: -1 });
StepSchema.index({ createdBy: 1, type: 1 }); // Compound index for user's steps by type
StepSchema.index({ createdBy: 1, createdAt: -1 }); // Compound index for user's steps sorted by date

module.exports = mongoose.model('Step', StepSchema);