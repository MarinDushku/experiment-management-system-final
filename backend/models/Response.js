// backend/models/Response.js

const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  experimentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experiment',
    required: true
  },
  experimentName: {
    type: String,
    required: true
  },
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    required: true
  },
  response: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  timeSinceStart: {
    type: Number, // milliseconds since experiment started
    required: true
  },
  trialIndex: {
    type: Number,
    required: true
  },
  stepIndex: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Response', ResponseSchema);