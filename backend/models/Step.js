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
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Step', StepSchema);