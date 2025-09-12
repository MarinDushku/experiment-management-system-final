const mongoose = require('mongoose');
const Step = require('../../../models/Step');
const TestHelpers = require('../../utils/testHelpers');

describe('Step Model', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await TestHelpers.createTestUser({
      username: 'stepuser',
      role: 'researcher'
    });
  });

  describe('Schema Validation', () => {
    it('should create step with valid data', async () => {
      const stepData = {
        name: 'Test Music Step',
        type: 'Music',
        duration: 60,
        details: { volume: 0.8, track: 'classical.mp3' },
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.name).toBe('Test Music Step');
      expect(savedStep.type).toBe('Music');
      expect(savedStep.duration).toBe(60);
      expect(savedStep.details.volume).toBe(0.8);
      expect(savedStep.details.track).toBe('classical.mp3');
      expect(savedStep.createdBy.toString()).toBe(testUser._id.toString());
      expect(savedStep._id).toBeDefined();
      expect(savedStep.createdAt).toBeDefined();
    });

    it('should require name field', async () => {
      const stepData = {
        type: 'Rest',
        duration: 30,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      
      await expect(step.save()).rejects.toThrow();
      await expect(step.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          name: expect.any(Object)
        })
      });
    });

    it('should require type field', async () => {
      const stepData = {
        name: 'Test Step',
        duration: 30,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      
      await expect(step.save()).rejects.toThrow();
      await expect(step.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          type: expect.any(Object)
        })
      });
    });

    it('should require duration field', async () => {
      const stepData = {
        name: 'Test Step',
        type: 'Question',
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      
      await expect(step.save()).rejects.toThrow();
      await expect(step.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          duration: expect.any(Object)
        })
      });
    });

    it('should validate type enum values', async () => {
      const validTypes = ['Music', 'Question', 'Rest'];

      for (const type of validTypes) {
        const stepData = {
          name: `${type} Step`,
          type: type,
          duration: 30,
          createdBy: testUser._id
        };

        const step = new Step(stepData);
        const savedStep = await step.save();

        expect(savedStep.type).toBe(type);
      }
    });

    it('should reject invalid type values', async () => {
      const invalidTypes = ['InvalidType', 'Video', 'Image', '', null, undefined];

      for (const type of invalidTypes) {
        const stepData = {
          name: 'Invalid Type Step',
          type: type,
          duration: 30,
          createdBy: testUser._id
        };

        const step = new Step(stepData);
        
        await expect(step.save()).rejects.toThrow();
        await expect(step.save()).rejects.toMatchObject({
          errors: expect.objectContaining({
            type: expect.any(Object)
          })
        });
      }
    });

    it('should allow createdBy field to be optional', async () => {
      const stepData = {
        name: 'No Creator Step',
        type: 'Rest',
        duration: 15
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.name).toBe('No Creator Step');
      expect(savedStep.createdBy).toBeUndefined();
    });

    it('should set default empty object for details', async () => {
      const stepData = {
        name: 'Default Details Step',
        type: 'Question',
        duration: 45,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.details).toBeDefined();
      expect(typeof savedStep.details).toBe('object');
      expect(Object.keys(savedStep.details)).toHaveLength(0);
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeSave = new Date();
      
      const stepData = {
        name: 'Timestamp Step',
        type: 'Music',
        duration: 120,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      const afterSave = new Date();

      expect(savedStep.createdAt).toBeDefined();
      expect(savedStep.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedStep.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('Details Field Flexibility', () => {
    it('should handle various music step details', async () => {
      const musicDetails = {
        volume: 0.7,
        track: 'background.mp3',
        loop: true,
        fadeIn: 2,
        fadeOut: 3,
        genre: 'classical'
      };

      const stepData = {
        name: 'Complex Music Step',
        type: 'Music',
        duration: 180,
        details: musicDetails,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.details.volume).toBe(0.7);
      expect(savedStep.details.track).toBe('background.mp3');
      expect(savedStep.details.loop).toBe(true);
      expect(savedStep.details.fadeIn).toBe(2);
      expect(savedStep.details.fadeOut).toBe(3);
      expect(savedStep.details.genre).toBe('classical');
    });

    it('should handle various question step details', async () => {
      const questionDetails = {
        questionText: 'How are you feeling?',
        options: ['Good', 'Neutral', 'Bad'],
        multipleChoice: true,
        required: true,
        placeholder: 'Select your feeling...'
      };

      const stepData = {
        name: 'Feeling Question',
        type: 'Question',
        duration: 30,
        details: questionDetails,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.details.questionText).toBe('How are you feeling?');
      expect(savedStep.details.options).toEqual(['Good', 'Neutral', 'Bad']);
      expect(savedStep.details.multipleChoice).toBe(true);
      expect(savedStep.details.required).toBe(true);
      expect(savedStep.details.placeholder).toBe('Select your feeling...');
    });

    it('should handle various rest step details', async () => {
      const restDetails = {
        instructions: 'Please close your eyes and relax',
        backgroundColor: '#f0f0f0',
        showTimer: true,
        countdownType: 'visual'
      };

      const stepData = {
        name: 'Relaxation Rest',
        type: 'Rest',
        duration: 60,
        details: restDetails,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.details.instructions).toBe('Please close your eyes and relax');
      expect(savedStep.details.backgroundColor).toBe('#f0f0f0');
      expect(savedStep.details.showTimer).toBe(true);
      expect(savedStep.details.countdownType).toBe('visual');
    });

    it('should handle nested objects in details', async () => {
      const complexDetails = {
        config: {
          audio: {
            volume: 0.5,
            format: 'mp3'
          },
          visual: {
            theme: 'dark',
            animation: true
          }
        },
        metadata: {
          version: '1.0',
          author: 'researcher'
        }
      };

      const stepData = {
        name: 'Complex Details Step',
        type: 'Music',
        duration: 90,
        details: complexDetails,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.details.config.audio.volume).toBe(0.5);
      expect(savedStep.details.config.visual.theme).toBe('dark');
      expect(savedStep.details.metadata.version).toBe('1.0');
    });

    it('should handle arrays in details', async () => {
      const arrayDetails = {
        tracks: ['track1.mp3', 'track2.mp3', 'track3.mp3'],
        tags: ['relaxing', 'classical', 'background'],
        timestamps: [0, 30, 60, 90]
      };

      const stepData = {
        name: 'Array Details Step',
        type: 'Music',
        duration: 120,
        details: arrayDetails,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.details.tracks).toEqual(['track1.mp3', 'track2.mp3', 'track3.mp3']);
      expect(savedStep.details.tags).toEqual(['relaxing', 'classical', 'background']);
      expect(savedStep.details.timestamps).toEqual([0, 30, 60, 90]);
    });

    it('should handle null and undefined values in details', async () => {
      const nullDetails = {
        optionalField: null,
        undefinedField: undefined,
        emptyString: '',
        zeroValue: 0,
        falseValue: false
      };

      const stepData = {
        name: 'Null Details Step',
        type: 'Question',
        duration: 30,
        details: nullDetails,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.details.optionalField).toBeNull();
      expect(savedStep.details.undefinedField).toBeUndefined();
      expect(savedStep.details.emptyString).toBe('');
      expect(savedStep.details.zeroValue).toBe(0);
      expect(savedStep.details.falseValue).toBe(false);
    });
  });

  describe('Data Types and Validation', () => {
    it('should accept positive duration values', async () => {
      const durations = [1, 30, 60, 120, 300, 3600];

      for (const duration of durations) {
        const stepData = {
          name: `Duration ${duration} Step`,
          type: 'Rest',
          duration: duration,
          createdBy: testUser._id
        };

        const step = new Step(stepData);
        const savedStep = await step.save();

        expect(savedStep.duration).toBe(duration);
      }
    });

    it('should accept zero duration', async () => {
      const stepData = {
        name: 'Zero Duration Step',
        type: 'Rest',
        duration: 0,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.duration).toBe(0);
    });

    it('should accept negative duration values', async () => {
      const stepData = {
        name: 'Negative Duration Step',
        type: 'Rest',
        duration: -1,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.duration).toBe(-1);
    });

    it('should accept decimal duration values', async () => {
      const stepData = {
        name: 'Decimal Duration Step',
        type: 'Music',
        duration: 45.5,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.duration).toBe(45.5);
    });

    it('should handle very large duration values', async () => {
      const stepData = {
        name: 'Large Duration Step',
        type: 'Rest',
        duration: Number.MAX_SAFE_INTEGER,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.duration).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should validate ObjectId for createdBy field', async () => {
      const validStepData = {
        name: 'Valid ObjectId Step',
        type: 'Question',
        duration: 30,
        createdBy: new mongoose.Types.ObjectId()
      };

      const step = new Step(validStepData);
      const savedStep = await step.save();

      expect(savedStep.createdBy).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(savedStep.createdBy)).toBe(true);
    });

    it('should reject invalid ObjectId for createdBy field', async () => {
      const invalidStepData = {
        name: 'Invalid ObjectId Step',
        type: 'Question',
        duration: 30,
        createdBy: 'invalid_object_id'
      };

      const step = new Step(invalidStepData);
      
      await expect(step.save()).rejects.toThrow();
    });
  });

  describe('Reference Relationships', () => {
    it('should populate createdBy field correctly', async () => {
      // Create a fresh user for this test to ensure it exists
      const freshUser = await TestHelpers.createTestUser({ 
        username: `populate_user_${Date.now()}`, 
        role: 'researcher' 
      });
      
      const stepData = {
        name: 'Populate Test Step',
        type: 'Music',
        duration: 60,
        createdBy: freshUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      // Verify the step was saved with correct reference
      expect(savedStep.createdBy.toString()).toBe(freshUser._id.toString());

      // Now test population
      const populatedStep = await Step.findById(savedStep._id).populate('createdBy');

      expect(populatedStep).toBeDefined();
      expect(populatedStep.createdBy).toBeDefined();
      expect(populatedStep.createdBy).not.toBeNull();
      expect(populatedStep.createdBy.username).toBe(freshUser.username);
      expect(populatedStep.createdBy.role).toBe(freshUser.role);
      expect(populatedStep.createdBy._id.toString()).toBe(freshUser._id.toString());
    });

    it('should handle non-existent user reference', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      
      const stepData = {
        name: 'Non-existent User Step',
        type: 'Rest',
        duration: 30,
        createdBy: nonExistentUserId
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      const populatedStep = await Step.findById(savedStep._id).populate('createdBy');

      expect(populatedStep.createdBy).toBeNull();
    });
  });

  describe('Querying and Indexing', () => {
    let musicStep, questionStep, restStep;

    beforeEach(async () => {
      musicStep = await TestHelpers.createTestStep({
        name: 'Query Music Step',
        type: 'Music',
        duration: 120
      }, testUser._id);

      questionStep = await TestHelpers.createTestStep({
        name: 'Query Question Step',
        type: 'Question',
        duration: 30
      }, testUser._id);

      restStep = await TestHelpers.createTestStep({
        name: 'Query Rest Step',
        type: 'Rest',
        duration: 60
      }, testUser._id);
    });

    it('should find steps by type', async () => {
      const musicSteps = await Step.find({ type: 'Music' });
      const questionSteps = await Step.find({ type: 'Question' });
      const restSteps = await Step.find({ type: 'Rest' });

      expect(musicSteps.length).toBeGreaterThanOrEqual(1);
      expect(questionSteps.length).toBeGreaterThanOrEqual(1);
      expect(restSteps.length).toBeGreaterThanOrEqual(1);

      expect(musicSteps.every(step => step.type === 'Music')).toBe(true);
      expect(questionSteps.every(step => step.type === 'Question')).toBe(true);
      expect(restSteps.every(step => step.type === 'Rest')).toBe(true);
    });

    it('should find steps by duration range', async () => {
      const shortSteps = await Step.find({ duration: { $lte: 60 } });
      const longSteps = await Step.find({ duration: { $gt: 60 } });

      expect(shortSteps.length).toBeGreaterThanOrEqual(2); // question and rest
      expect(longSteps.length).toBeGreaterThanOrEqual(1); // music

      expect(shortSteps.every(step => step.duration <= 60)).toBe(true);
      expect(longSteps.every(step => step.duration > 60)).toBe(true);
    });

    it('should find steps by creator', async () => {
      const userSteps = await Step.find({ createdBy: testUser._id });

      expect(userSteps.length).toBeGreaterThanOrEqual(3);
      expect(userSteps.every(step => step.createdBy.toString() === testUser._id.toString())).toBe(true);
    });

    it('should sort steps by creation date', async () => {
      const stepsByDate = await Step.find({ createdBy: testUser._id }).sort({ createdAt: -1 });

      expect(stepsByDate.length).toBeGreaterThanOrEqual(3);
      
      for (let i = 1; i < stepsByDate.length; i++) {
        expect(stepsByDate[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          stepsByDate[i].createdAt.getTime()
        );
      }
    });

    it('should search steps by name pattern', async () => {
      const querySteps = await Step.find({ 
        name: { $regex: /query/i } 
      });

      expect(querySteps.length).toBeGreaterThanOrEqual(3);
      expect(querySteps.every(step => step.name.toLowerCase().includes('query'))).toBe(true);
    });
  });

  describe('Model Methods and Virtuals', () => {
    it('should convert to JSON correctly', async () => {
      const stepData = {
        name: 'JSON Test Step',
        type: 'Music',
        duration: 90,
        details: { volume: 0.8 },
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      const jsonStep = savedStep.toJSON();

      expect(jsonStep).toHaveProperty('_id');
      expect(jsonStep).toHaveProperty('name', 'JSON Test Step');
      expect(jsonStep).toHaveProperty('type', 'Music');
      expect(jsonStep).toHaveProperty('duration', 90);
      expect(jsonStep).toHaveProperty('details');
      expect(jsonStep.details).toHaveProperty('volume', 0.8);
      expect(jsonStep).toHaveProperty('createdBy');
      expect(jsonStep).toHaveProperty('createdAt');
    });

    it('should convert to Object correctly', async () => {
      const stepData = {
        name: 'Object Test Step',
        type: 'Question',
        duration: 45,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      const objectStep = savedStep.toObject();

      expect(objectStep).toHaveProperty('_id');
      expect(objectStep).toHaveProperty('name', 'Object Test Step');
      expect(objectStep).toHaveProperty('type', 'Question');
      expect(objectStep).toHaveProperty('duration', 45);
      expect(objectStep).toHaveProperty('createdBy');
      expect(objectStep).toHaveProperty('createdAt');
    });
  });

  describe('Error Handling', () => {
    it('should handle mongoose validation errors properly', async () => {
      const invalidStep = new Step({
        // Missing required fields
        details: { test: 'value' }
      });

      try {
        await invalidStep.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.name).toBeDefined();
        expect(error.errors.type).toBeDefined();
        expect(error.errors.duration).toBeDefined();
      }
    });

    it('should handle duplicate key errors if unique constraints exist', async () => {
      // Note: The current schema doesn't have unique constraints,
      // but this test demonstrates how to handle them if added
      const stepData1 = {
        name: 'Duplicate Test Step',
        type: 'Rest',
        duration: 30,
        createdBy: testUser._id
      };

      const stepData2 = {
        name: 'Duplicate Test Step',
        type: 'Rest',
        duration: 30,
        createdBy: testUser._id
      };

      const step1 = new Step(stepData1);
      const step2 = new Step(stepData2);

      await step1.save();
      
      // This should succeed since no unique constraints on name
      const savedStep2 = await step2.save();
      expect(savedStep2).toBeDefined();
    });

    it('should handle very long strings', async () => {
      const longName = 'A'.repeat(1000);
      
      const stepData = {
        name: longName,
        type: 'Music',
        duration: 60,
        createdBy: testUser._id
      };

      const step = new Step(stepData);
      const savedStep = await step.save();

      expect(savedStep.name).toBe(longName);
      expect(savedStep.name.length).toBe(1000);
    });
  });
});