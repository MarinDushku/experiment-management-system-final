const mongoose = require('mongoose');
const Trial = require('../../../models/Trial');
const Step = require('../../../models/Step');
const TestHelpers = require('../../utils/testHelpers');

describe('Trial Model', () => {
  let testUser, testStep1, testStep2, testStep3;

  beforeAll(async () => {
    testUser = await TestHelpers.createTestUser({
      username: 'trialuser',
      role: 'researcher'
    });

    // Create test steps for trials
    testStep1 = await TestHelpers.createTestStep({
      name: 'Trial Step 1',
      type: 'Music',
      duration: 60
    }, testUser._id);

    testStep2 = await TestHelpers.createTestStep({
      name: 'Trial Step 2',
      type: 'Question',
      duration: 30
    }, testUser._id);

    testStep3 = await TestHelpers.createTestStep({
      name: 'Trial Step 3',
      type: 'Rest',
      duration: 45
    }, testUser._id);
  });

  describe('Schema Validation', () => {
    it('should create trial with valid data', async () => {
      const trialData = {
        name: 'Test Trial',
        description: 'A comprehensive test trial',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: testStep2._id, order: 2 },
          { step: testStep3._id, order: 3 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.name).toBe('Test Trial');
      expect(savedTrial.description).toBe('A comprehensive test trial');
      expect(savedTrial.steps).toHaveLength(3);
      expect(savedTrial.steps[0].step.toString()).toBe(testStep1._id.toString());
      expect(savedTrial.steps[0].order).toBe(1);
      expect(savedTrial.steps[1].step.toString()).toBe(testStep2._id.toString());
      expect(savedTrial.steps[1].order).toBe(2);
      expect(savedTrial.steps[2].step.toString()).toBe(testStep3._id.toString());
      expect(savedTrial.steps[2].order).toBe(3);
      expect(savedTrial.createdBy.toString()).toBe(testUser._id.toString());
      expect(savedTrial._id).toBeDefined();
      expect(savedTrial.createdAt).toBeDefined();
    });

    it('should require name field', async () => {
      const trialData = {
        description: 'Trial without name',
        steps: [],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      
      await expect(trial.save()).rejects.toThrow();
      await expect(trial.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          name: expect.any(Object)
        })
      });
    });

    it('should set default empty description', async () => {
      const trialData = {
        name: 'No Description Trial',
        steps: [],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.name).toBe('No Description Trial');
      expect(savedTrial.description).toBe('');
    });

    it('should allow trial without steps', async () => {
      const trialData = {
        name: 'Empty Trial',
        description: 'Trial with no steps',
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.name).toBe('Empty Trial');
      expect(savedTrial.steps).toHaveLength(0);
    });

    it('should allow trial without createdBy', async () => {
      const trialData = {
        name: 'No Creator Trial',
        description: 'Trial without creator',
        steps: []
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.name).toBe('No Creator Trial');
      expect(savedTrial.createdBy).toBeUndefined();
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeSave = new Date();
      
      const trialData = {
        name: 'Timestamp Trial',
        description: 'Testing timestamp',
        steps: [],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const afterSave = new Date();

      expect(savedTrial.createdAt).toBeDefined();
      expect(savedTrial.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedTrial.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('Steps Array Validation', () => {
    it('should require order field in steps', async () => {
      const trialData = {
        name: 'Invalid Step Trial',
        description: 'Trial with invalid step',
        steps: [
          { step: testStep1._id } // Missing order
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      
      await expect(trial.save()).rejects.toThrow();
      await expect(trial.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          'steps.0.order': expect.any(Object)
        })
      });
    });

    it('should accept various order values', async () => {
      const orderValues = [0, 1, 10, 100, -1, 1.5];

      for (const order of orderValues) {
        const trialData = {
          name: `Order ${order} Trial`,
          steps: [
            { step: testStep1._id, order: order }
          ],
          createdBy: testUser._id
        };

        const trial = new Trial(trialData);
        const savedTrial = await trial.save();

        expect(savedTrial.steps[0].order).toBe(order);
      }
    });

    it('should allow duplicate order values', async () => {
      const trialData = {
        name: 'Duplicate Order Trial',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: testStep2._id, order: 1 }, // Same order
          { step: testStep3._id, order: 1 }  // Same order
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps).toHaveLength(3);
      expect(savedTrial.steps[0].order).toBe(1);
      expect(savedTrial.steps[1].order).toBe(1);
      expect(savedTrial.steps[2].order).toBe(1);
    });

    it('should allow same step with different orders', async () => {
      const trialData = {
        name: 'Repeated Step Trial',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: testStep1._id, order: 2 }, // Same step, different order
          { step: testStep1._id, order: 3 }  // Same step, different order
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps).toHaveLength(3);
      expect(savedTrial.steps[0].step.toString()).toBe(testStep1._id.toString());
      expect(savedTrial.steps[1].step.toString()).toBe(testStep1._id.toString());
      expect(savedTrial.steps[2].step.toString()).toBe(testStep1._id.toString());
      expect(savedTrial.steps[0].order).toBe(1);
      expect(savedTrial.steps[1].order).toBe(2);
      expect(savedTrial.steps[2].order).toBe(3);
    });

    it('should handle large number of steps', async () => {
      const steps = [];
      for (let i = 1; i <= 100; i++) {
        steps.push({ step: testStep1._id, order: i });
      }

      const trialData = {
        name: 'Large Steps Trial',
        steps: steps,
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps).toHaveLength(100);
      expect(savedTrial.steps[0].order).toBe(1);
      expect(savedTrial.steps[99].order).toBe(100);
    });

    it('should validate ObjectId for step references', async () => {
      const validTrialData = {
        name: 'Valid ObjectId Trial',
        steps: [
          { step: new mongoose.Types.ObjectId(), order: 1 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(validTrialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps[0].step).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(savedTrial.steps[0].step)).toBe(true);
    });

    it('should reject invalid ObjectId for step references', async () => {
      const invalidTrialData = {
        name: 'Invalid ObjectId Trial',
        steps: [
          { step: 'invalid_object_id', order: 1 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(invalidTrialData);
      
      await expect(trial.save()).rejects.toThrow();
    });
  });

  describe('Reference Relationships', () => {
    it('should populate step references correctly', async () => {
      // Create fresh user and steps for this test
      const freshUser = await TestHelpers.createTestUser({ 
        username: `trial_user_${Date.now()}`, 
        role: 'researcher' 
      });
      
      const step1 = await TestHelpers.createTestStep({
        name: 'Fresh Trial Step 1',
        type: 'Music',
        duration: 30
      }, freshUser._id);
      
      const step2 = await TestHelpers.createTestStep({
        name: 'Fresh Trial Step 2',
        type: 'Question',
        duration: 45
      }, freshUser._id);

      const trialData = {
        name: 'Populate Steps Trial',
        steps: [
          { step: step1._id, order: 1 },
          { step: step2._id, order: 2 }
        ],
        createdBy: freshUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const populatedTrial = await Trial.findById(savedTrial._id).populate('steps.step');

      expect(populatedTrial.steps).toHaveLength(2);
      expect(populatedTrial.steps[0].step).not.toBeNull();
      expect(populatedTrial.steps[0].step.name).toBe('Fresh Trial Step 1');
      expect(populatedTrial.steps[0].step.type).toBe('Music');
      expect(populatedTrial.steps[1].step).not.toBeNull();
      expect(populatedTrial.steps[1].step.name).toBe('Fresh Trial Step 2');
      expect(populatedTrial.steps[1].step.type).toBe('Question');
    });

    it('should populate createdBy reference correctly', async () => {
      // Create fresh user and step for this test
      const freshUser = await TestHelpers.createTestUser({ 
        username: `creator_user_${Date.now()}`, 
        role: 'researcher' 
      });
      
      const freshStep = await TestHelpers.createTestStep({
        name: 'Creator Test Step',
        type: 'Music'
      }, freshUser._id);

      const trialData = {
        name: 'Populate Creator Trial',
        steps: [
          { step: freshStep._id, order: 1 }
        ],
        createdBy: freshUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const populatedTrial = await Trial.findById(savedTrial._id).populate('createdBy');

      expect(populatedTrial.createdBy).toBeDefined();
      expect(populatedTrial.createdBy).not.toBeNull();
      expect(populatedTrial.createdBy.username).toBe(freshUser.username);
      expect(populatedTrial.createdBy.role).toBe(freshUser.role);
    });

    it('should populate multiple levels correctly', async () => {
      // Create fresh entities for this complex test
      const freshUser = await TestHelpers.createTestUser({ 
        username: `multilevel_user_${Date.now()}`, 
        role: 'researcher' 
      });
      
      const freshStep = await TestHelpers.createTestStep({
        name: 'Multi-level Test Step',
        type: 'Music'
      }, freshUser._id);

      const trialData = {
        name: 'Multi-level Populate Trial',
        steps: [
          { step: freshStep._id, order: 1 }
        ],
        createdBy: freshUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const populatedTrial = await Trial.findById(savedTrial._id)
        .populate('steps.step')
        .populate('createdBy');

      expect(populatedTrial.steps[0].step).not.toBeNull();
      expect(populatedTrial.steps[0].step.name).toBe('Multi-level Test Step');
      expect(populatedTrial.steps[0].step.createdBy.toString()).toBe(freshUser._id.toString());
      expect(populatedTrial.createdBy).not.toBeNull();
      expect(populatedTrial.createdBy.username).toBe(freshUser.username);
    });

    it('should handle non-existent step references', async () => {
      const nonExistentStepId = new mongoose.Types.ObjectId();
      
      const trialData = {
        name: 'Non-existent Step Trial',
        steps: [
          { step: nonExistentStepId, order: 1 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const populatedTrial = await Trial.findById(savedTrial._id).populate('steps.step');

      expect(populatedTrial.steps).toHaveLength(1);
      expect(populatedTrial.steps[0].step).toBeNull();
      expect(populatedTrial.steps[0].order).toBe(1);
    });

    it('should handle non-existent user reference', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      
      const trialData = {
        name: 'Non-existent User Trial',
        steps: [
          { step: testStep1._id, order: 1 }
        ],
        createdBy: nonExistentUserId
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const populatedTrial = await Trial.findById(savedTrial._id).populate('createdBy');

      expect(populatedTrial.createdBy).toBeNull();
    });
  });

  describe('Querying and Indexing', () => {
    let musicTrial, questionTrial, mixedTrial;

    beforeEach(async () => {
      musicTrial = await TestHelpers.createTestTrial({
        name: 'Music Trial',
        description: 'Trial with music steps',
        steps: [
          { step: testStep1._id, order: 1 } // Music step
        ]
      }, testUser._id);

      questionTrial = await TestHelpers.createTestTrial({
        name: 'Question Trial',
        description: 'Trial with question steps',
        steps: [
          { step: testStep2._id, order: 1 } // Question step
        ]
      }, testUser._id);

      mixedTrial = await TestHelpers.createTestTrial({
        name: 'Mixed Trial',
        description: 'Trial with mixed steps',
        steps: [
          { step: testStep1._id, order: 1 }, // Music
          { step: testStep2._id, order: 2 }, // Question
          { step: testStep3._id, order: 3 }  // Rest
        ]
      }, testUser._id);
    });

    it('should find trials by name', async () => {
      const musicTrials = await Trial.find({ name: /Music/i });
      const questionTrials = await Trial.find({ name: /Question/i });

      expect(musicTrials.length).toBeGreaterThanOrEqual(1);
      expect(questionTrials.length).toBeGreaterThanOrEqual(1);

      expect(musicTrials.some(trial => trial.name.includes('Music'))).toBe(true);
      expect(questionTrials.some(trial => trial.name.includes('Question'))).toBe(true);
    });

    it('should find trials by step count', async () => {
      const singleStepTrials = await Trial.find({ 'steps.1': { $exists: false } });
      const multiStepTrials = await Trial.find({ 'steps.1': { $exists: true } });

      expect(singleStepTrials.length).toBeGreaterThanOrEqual(2); // music and question trials
      expect(multiStepTrials.length).toBeGreaterThanOrEqual(1); // mixed trial

      expect(singleStepTrials.every(trial => trial.steps.length <= 1)).toBe(true);
      expect(multiStepTrials.every(trial => trial.steps.length > 1)).toBe(true);
    });

    it('should find trials by creator', async () => {
      const userTrials = await Trial.find({ createdBy: testUser._id });

      expect(userTrials.length).toBeGreaterThanOrEqual(3);
      expect(userTrials.every(trial => trial.createdBy.toString() === testUser._id.toString())).toBe(true);
    });

    it('should find trials containing specific steps', async () => {
      const trialsWithStep1 = await Trial.find({ 'steps.step': testStep1._id });

      expect(trialsWithStep1.length).toBeGreaterThanOrEqual(2); // music and mixed trials
      expect(trialsWithStep1.every(trial => 
        trial.steps.some(step => step.step.toString() === testStep1._id.toString())
      )).toBe(true);
    });

    it('should sort trials by creation date', async () => {
      const trialsByDate = await Trial.find({ createdBy: testUser._id }).sort({ createdAt: -1 });

      expect(trialsByDate.length).toBeGreaterThanOrEqual(3);
      
      for (let i = 1; i < trialsByDate.length; i++) {
        expect(trialsByDate[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          trialsByDate[i].createdAt.getTime()
        );
      }
    });

    it('should search trials by description', async () => {
      const musicDescTrials = await Trial.find({ 
        description: { $regex: /music/i } 
      });

      expect(musicDescTrials.length).toBeGreaterThanOrEqual(1);
      expect(musicDescTrials.every(trial => 
        trial.description.toLowerCase().includes('music')
      )).toBe(true);
    });
  });

  describe('Step Ordering and Management', () => {
    it('should maintain step order correctly', async () => {
      const trialData = {
        name: 'Ordered Trial',
        steps: [
          { step: testStep3._id, order: 3 },
          { step: testStep1._id, order: 1 },
          { step: testStep2._id, order: 2 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      // Steps should be saved in the order they were provided, not sorted by order
      expect(savedTrial.steps[0].order).toBe(3);
      expect(savedTrial.steps[1].order).toBe(1);
      expect(savedTrial.steps[2].order).toBe(2);

      // Verify step references are correct
      expect(savedTrial.steps[0].step.toString()).toBe(testStep3._id.toString());
      expect(savedTrial.steps[1].step.toString()).toBe(testStep1._id.toString());
      expect(savedTrial.steps[2].step.toString()).toBe(testStep2._id.toString());
    });

    it('should handle steps with negative orders', async () => {
      const trialData = {
        name: 'Negative Order Trial',
        steps: [
          { step: testStep1._id, order: -1 },
          { step: testStep2._id, order: 0 },
          { step: testStep3._id, order: 1 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps[0].order).toBe(-1);
      expect(savedTrial.steps[1].order).toBe(0);
      expect(savedTrial.steps[2].order).toBe(1);
    });

    it('should handle steps with decimal orders', async () => {
      const trialData = {
        name: 'Decimal Order Trial',
        steps: [
          { step: testStep1._id, order: 1.5 },
          { step: testStep2._id, order: 2.7 },
          { step: testStep3._id, order: 3.1 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps[0].order).toBe(1.5);
      expect(savedTrial.steps[1].order).toBe(2.7);
      expect(savedTrial.steps[2].order).toBe(3.1);
    });

    it('should handle very large order numbers', async () => {
      const trialData = {
        name: 'Large Order Trial',
        steps: [
          { step: testStep1._id, order: Number.MAX_SAFE_INTEGER },
          { step: testStep2._id, order: Number.MAX_SAFE_INTEGER - 1 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps[0].order).toBe(Number.MAX_SAFE_INTEGER);
      expect(savedTrial.steps[1].order).toBe(Number.MAX_SAFE_INTEGER - 1);
    });
  });

  describe('Model Methods and Virtuals', () => {
    it('should convert to JSON correctly', async () => {
      const trialData = {
        name: 'JSON Test Trial',
        description: 'Testing JSON conversion',
        steps: [
          { step: testStep1._id, order: 1 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const jsonTrial = savedTrial.toJSON();

      expect(jsonTrial).toHaveProperty('_id');
      expect(jsonTrial).toHaveProperty('name', 'JSON Test Trial');
      expect(jsonTrial).toHaveProperty('description', 'Testing JSON conversion');
      expect(jsonTrial).toHaveProperty('steps');
      expect(jsonTrial.steps).toHaveLength(1);
      expect(jsonTrial.steps[0]).toHaveProperty('step');
      expect(jsonTrial.steps[0]).toHaveProperty('order', 1);
      expect(jsonTrial).toHaveProperty('createdBy');
      expect(jsonTrial).toHaveProperty('createdAt');
    });

    it('should convert to Object correctly', async () => {
      const trialData = {
        name: 'Object Test Trial',
        description: 'Testing object conversion',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: testStep2._id, order: 2 }
        ],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      const objectTrial = savedTrial.toObject();

      expect(objectTrial).toHaveProperty('_id');
      expect(objectTrial).toHaveProperty('name', 'Object Test Trial');
      expect(objectTrial).toHaveProperty('steps');
      expect(objectTrial.steps).toHaveLength(2);
      expect(objectTrial).toHaveProperty('createdBy');
      expect(objectTrial).toHaveProperty('createdAt');
    });
  });

  describe('Error Handling', () => {
    it('should handle mongoose validation errors properly', async () => {
      const invalidTrial = new Trial({
        // Missing required name field
        description: 'Invalid trial',
        steps: []
      });

      try {
        await invalidTrial.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.name).toBeDefined();
      }
    });

    it('should handle step validation errors', async () => {
      const invalidTrial = new Trial({
        name: 'Invalid Steps Trial',
        steps: [
          { step: testStep1._id }, // Missing order
          { order: 2 } // Missing step
        ]
      });

      try {
        await invalidTrial.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors['steps.0.order']).toBeDefined();
      }
    });

    it('should handle very long strings', async () => {
      const longName = 'A'.repeat(1000);
      const longDescription = 'B'.repeat(5000);
      
      const trialData = {
        name: longName,
        description: longDescription,
        steps: [],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.name).toBe(longName);
      expect(savedTrial.description).toBe(longDescription);
      expect(savedTrial.name.length).toBe(1000);
      expect(savedTrial.description.length).toBe(5000);
    });

    it('should handle empty steps array edge cases', async () => {
      const trialData = {
        name: 'Empty Steps Trial',
        description: 'Trial with explicitly empty steps',
        steps: [],
        createdBy: testUser._id
      };

      const trial = new Trial(trialData);
      const savedTrial = await trial.save();

      expect(savedTrial.steps).toBeDefined();
      expect(Array.isArray(savedTrial.steps)).toBe(true);
      expect(savedTrial.steps).toHaveLength(0);
    });
  });

  describe('Complex Queries and Aggregation', () => {
    beforeEach(async () => {
      // Create some complex trials for testing
      await TestHelpers.createTestTrial({
        name: 'Complex Trial 1',
        description: 'Has 5 steps',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: testStep2._id, order: 2 },
          { step: testStep3._id, order: 3 },
          { step: testStep1._id, order: 4 },
          { step: testStep2._id, order: 5 }
        ]
      }, testUser._id);

      await TestHelpers.createTestTrial({
        name: 'Complex Trial 2',
        description: 'Has 3 steps',
        steps: [
          { step: testStep2._id, order: 1 },
          { step: testStep3._id, order: 2 },
          { step: testStep1._id, order: 3 }
        ]
      }, testUser._id);
    });

    it('should aggregate trial statistics', async () => {
      const stats = await Trial.aggregate([
        { $match: { createdBy: testUser._id } },
        {
          $project: {
            name: 1,
            stepCount: { $size: '$steps' }
          }
        },
        {
          $group: {
            _id: null,
            totalTrials: { $sum: 1 },
            avgStepCount: { $avg: '$stepCount' },
            maxStepCount: { $max: '$stepCount' },
            minStepCount: { $min: '$stepCount' }
          }
        }
      ]);

      expect(stats).toHaveLength(1);
      expect(stats[0].totalTrials).toBeGreaterThanOrEqual(2);
      expect(stats[0].avgStepCount).toBeGreaterThan(0);
      expect(stats[0].maxStepCount).toBeGreaterThanOrEqual(stats[0].minStepCount);
    });

    it('should find trials with step count ranges', async () => {
      const trialsWithManySteps = await Trial.find({
        $expr: { $gte: [{ $size: '$steps' }, 4] }
      });

      const trialsWithFewSteps = await Trial.find({
        $expr: { $lt: [{ $size: '$steps' }, 4] }
      });

      expect(trialsWithManySteps.length).toBeGreaterThanOrEqual(1);
      expect(trialsWithFewSteps.length).toBeGreaterThanOrEqual(1);
    });
  });
});