// Update EEGRecording.js
const mongoose = require('mongoose');

const EEGRecordingSchema = new mongoose.Schema({
  experiment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experiment',
    required: true
  },
  experimentName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  samplingRate: {
    type: Number,
    required: true
  },
  channelCount: {
    type: Number,
    required: true
  },
  sampleCount: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EEGRecording', EEGRecordingSchema);