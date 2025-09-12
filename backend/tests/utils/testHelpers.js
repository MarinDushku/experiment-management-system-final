const mongoose = require('mongoose');
const User = require('../../models/User');
const Experiment = require('../../models/Experiment');
const Trial = require('../../models/Trial');
const Step = require('../../models/Step');
const Response = require('../../models/Response');
const EEGRecording = require('../../models/EEGRecording');

/**
 * Database test helpers for creating test data
 */
class TestHelpers {
  /**
   * Create a test user in the database
   */
  static async createTestUser(userData = {}) {
    const defaultUser = {
      username: `testuser_${Date.now()}`,
      password: 'testpassword123',
      role: 'user'
    };
    
    const user = new User({ ...defaultUser, ...userData });
    await user.save();
    return user;
  }

  /**
   * Create a test admin user
   */
  static async createTestAdmin(userData = {}) {
    return this.createTestUser({ 
      username: `admin_${Date.now()}`,
      role: 'admin',
      ...userData 
    });
  }

  /**
   * Create a test researcher user
   */
  static async createTestResearcher(userData = {}) {
    return this.createTestUser({ 
      username: `researcher_${Date.now()}`,
      role: 'researcher',
      ...userData 
    });
  }

  /**
   * Create a test step
   */
  static async createTestStep(stepData = {}, userId = null) {
    const user = userId || await this.createTestUser();
    
    const defaultStep = {
      name: `Test Step ${Date.now()}`,
      type: 'Music',
      duration: 30,
      details: { audioFile: 'test-audio.mp3' },
      createdBy: user._id || user
    };
    
    const step = new Step({ ...defaultStep, ...stepData });
    await step.save();
    return step;
  }

  /**
   * Create a test trial with steps
   */
  static async createTestTrial(trialData = {}, userId = null, stepCount = 2) {
    const user = userId || await this.createTestUser();
    
    // Create steps for the trial
    const steps = [];
    for (let i = 0; i < stepCount; i++) {
      const step = await this.createTestStep({
        name: `Test Step ${i + 1}`,
        type: i % 2 === 0 ? 'Music' : 'Question'
      }, user._id || user);
      
      steps.push({
        step: step._id,
        order: i + 1
      });
    }
    
    const defaultTrial = {
      name: `Test Trial ${Date.now()}`,
      description: 'A test trial for unit testing',
      steps: steps,
      createdBy: user._id || user
    };
    
    const trial = new Trial({ ...defaultTrial, ...trialData });
    await trial.save();
    return trial;
  }

  /**
   * Create a test experiment with trials
   */
  static async createTestExperiment(experimentData = {}, userId = null, trialCount = 1) {
    const user = userId || await this.createTestUser();
    
    // Create trials for the experiment
    const trials = [];
    for (let i = 0; i < trialCount; i++) {
      const trial = await this.createTestTrial({
        name: `Test Trial ${i + 1}`
      }, user._id || user);
      
      trials.push({
        trial: trial._id,
        order: i + 1
      });
    }
    
    const defaultExperiment = {
      name: `Test Experiment ${Date.now()}`,
      description: 'A test experiment for unit testing',
      status: 'Draft',
      trials: trials,
      createdBy: user._id || user
    };
    
    const experiment = new Experiment({ ...defaultExperiment, ...experimentData });
    await experiment.save();
    return experiment;
  }

  /**
   * Create a test response
   */
  static async createTestResponse(responseData = {}, experimentId = null, stepId = null) {
    const experiment = experimentId || await this.createTestExperiment();
    const step = stepId || await this.createTestStep();
    
    const defaultResponse = {
      experimentId: experiment._id || experiment,
      experimentName: experiment.name || 'Test Experiment',
      stepId: step._id || step,
      response: 'Test response answer',
      timestamp: new Date(),
      timeSinceStart: 15000, // 15 seconds
      trialIndex: 0,
      stepIndex: 0
    };
    
    const response = new Response({ ...defaultResponse, ...responseData });
    await response.save();
    return response;
  }

  /**
   * Create a test EEG recording
   */
  static async createTestEEGRecording(recordingData = {}, experimentId = null) {
    const experiment = experimentId || await this.createTestExperiment();
    
    const defaultRecording = {
      experiment: experiment._id || experiment,
      experimentName: experiment.name || 'Test Experiment',
      startTime: new Date(Date.now() - 60000), // 1 minute ago
      endTime: new Date(),
      samplingRate: 250,
      channelCount: 8,
      sampleCount: 15000,
      filePath: 'test-eeg-data.csv'
    };
    
    const recording = new EEGRecording({ ...defaultRecording, ...recordingData });
    await recording.save();
    return recording;
  }

  /**
   * Clean up all test data
   */
  static async cleanup() {
    const collections = [User, Experiment, Trial, Step, Response, EEGRecording];
    
    for (const Collection of collections) {
      await Collection.deleteMany({});
    }
  }

  /**
   * Create mock request object for testing middleware
   */
  static createMockReq(overrides = {}) {
    return {
      headers: {},
      body: {},
      params: {},
      query: {},
      user: null,
      file: null,
      ...overrides
    };
  }

  /**
   * Create mock response object for testing middleware
   */
  static createMockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  }

  /**
   * Create mock next function for testing middleware
   */
  static createMockNext() {
    return jest.fn();
  }

  /**
   * Wait for a specified time (useful for async tests)
   */
  static async wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TestHelpers;