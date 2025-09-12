const mongoose = require('mongoose');
const Experiment = require('../../../models/Experiment');
const Trial = require('../../../models/Trial');
const TestHelpers = require('../../utils/testHelpers');

describe('Experiment Model', () => {
  let testUser, testTrial1, testTrial2, testTrial3;

  beforeAll(async () => {
    testUser = await TestHelpers.createTestUser({
      username: 'experimentuser',
      role: 'researcher'
    });

    // Create test steps for trials
    const testStep1 = await TestHelpers.createTestStep({
      name: 'Experiment Step 1',
      type: 'Music',
      duration: 60
    }, testUser._id);

    const testStep2 = await TestHelpers.createTestStep({
      name: 'Experiment Step 2',
      type: 'Question',
      duration: 30
    }, testUser._id);

    // Create test trials for experiments
    testTrial1 = await TestHelpers.createTestTrial({
      name: 'Experiment Trial 1',
      description: 'First trial for experiments',
      steps: [{ step: testStep1._id, order: 1 }]
    }, testUser._id);

    testTrial2 = await TestHelpers.createTestTrial({
      name: 'Experiment Trial 2',
      description: 'Second trial for experiments',
      steps: [{ step: testStep2._id, order: 1 }]
    }, testUser._id);

    testTrial3 = await TestHelpers.createTestTrial({
      name: 'Experiment Trial 3',
      description: 'Third trial for experiments',
      steps: [
        { step: testStep1._id, order: 1 },
        { step: testStep2._id, order: 2 }
      ]
    }, testUser._id);
  });

  describe('Schema Validation', () => {
    it('should create experiment with valid data', async () => {
      const experimentData = {
        name: 'Test Experiment',
        description: 'A comprehensive test experiment',
        trials: [
          { trial: testTrial1._id, order: 1 },
          { trial: testTrial2._id, order: 2 },
          { trial: testTrial3._id, order: 3 }
        ],
        status: 'Active',
        createdBy: testUser._id,
        eegRecordings: []
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.name).toBe('Test Experiment');
      expect(savedExperiment.description).toBe('A comprehensive test experiment');
      expect(savedExperiment.trials).toHaveLength(3);
      expect(savedExperiment.trials[0].trial.toString()).toBe(testTrial1._id.toString());
      expect(savedExperiment.trials[0].order).toBe(1);
      expect(savedExperiment.trials[1].trial.toString()).toBe(testTrial2._id.toString());
      expect(savedExperiment.trials[1].order).toBe(2);
      expect(savedExperiment.trials[2].trial.toString()).toBe(testTrial3._id.toString());
      expect(savedExperiment.trials[2].order).toBe(3);
      expect(savedExperiment.status).toBe('Active');
      expect(savedExperiment.createdBy.toString()).toBe(testUser._id.toString());
      expect(savedExperiment.eegRecordings).toHaveLength(0);
      expect(savedExperiment._id).toBeDefined();
      expect(savedExperiment.createdAt).toBeDefined();
    });

    it('should require name field', async () => {
      const experimentData = {
        description: 'Experiment without name',
        trials: [],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      
      await expect(experiment.save()).rejects.toThrow();
      await expect(experiment.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          name: expect.any(Object)
        })
      });
    });

    it('should set default empty description', async () => {
      const experimentData = {
        name: 'No Description Experiment',
        trials: [],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.name).toBe('No Description Experiment');
      expect(savedExperiment.description).toBe('');
    });

    it('should set default Draft status', async () => {
      const experimentData = {
        name: 'Default Status Experiment',
        trials: [],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.status).toBe('Draft');
    });

    it('should allow experiment without trials', async () => {
      const experimentData = {
        name: 'Empty Experiment',
        description: 'Experiment with no trials',
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.name).toBe('Empty Experiment');
      expect(savedExperiment.trials).toHaveLength(0);
    });

    it('should allow experiment without createdBy', async () => {
      const experimentData = {
        name: 'No Creator Experiment',
        description: 'Experiment without creator',
        trials: []
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.name).toBe('No Creator Experiment');
      expect(savedExperiment.createdBy).toBeUndefined();
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeSave = new Date();
      
      const experimentData = {
        name: 'Timestamp Experiment',
        description: 'Testing timestamp',
        trials: [],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const afterSave = new Date();

      expect(savedExperiment.createdAt).toBeDefined();
      expect(savedExperiment.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedExperiment.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('Status Enum Validation', () => {
    it('should accept valid status values', async () => {
      const validStatuses = ['Draft', 'Active', 'Completed'];

      for (const status of validStatuses) {
        const experimentData = {
          name: `${status} Experiment`,
          description: `Experiment with ${status} status`,
          trials: [],
          status: status,
          createdBy: testUser._id
        };

        const experiment = new Experiment(experimentData);
        const savedExperiment = await experiment.save();

        expect(savedExperiment.status).toBe(status);
      }
    });

    it('should reject invalid status values', async () => {
      const invalidStatuses = ['InvalidStatus', 'Running', 'Paused'];

      for (const status of invalidStatuses) {
        const experimentData = {
          name: 'Invalid Status Experiment',
          description: 'Experiment with invalid status',
          trials: [],
          status: status,
          createdBy: testUser._id
        };

        const experiment = new Experiment(experimentData);
        
        await expect(experiment.save()).rejects.toThrow(/is not a valid enum value/);
      }
    });

    it('should default to Draft when no status is provided', async () => {
      const experimentData = {
        name: 'No Status Experiment',
        description: 'Experiment without status field',
        trials: [],
        createdBy: testUser._id
        // No status field provided
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();
      
      // Should default to 'Draft' when no status is provided
      expect(savedExperiment.status).toBe('Draft');
    });

    it('should reject empty string status', async () => {
      const experimentData = {
        name: 'Empty String Status Experiment',
        description: 'Experiment with empty string status',
        trials: [],
        status: '',
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      
      await expect(experiment.save()).rejects.toThrow(/is not a valid enum value/);
    });
  });

  describe('Trials Array Validation', () => {
    it('should require order field in trials', async () => {
      const experimentData = {
        name: 'Invalid Trial Experiment',
        description: 'Experiment with invalid trial',
        trials: [
          { trial: testTrial1._id } // Missing order
        ],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      
      await expect(experiment.save()).rejects.toThrow();
      await expect(experiment.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          'trials.0.order': expect.any(Object)
        })
      });
    });

    it('should accept various order values', async () => {
      const orderValues = [0, 1, 10, 100, -1, 1.5];

      for (const order of orderValues) {
        const experimentData = {
          name: `Order ${order} Experiment`,
          trials: [
            { trial: testTrial1._id, order: order }
          ],
          createdBy: testUser._id
        };

        const experiment = new Experiment(experimentData);
        const savedExperiment = await experiment.save();

        expect(savedExperiment.trials[0].order).toBe(order);
      }
    });

    it('should allow duplicate order values', async () => {
      const experimentData = {
        name: 'Duplicate Order Experiment',
        trials: [
          { trial: testTrial1._id, order: 1 },
          { trial: testTrial2._id, order: 1 }, // Same order
          { trial: testTrial3._id, order: 1 }  // Same order
        ],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.trials).toHaveLength(3);
      expect(savedExperiment.trials[0].order).toBe(1);
      expect(savedExperiment.trials[1].order).toBe(1);
      expect(savedExperiment.trials[2].order).toBe(1);
    });

    it('should allow same trial with different orders', async () => {
      const experimentData = {
        name: 'Repeated Trial Experiment',
        trials: [
          { trial: testTrial1._id, order: 1 },
          { trial: testTrial1._id, order: 2 }, // Same trial, different order
          { trial: testTrial1._id, order: 3 }  // Same trial, different order
        ],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.trials).toHaveLength(3);
      expect(savedExperiment.trials[0].trial.toString()).toBe(testTrial1._id.toString());
      expect(savedExperiment.trials[1].trial.toString()).toBe(testTrial1._id.toString());
      expect(savedExperiment.trials[2].trial.toString()).toBe(testTrial1._id.toString());
      expect(savedExperiment.trials[0].order).toBe(1);
      expect(savedExperiment.trials[1].order).toBe(2);
      expect(savedExperiment.trials[2].order).toBe(3);
    });

    it('should handle large number of trials', async () => {
      const trials = [];
      for (let i = 1; i <= 50; i++) {
        trials.push({ trial: testTrial1._id, order: i });
      }

      const experimentData = {
        name: 'Large Trials Experiment',
        trials: trials,
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.trials).toHaveLength(50);
      expect(savedExperiment.trials[0].order).toBe(1);
      expect(savedExperiment.trials[49].order).toBe(50);
    });

    it('should validate ObjectId for trial references', async () => {
      const validExperimentData = {
        name: 'Valid ObjectId Experiment',
        trials: [
          { trial: new mongoose.Types.ObjectId(), order: 1 }
        ],
        createdBy: testUser._id
      };

      const experiment = new Experiment(validExperimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.trials[0].trial).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(savedExperiment.trials[0].trial)).toBe(true);
    });

    it('should reject invalid ObjectId for trial references', async () => {
      const invalidExperimentData = {
        name: 'Invalid ObjectId Experiment',
        trials: [
          { trial: 'invalid_object_id', order: 1 }
        ],
        createdBy: testUser._id
      };

      const experiment = new Experiment(invalidExperimentData);
      
      await expect(experiment.save()).rejects.toThrow();
    });
  });

  describe('EEG Recordings Array', () => {
    it('should handle empty eegRecordings array', async () => {
      const experimentData = {
        name: 'No EEG Experiment',
        trials: [],
        eegRecordings: [],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.eegRecordings).toBeDefined();
      expect(Array.isArray(savedExperiment.eegRecordings)).toBe(true);
      expect(savedExperiment.eegRecordings).toHaveLength(0);
    });

    it('should handle eegRecordings with ObjectIds', async () => {
      const recordingIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      const experimentData = {
        name: 'EEG Recordings Experiment',
        trials: [],
        eegRecordings: recordingIds,
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.eegRecordings).toHaveLength(3);
      expect(savedExperiment.eegRecordings[0].toString()).toBe(recordingIds[0].toString());
      expect(savedExperiment.eegRecordings[1].toString()).toBe(recordingIds[1].toString());
      expect(savedExperiment.eegRecordings[2].toString()).toBe(recordingIds[2].toString());
    });

    it('should reject invalid ObjectIds in eegRecordings', async () => {
      const experimentData = {
        name: 'Invalid EEG Experiment',
        trials: [],
        eegRecordings: ['invalid_object_id'],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      
      await expect(experiment.save()).rejects.toThrow();
    });

    it('should allow duplicate eegRecording references', async () => {
      const recordingId = new mongoose.Types.ObjectId();

      const experimentData = {
        name: 'Duplicate EEG Experiment',
        trials: [],
        eegRecordings: [recordingId, recordingId, recordingId],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.eegRecordings).toHaveLength(3);
      expect(savedExperiment.eegRecordings.every(id => id.toString() === recordingId.toString())).toBe(true);
    });
  });

  describe('Reference Relationships', () => {
    it('should populate trial references correctly', async () => {
      // Create fresh entities for this test
      const freshUser = await TestHelpers.createTestUser({ 
        username: `exp_user_${Date.now()}`, 
        role: 'researcher' 
      });
      
      const trial1 = await TestHelpers.createTestTrial({
        name: 'Fresh Experiment Trial 1',
        description: 'First fresh trial for experiments'
      }, freshUser._id);
      
      const trial2 = await TestHelpers.createTestTrial({
        name: 'Fresh Experiment Trial 2',
        description: 'Second fresh trial for experiments'
      }, freshUser._id);

      const experimentData = {
        name: 'Populate Trials Experiment',
        trials: [
          { trial: trial1._id, order: 1 },
          { trial: trial2._id, order: 2 }
        ],
        createdBy: freshUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const populatedExperiment = await Experiment.findById(savedExperiment._id).populate('trials.trial');

      expect(populatedExperiment.trials).toHaveLength(2);
      expect(populatedExperiment.trials[0].trial).not.toBeNull();
      expect(populatedExperiment.trials[0].trial.name).toBe('Fresh Experiment Trial 1');
      expect(populatedExperiment.trials[0].trial.description).toBe('First fresh trial for experiments');
      expect(populatedExperiment.trials[1].trial).not.toBeNull();
      expect(populatedExperiment.trials[1].trial.name).toBe('Fresh Experiment Trial 2');
      expect(populatedExperiment.trials[1].trial.description).toBe('Second fresh trial for experiments');
    });

    it('should populate createdBy reference correctly', async () => {
      // Create fresh entities for this test
      const freshUser = await TestHelpers.createTestUser({ 
        username: `exp_creator_${Date.now()}`, 
        role: 'researcher' 
      });
      
      const freshTrial = await TestHelpers.createTestTrial({
        name: 'Creator Test Trial'
      }, freshUser._id);

      const experimentData = {
        name: 'Populate Creator Experiment',
        trials: [
          { trial: freshTrial._id, order: 1 }
        ],
        createdBy: freshUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const populatedExperiment = await Experiment.findById(savedExperiment._id).populate('createdBy');

      expect(populatedExperiment.createdBy).toBeDefined();
      expect(populatedExperiment.createdBy).not.toBeNull();
      expect(populatedExperiment.createdBy.username).toBe(freshUser.username);
      expect(populatedExperiment.createdBy.role).toBe(freshUser.role);
    });

    it('should populate multiple levels correctly', async () => {
      // Create fresh entities for complex multi-level test
      const freshUser = await TestHelpers.createTestUser({ 
        username: `multilevel_exp_${Date.now()}`, 
        role: 'researcher' 
      });
      
      const freshTrial = await TestHelpers.createTestTrial({
        name: 'Multi-level Experiment Trial',
        description: 'Complex trial with steps'
      }, freshUser._id, 2); // Create trial with 2 steps

      const experimentData = {
        name: 'Multi-level Populate Experiment',
        trials: [
          { trial: freshTrial._id, order: 1 }
        ],
        createdBy: freshUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const populatedExperiment = await Experiment.findById(savedExperiment._id)
        .populate({
          path: 'trials.trial',
          populate: { path: 'steps.step' }
        })
        .populate('createdBy');

      expect(populatedExperiment.trials[0].trial).not.toBeNull();
      expect(populatedExperiment.trials[0].trial.name).toBe('Multi-level Experiment Trial');
      expect(populatedExperiment.trials[0].trial.steps).toHaveLength(2);
      expect(populatedExperiment.trials[0].trial.steps[0].step).not.toBeNull();
      expect(populatedExperiment.createdBy).not.toBeNull();
      expect(populatedExperiment.createdBy.username).toBe(freshUser.username);
    });

    it('should handle non-existent trial references', async () => {
      const nonExistentTrialId = new mongoose.Types.ObjectId();
      
      const experimentData = {
        name: 'Non-existent Trial Experiment',
        trials: [
          { trial: nonExistentTrialId, order: 1 }
        ],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const populatedExperiment = await Experiment.findById(savedExperiment._id).populate('trials.trial');

      expect(populatedExperiment.trials).toHaveLength(1);
      expect(populatedExperiment.trials[0].trial).toBeNull();
      expect(populatedExperiment.trials[0].order).toBe(1);
    });

    it('should handle non-existent user reference', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      
      const experimentData = {
        name: 'Non-existent User Experiment',
        trials: [
          { trial: testTrial1._id, order: 1 }
        ],
        createdBy: nonExistentUserId
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const populatedExperiment = await Experiment.findById(savedExperiment._id).populate('createdBy');

      expect(populatedExperiment.createdBy).toBeNull();
    });
  });

  describe('Querying and Indexing', () => {
    let draftExperiment, activeExperiment, completedExperiment;

    beforeEach(async () => {
      draftExperiment = await TestHelpers.createTestExperiment({
        name: 'Draft Experiment',
        description: 'Experiment in draft status',
        status: 'Draft',
        trials: [
          { trial: testTrial1._id, order: 1 }
        ]
      }, testUser._id);

      activeExperiment = await TestHelpers.createTestExperiment({
        name: 'Active Experiment',
        description: 'Experiment in active status',
        status: 'Active',
        trials: [
          { trial: testTrial1._id, order: 1 },
          { trial: testTrial2._id, order: 2 }
        ]
      }, testUser._id);

      completedExperiment = await TestHelpers.createTestExperiment({
        name: 'Completed Experiment',
        description: 'Experiment in completed status',
        status: 'Completed',
        trials: [
          { trial: testTrial1._id, order: 1 },
          { trial: testTrial2._id, order: 2 },
          { trial: testTrial3._id, order: 3 }
        ]
      }, testUser._id);
    });

    it('should find experiments by status', async () => {
      const draftExperiments = await Experiment.find({ status: 'Draft' });
      const activeExperiments = await Experiment.find({ status: 'Active' });
      const completedExperiments = await Experiment.find({ status: 'Completed' });

      expect(draftExperiments.length).toBeGreaterThanOrEqual(1);
      expect(activeExperiments.length).toBeGreaterThanOrEqual(1);
      expect(completedExperiments.length).toBeGreaterThanOrEqual(1);

      expect(draftExperiments.every(exp => exp.status === 'Draft')).toBe(true);
      expect(activeExperiments.every(exp => exp.status === 'Active')).toBe(true);
      expect(completedExperiments.every(exp => exp.status === 'Completed')).toBe(true);
    });

    it('should find experiments by trial count', async () => {
      const singleTrialExperiments = await Experiment.find({ 'trials.1': { $exists: false } });
      const multiTrialExperiments = await Experiment.find({ 'trials.1': { $exists: true } });

      expect(singleTrialExperiments.length).toBeGreaterThanOrEqual(1); // draft experiment
      expect(multiTrialExperiments.length).toBeGreaterThanOrEqual(2); // active and completed experiments

      expect(singleTrialExperiments.every(exp => exp.trials.length <= 1)).toBe(true);
      expect(multiTrialExperiments.every(exp => exp.trials.length > 1)).toBe(true);
    });

    it('should find experiments by creator', async () => {
      const userExperiments = await Experiment.find({ createdBy: testUser._id });

      expect(userExperiments.length).toBeGreaterThanOrEqual(3);
      expect(userExperiments.every(exp => exp.createdBy.toString() === testUser._id.toString())).toBe(true);
    });

    it('should find experiments containing specific trials', async () => {
      const experimentsWithTrial1 = await Experiment.find({ 'trials.trial': testTrial1._id });

      expect(experimentsWithTrial1.length).toBeGreaterThanOrEqual(3); // all experiments
      expect(experimentsWithTrial1.every(exp => 
        exp.trials.some(trial => trial.trial.toString() === testTrial1._id.toString())
      )).toBe(true);
    });

    it('should sort experiments by creation date', async () => {
      const experimentsByDate = await Experiment.find({ createdBy: testUser._id }).sort({ createdAt: -1 });

      expect(experimentsByDate.length).toBeGreaterThanOrEqual(3);
      
      for (let i = 1; i < experimentsByDate.length; i++) {
        expect(experimentsByDate[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          experimentsByDate[i].createdAt.getTime()
        );
      }
    });

    it('should search experiments by name pattern', async () => {
      const draftExperiments = await Experiment.find({ 
        name: { $regex: /draft/i } 
      });

      expect(draftExperiments.length).toBeGreaterThanOrEqual(1);
      expect(draftExperiments.every(exp => 
        exp.name.toLowerCase().includes('draft')
      )).toBe(true);
    });

    it('should find non-draft experiments', async () => {
      const nonDraftExperiments = await Experiment.find({ 
        status: { $ne: 'Draft' } 
      });

      expect(nonDraftExperiments.length).toBeGreaterThanOrEqual(2);
      expect(nonDraftExperiments.every(exp => exp.status !== 'Draft')).toBe(true);
    });
  });

  describe('Model Methods and Virtuals', () => {
    it('should convert to JSON correctly', async () => {
      const experimentData = {
        name: 'JSON Test Experiment',
        description: 'Testing JSON conversion',
        trials: [
          { trial: testTrial1._id, order: 1 }
        ],
        status: 'Active',
        createdBy: testUser._id,
        eegRecordings: [new mongoose.Types.ObjectId()]
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const jsonExperiment = savedExperiment.toJSON();

      expect(jsonExperiment).toHaveProperty('_id');
      expect(jsonExperiment).toHaveProperty('name', 'JSON Test Experiment');
      expect(jsonExperiment).toHaveProperty('description', 'Testing JSON conversion');
      expect(jsonExperiment).toHaveProperty('trials');
      expect(jsonExperiment.trials).toHaveLength(1);
      expect(jsonExperiment.trials[0]).toHaveProperty('trial');
      expect(jsonExperiment.trials[0]).toHaveProperty('order', 1);
      expect(jsonExperiment).toHaveProperty('status', 'Active');
      expect(jsonExperiment).toHaveProperty('createdBy');
      expect(jsonExperiment).toHaveProperty('eegRecordings');
      expect(jsonExperiment.eegRecordings).toHaveLength(1);
      expect(jsonExperiment).toHaveProperty('createdAt');
    });

    it('should convert to Object correctly', async () => {
      const experimentData = {
        name: 'Object Test Experiment',
        description: 'Testing object conversion',
        trials: [
          { trial: testTrial1._id, order: 1 },
          { trial: testTrial2._id, order: 2 }
        ],
        status: 'Completed',
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      const objectExperiment = savedExperiment.toObject();

      expect(objectExperiment).toHaveProperty('_id');
      expect(objectExperiment).toHaveProperty('name', 'Object Test Experiment');
      expect(objectExperiment).toHaveProperty('trials');
      expect(objectExperiment.trials).toHaveLength(2);
      expect(objectExperiment).toHaveProperty('status', 'Completed');
      expect(objectExperiment).toHaveProperty('createdBy');
      expect(objectExperiment).toHaveProperty('createdAt');
    });
  });

  describe('Error Handling', () => {
    it('should handle mongoose validation errors properly', async () => {
      const invalidExperiment = new Experiment({
        // Missing required name field
        description: 'Invalid experiment',
        trials: []
      });

      try {
        await invalidExperiment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.name).toBeDefined();
      }
    });

    it('should handle trial validation errors', async () => {
      const invalidExperiment = new Experiment({
        name: 'Invalid Trials Experiment',
        trials: [
          { trial: testTrial1._id }, // Missing order
          { order: 2 } // Missing trial
        ]
      });

      try {
        await invalidExperiment.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors['trials.0.order']).toBeDefined();
      }
    });

    it('should handle very long strings', async () => {
      const longName = 'A'.repeat(1000);
      const longDescription = 'B'.repeat(5000);
      
      const experimentData = {
        name: longName,
        description: longDescription,
        trials: [],
        createdBy: testUser._id
      };

      const experiment = new Experiment(experimentData);
      const savedExperiment = await experiment.save();

      expect(savedExperiment.name).toBe(longName);
      expect(savedExperiment.description).toBe(longDescription);
      expect(savedExperiment.name.length).toBe(1000);
      expect(savedExperiment.description.length).toBe(5000);
    });
  });

  describe('Complex Queries and Aggregation', () => {
    beforeEach(async () => {
      // Create some complex experiments for testing
      await TestHelpers.createTestExperiment({
        name: 'Complex Experiment 1',
        description: 'Has 5 trials',
        status: 'Active',
        trials: [
          { trial: testTrial1._id, order: 1 },
          { trial: testTrial2._id, order: 2 },
          { trial: testTrial3._id, order: 3 },
          { trial: testTrial1._id, order: 4 },
          { trial: testTrial2._id, order: 5 }
        ]
      }, testUser._id);

      await TestHelpers.createTestExperiment({
        name: 'Complex Experiment 2',
        description: 'Has 3 trials',
        status: 'Completed',
        trials: [
          { trial: testTrial2._id, order: 1 },
          { trial: testTrial3._id, order: 2 },
          { trial: testTrial1._id, order: 3 }
        ]
      }, testUser._id);
    });

    it('should aggregate experiment statistics', async () => {
      const stats = await Experiment.aggregate([
        { $match: { createdBy: testUser._id } },
        {
          $project: {
            name: 1,
            status: 1,
            trialCount: { $size: '$trials' }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgTrialCount: { $avg: '$trialCount' },
            maxTrialCount: { $max: '$trialCount' }
          }
        }
      ]);

      expect(stats.length).toBeGreaterThan(0);
      const statusCounts = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      expect(statusCounts).toHaveProperty('Draft');
      expect(statusCounts).toHaveProperty('Active');
      expect(statusCounts).toHaveProperty('Completed');
    });

    it('should find experiments with trial count ranges', async () => {
      const experimentsWithManyTrials = await Experiment.find({
        $expr: { $gte: [{ $size: '$trials' }, 4] }
      });

      const experimentsWithFewTrials = await Experiment.find({
        $expr: { $lt: [{ $size: '$trials' }, 4] }
      });

      expect(experimentsWithManyTrials.length).toBeGreaterThanOrEqual(1);
      expect(experimentsWithFewTrials.length).toBeGreaterThanOrEqual(1);
    });

    it('should count experiments by status', async () => {
      const statusCounts = await Experiment.aggregate([
        { $match: { createdBy: testUser._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      expect(statusCounts.length).toBeGreaterThan(0);
      expect(statusCounts.every(stat => stat.count > 0)).toBe(true);
    });
  });
});