const mongoose = require('mongoose');
const Response = require('../../../models/Response');
const TestHelpers = require('../../utils/testHelpers');

describe('Response Model', () => {
  let testUser, testExperiment, testStep1, testStep2;

  beforeAll(async () => {
    testUser = await TestHelpers.createTestUser({
      username: 'responseuser',
      role: 'user'
    });

    // Create test steps
    testStep1 = await TestHelpers.createTestStep({
      name: 'Response Step 1',
      type: 'Question',
      duration: 30
    }, testUser._id);

    testStep2 = await TestHelpers.createTestStep({
      name: 'Response Step 2',
      type: 'Question',
      duration: 45
    }, testUser._id);

    // Create test experiment
    testExperiment = await TestHelpers.createTestExperiment({
      name: 'Response Test Experiment',
      description: 'Experiment for response testing'
    }, testUser._id);
  });

  describe('Schema Validation', () => {
    it('should create response with valid data', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Response Test Experiment',
        stepId: testStep1._id,
        response: 'Test response answer',
        timestamp: new Date('2023-10-15T14:30:00Z'),
        timeSinceStart: 15000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.experimentId.toString()).toBe(testExperiment._id.toString());
      expect(savedResponse.experimentName).toBe('Response Test Experiment');
      expect(savedResponse.stepId.toString()).toBe(testStep1._id.toString());
      expect(savedResponse.response).toBe('Test response answer');
      expect(savedResponse.timestamp.toISOString()).toBe('2023-10-15T14:30:00.000Z');
      expect(savedResponse.timeSinceStart).toBe(15000);
      expect(savedResponse.trialIndex).toBe(0);
      expect(savedResponse.stepIndex).toBe(0);
      expect(savedResponse._id).toBeDefined();
      expect(savedResponse.createdAt).toBeDefined();
    });

    it('should require experimentId field', async () => {
      const responseData = {
        experimentName: 'Test Experiment',
        stepId: testStep1._id,
        response: 'Test response',
        timestamp: new Date(),
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          experimentId: expect.any(Object)
        })
      });
    });

    it('should require experimentName field', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        stepId: testStep1._id,
        response: 'Test response',
        timestamp: new Date(),
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          experimentName: expect.any(Object)
        })
      });
    });

    it('should require stepId field', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Test Experiment',
        response: 'Test response',
        timestamp: new Date(),
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          stepId: expect.any(Object)
        })
      });
    });

    it('should require response field', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Test Experiment',
        stepId: testStep1._id,
        timestamp: new Date(),
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          response: expect.any(Object)
        })
      });
    });

    it('should require timestamp field', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Test Experiment',
        stepId: testStep1._id,
        response: 'Test response',
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          timestamp: expect.any(Object)
        })
      });
    });

    it('should require timeSinceStart field', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Test Experiment',
        stepId: testStep1._id,
        response: 'Test response',
        timestamp: new Date(),
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          timeSinceStart: expect.any(Object)
        })
      });
    });

    it('should require trialIndex field', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Test Experiment',
        stepId: testStep1._id,
        response: 'Test response',
        timestamp: new Date(),
        timeSinceStart: 5000,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          trialIndex: expect.any(Object)
        })
      });
    });

    it('should require stepIndex field', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Test Experiment',
        stepId: testStep1._id,
        response: 'Test response',
        timestamp: new Date(),
        timeSinceStart: 5000,
        trialIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
      await expect(response.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          stepIndex: expect.any(Object)
        })
      });
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeSave = new Date();
      
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Timestamp Test',
        stepId: testStep1._id,
        response: 'Timestamp response',
        timestamp: new Date(),
        timeSinceStart: 10000,
        trialIndex: 1,
        stepIndex: 1
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const afterSave = new Date();

      expect(savedResponse.createdAt).toBeDefined();
      expect(savedResponse.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedResponse.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('Data Types and Validation', () => {
    it('should accept various response text types', async () => {
      const responseTexts = [
        'Simple text response',
        '42',
        'true',
        'false',
        JSON.stringify({ answer: 'A', confidence: 8 }),
        'Multi-line\nresponse\nwith\nbreaks',
        'Response with special chars: !@#$%^&*()',
        'Unicode response: 🚀 Hello 世界 🌍',
        ''  // Empty string
      ];

      for (const responseText of responseTexts) {
        const responseData = {
          experimentId: testExperiment._id,
          experimentName: 'Response Type Test',
          stepId: testStep1._id,
          response: responseText,
          timestamp: new Date(),
          timeSinceStart: 1000,
          trialIndex: 0,
          stepIndex: 0
        };

        const response = new Response(responseData);
        const savedResponse = await response.save();

        expect(savedResponse.response).toBe(responseText);
      }
    });

    it('should handle very long response text', async () => {
      const longResponse = 'A'.repeat(10000);
      
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Long Response Test',
        stepId: testStep1._id,
        response: longResponse,
        timestamp: new Date(),
        timeSinceStart: 2000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.response).toBe(longResponse);
      expect(savedResponse.response.length).toBe(10000);
    });

    it('should accept various timeSinceStart values', async () => {
      const timeValues = [0, 1, 1000, 60000, 3600000, -1, 1.5, Number.MAX_SAFE_INTEGER];

      for (const time of timeValues) {
        const responseData = {
          experimentId: testExperiment._id,
          experimentName: 'Time Test',
          stepId: testStep1._id,
          response: `Response at ${time}ms`,
          timestamp: new Date(),
          timeSinceStart: time,
          trialIndex: 0,
          stepIndex: 0
        };

        const response = new Response(responseData);
        const savedResponse = await response.save();

        expect(savedResponse.timeSinceStart).toBe(time);
      }
    });

    it('should accept various index values', async () => {
      const indexValues = [0, 1, 10, 100, -1, 1.5, Number.MAX_SAFE_INTEGER];

      for (const index of indexValues) {
        const responseData = {
          experimentId: testExperiment._id,
          experimentName: 'Index Test',
          stepId: testStep1._id,
          response: `Response with index ${index}`,
          timestamp: new Date(),
          timeSinceStart: 1000,
          trialIndex: index,
          stepIndex: index
        };

        const response = new Response(responseData);
        const savedResponse = await response.save();

        expect(savedResponse.trialIndex).toBe(index);
        expect(savedResponse.stepIndex).toBe(index);
      }
    });

    it('should handle various timestamp formats', async () => {
      const timestamps = [
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-12-31T23:59:59Z'),
        new Date(0), // Unix epoch
        new Date('1970-01-01T00:00:00Z'),
        new Date('2030-01-01T12:00:00Z'),
        new Date() // Current time
      ];

      for (const timestamp of timestamps) {
        const responseData = {
          experimentId: testExperiment._id,
          experimentName: 'Timestamp Format Test',
          stepId: testStep1._id,
          response: 'Timestamp test response',
          timestamp: timestamp,
          timeSinceStart: 1000,
          trialIndex: 0,
          stepIndex: 0
        };

        const response = new Response(responseData);
        const savedResponse = await response.save();

        expect(savedResponse.timestamp.getTime()).toBe(timestamp.getTime());
      }
    });

    it('should validate ObjectId for experimentId', async () => {
      const validResponseData = {
        experimentId: new mongoose.Types.ObjectId(),
        experimentName: 'Valid ObjectId Test',
        stepId: testStep1._id,
        response: 'Valid ObjectId response',
        timestamp: new Date(),
        timeSinceStart: 1000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(validResponseData);
      const savedResponse = await response.save();

      expect(savedResponse.experimentId).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(savedResponse.experimentId)).toBe(true);
    });

    it('should reject invalid ObjectId for experimentId', async () => {
      const invalidResponseData = {
        experimentId: 'invalid_object_id',
        experimentName: 'Invalid ObjectId Test',
        stepId: testStep1._id,
        response: 'Invalid ObjectId response',
        timestamp: new Date(),
        timeSinceStart: 1000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(invalidResponseData);
      
      await expect(response.save()).rejects.toThrow();
    });

    it('should validate ObjectId for stepId', async () => {
      const validResponseData = {
        experimentId: testExperiment._id,
        experimentName: 'Valid Step ObjectId Test',
        stepId: new mongoose.Types.ObjectId(),
        response: 'Valid step ObjectId response',
        timestamp: new Date(),
        timeSinceStart: 1000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(validResponseData);
      const savedResponse = await response.save();

      expect(savedResponse.stepId).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(savedResponse.stepId)).toBe(true);
    });

    it('should reject invalid ObjectId for stepId', async () => {
      const invalidResponseData = {
        experimentId: testExperiment._id,
        experimentName: 'Invalid Step ObjectId Test',
        stepId: 'invalid_step_id',
        response: 'Invalid step ObjectId response',
        timestamp: new Date(),
        timeSinceStart: 1000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(invalidResponseData);
      
      await expect(response.save()).rejects.toThrow();
    });
  });

  describe('Reference Relationships', () => {
    it('should populate experimentId reference correctly', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Populate Experiment Test',
        stepId: testStep1._id,
        response: 'Populate experiment response',
        timestamp: new Date(),
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const populatedResponse = await Response.findById(savedResponse._id).populate('experimentId');

      expect(populatedResponse.experimentId).toBeDefined();
      expect(populatedResponse.experimentId.name).toBe('Response Test Experiment');
      expect(populatedResponse.experimentId.description).toBe('Experiment for response testing');
    });

    it('should populate stepId reference correctly', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Populate Step Test',
        stepId: testStep1._id,
        response: 'Populate step response',
        timestamp: new Date(),
        timeSinceStart: 7000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const populatedResponse = await Response.findById(savedResponse._id).populate('stepId');

      expect(populatedResponse.stepId).toBeDefined();
      expect(populatedResponse.stepId.name).toBe('Response Step 1');
      expect(populatedResponse.stepId.type).toBe('Question');
      expect(populatedResponse.stepId.duration).toBe(30);
    });

    it('should populate multiple references correctly', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Multi Populate Test',
        stepId: testStep1._id,
        response: 'Multi populate response',
        timestamp: new Date(),
        timeSinceStart: 9000,
        trialIndex: 1,
        stepIndex: 2
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const populatedResponse = await Response.findById(savedResponse._id)
        .populate('experimentId')
        .populate('stepId');

      expect(populatedResponse.experimentId.name).toBe('Response Test Experiment');
      expect(populatedResponse.stepId.name).toBe('Response Step 1');
    });

    it('should handle non-existent experiment reference', async () => {
      const nonExistentExperimentId = new mongoose.Types.ObjectId();
      
      const responseData = {
        experimentId: nonExistentExperimentId,
        experimentName: 'Non-existent Experiment Test',
        stepId: testStep1._id,
        response: 'Non-existent experiment response',
        timestamp: new Date(),
        timeSinceStart: 3000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const populatedResponse = await Response.findById(savedResponse._id).populate('experimentId');

      expect(populatedResponse.experimentId).toBeNull();
    });

    it('should handle non-existent step reference', async () => {
      const nonExistentStepId = new mongoose.Types.ObjectId();
      
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Non-existent Step Test',
        stepId: nonExistentStepId,
        response: 'Non-existent step response',
        timestamp: new Date(),
        timeSinceStart: 4000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const populatedResponse = await Response.findById(savedResponse._id).populate('stepId');

      expect(populatedResponse.stepId).toBeNull();
    });
  });

  describe('Querying and Indexing', () => {
    let response1, response2, response3;

    beforeEach(async () => {
      response1 = await TestHelpers.createTestResponse({
        experimentId: testExperiment._id,
        experimentName: 'Query Test Experiment',
        stepId: testStep1._id,
        response: 'First response',
        timestamp: new Date('2023-10-15T10:00:00Z'),
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      });

      response2 = await TestHelpers.createTestResponse({
        experimentId: testExperiment._id,
        experimentName: 'Query Test Experiment',
        stepId: testStep2._id,
        response: 'Second response',
        timestamp: new Date('2023-10-15T10:05:00Z'),
        timeSinceStart: 10000,
        trialIndex: 0,
        stepIndex: 1
      });

      response3 = await TestHelpers.createTestResponse({
        experimentId: testExperiment._id,
        experimentName: 'Query Test Experiment',
        stepId: testStep1._id,
        response: 'Third response',
        timestamp: new Date('2023-10-15T10:10:00Z'),
        timeSinceStart: 15000,
        trialIndex: 1,
        stepIndex: 0
      });
    });

    it('should find responses by experimentId', async () => {
      const responses = await Response.find({ experimentId: testExperiment._id });

      expect(responses.length).toBeGreaterThanOrEqual(3);
      expect(responses.every(resp => resp.experimentId.toString() === testExperiment._id.toString())).toBe(true);
    });

    it('should find responses by experimentName', async () => {
      const responses = await Response.find({ experimentName: 'Query Test Experiment' });

      expect(responses.length).toBeGreaterThanOrEqual(3);
      expect(responses.every(resp => resp.experimentName === 'Query Test Experiment')).toBe(true);
    });

    it('should find responses by stepId', async () => {
      const step1Responses = await Response.find({ stepId: testStep1._id });
      const step2Responses = await Response.find({ stepId: testStep2._id });

      expect(step1Responses.length).toBeGreaterThanOrEqual(2); // response1 and response3
      expect(step2Responses.length).toBeGreaterThanOrEqual(1); // response2

      expect(step1Responses.every(resp => resp.stepId.toString() === testStep1._id.toString())).toBe(true);
      expect(step2Responses.every(resp => resp.stepId.toString() === testStep2._id.toString())).toBe(true);
    });

    it('should find responses by trialIndex', async () => {
      const trial0Responses = await Response.find({ trialIndex: 0 });
      const trial1Responses = await Response.find({ trialIndex: 1 });

      expect(trial0Responses.length).toBeGreaterThanOrEqual(2); // response1 and response2
      expect(trial1Responses.length).toBeGreaterThanOrEqual(1); // response3

      expect(trial0Responses.every(resp => resp.trialIndex === 0)).toBe(true);
      expect(trial1Responses.every(resp => resp.trialIndex === 1)).toBe(true);
    });

    it('should find responses by stepIndex', async () => {
      const step0Responses = await Response.find({ stepIndex: 0 });
      const step1Responses = await Response.find({ stepIndex: 1 });

      expect(step0Responses.length).toBeGreaterThanOrEqual(2); // response1 and response3
      expect(step1Responses.length).toBeGreaterThanOrEqual(1); // response2

      expect(step0Responses.every(resp => resp.stepIndex === 0)).toBe(true);
      expect(step1Responses.every(resp => resp.stepIndex === 1)).toBe(true);
    });

    it('should sort responses by timestamp', async () => {
      const responsesByTime = await Response.find({ experimentId: testExperiment._id }).sort({ timestamp: 1 });

      expect(responsesByTime.length).toBeGreaterThanOrEqual(3);
      
      for (let i = 1; i < responsesByTime.length; i++) {
        expect(responsesByTime[i - 1].timestamp.getTime()).toBeLessThanOrEqual(
          responsesByTime[i].timestamp.getTime()
        );
      }
    });

    it('should sort responses by timeSinceStart', async () => {
      const responsesByTimeSince = await Response.find({ experimentId: testExperiment._id }).sort({ timeSinceStart: 1 });

      expect(responsesByTimeSince.length).toBeGreaterThanOrEqual(3);
      
      for (let i = 1; i < responsesByTimeSince.length; i++) {
        expect(responsesByTimeSince[i - 1].timeSinceStart).toBeLessThanOrEqual(
          responsesByTimeSince[i].timeSinceStart
        );
      }
    });

    it('should find responses within time range', async () => {
      const startTime = new Date('2023-10-15T10:00:00Z');
      const endTime = new Date('2023-10-15T10:06:00Z');

      const responsesInRange = await Response.find({
        timestamp: { $gte: startTime, $lte: endTime }
      });

      expect(responsesInRange.length).toBeGreaterThanOrEqual(2); // response1 and response2
      expect(responsesInRange.every(resp => 
        resp.timestamp.getTime() >= startTime.getTime() && 
        resp.timestamp.getTime() <= endTime.getTime()
      )).toBe(true);
    });

    it('should find responses by timeSinceStart range', async () => {
      const responsesInTimeRange = await Response.find({
        timeSinceStart: { $gte: 7000, $lte: 12000 }
      });

      expect(responsesInTimeRange.length).toBeGreaterThanOrEqual(1); // response2
      expect(responsesInTimeRange.every(resp => 
        resp.timeSinceStart >= 7000 && resp.timeSinceStart <= 12000
      )).toBe(true);
    });

    it('should search responses by text content', async () => {
      const firstResponses = await Response.find({ 
        response: { $regex: /first/i } 
      });

      expect(firstResponses.length).toBeGreaterThanOrEqual(1);
      expect(firstResponses.every(resp => 
        resp.response.toLowerCase().includes('first')
      )).toBe(true);
    });
  });

  describe('Complex Queries and Aggregation', () => {
    beforeEach(async () => {
      // Create additional responses for complex querying
      await TestHelpers.createTestResponse({
        experimentId: testExperiment._id,
        experimentName: 'Complex Query Experiment',
        stepId: testStep1._id,
        response: 'Answer A',
        timestamp: new Date('2023-10-16T09:00:00Z'),
        timeSinceStart: 2000,
        trialIndex: 0,
        stepIndex: 0
      });

      await TestHelpers.createTestResponse({
        experimentId: testExperiment._id,
        experimentName: 'Complex Query Experiment',
        stepId: testStep1._id,
        response: 'Answer B',
        timestamp: new Date('2023-10-16T09:15:00Z'),
        timeSinceStart: 17000,
        trialIndex: 0,
        stepIndex: 1
      });

      await TestHelpers.createTestResponse({
        experimentId: testExperiment._id,
        experimentName: 'Complex Query Experiment',
        stepId: testStep2._id,
        response: 'Answer C',
        timestamp: new Date('2023-10-16T09:30:00Z'),
        timeSinceStart: 32000,
        trialIndex: 1,
        stepIndex: 0
      });
    });

    it('should aggregate response statistics', async () => {
      const stats = await Response.aggregate([
        { $match: { experimentId: testExperiment._id } },
        {
          $group: {
            _id: '$trialIndex',
            responseCount: { $sum: 1 },
            avgTimeSinceStart: { $avg: '$timeSinceStart' },
            minTimeSinceStart: { $min: '$timeSinceStart' },
            maxTimeSinceStart: { $max: '$timeSinceStart' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      expect(stats.length).toBeGreaterThan(0);
      expect(stats.every(stat => stat.responseCount > 0)).toBe(true);
      expect(stats.every(stat => stat.avgTimeSinceStart >= 0)).toBe(true);
    });

    it('should count responses by step', async () => {
      const stepCounts = await Response.aggregate([
        { $match: { experimentId: testExperiment._id } },
        {
          $group: {
            _id: '$stepId',
            count: { $sum: 1 }
          }
        }
      ]);

      expect(stepCounts.length).toBeGreaterThan(0);
      expect(stepCounts.every(count => count.count > 0)).toBe(true);
    });

    it('should find responses with specific criteria combination', async () => {
      const complexResponses = await Response.find({
        experimentId: testExperiment._id,
        trialIndex: 0,
        timeSinceStart: { $gte: 10000 }
      });

      expect(complexResponses.every(resp => 
        resp.experimentId.toString() === testExperiment._id.toString() &&
        resp.trialIndex === 0 &&
        resp.timeSinceStart >= 10000
      )).toBe(true);
    });

    it('should calculate response time intervals', async () => {
      const responses = await Response.find({ experimentId: testExperiment._id })
        .sort({ timestamp: 1 });

      if (responses.length >= 2) {
        const intervals = [];
        for (let i = 1; i < responses.length; i++) {
          const interval = responses[i].timestamp.getTime() - responses[i - 1].timestamp.getTime();
          intervals.push(interval);
        }

        expect(intervals.every(interval => interval >= 0)).toBe(true);
      }
    });
  });

  describe('Model Methods and Virtuals', () => {
    it('should convert to JSON correctly', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'JSON Test',
        stepId: testStep1._id,
        response: 'JSON conversion test response',
        timestamp: new Date('2023-10-15T12:00:00Z'),
        timeSinceStart: 12000,
        trialIndex: 2,
        stepIndex: 3
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const jsonResponse = savedResponse.toJSON();

      expect(jsonResponse).toHaveProperty('_id');
      expect(jsonResponse).toHaveProperty('experimentId');
      expect(jsonResponse).toHaveProperty('experimentName', 'JSON Test');
      expect(jsonResponse).toHaveProperty('stepId');
      expect(jsonResponse).toHaveProperty('response', 'JSON conversion test response');
      expect(jsonResponse).toHaveProperty('timestamp');
      expect(jsonResponse).toHaveProperty('timeSinceStart', 12000);
      expect(jsonResponse).toHaveProperty('trialIndex', 2);
      expect(jsonResponse).toHaveProperty('stepIndex', 3);
      expect(jsonResponse).toHaveProperty('createdAt');
    });

    it('should convert to Object correctly', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Object Test',
        stepId: testStep1._id,
        response: 'Object conversion test response',
        timestamp: new Date('2023-10-15T13:00:00Z'),
        timeSinceStart: 13000,
        trialIndex: 3,
        stepIndex: 4
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      const objectResponse = savedResponse.toObject();

      expect(objectResponse).toHaveProperty('_id');
      expect(objectResponse).toHaveProperty('experimentId');
      expect(objectResponse).toHaveProperty('experimentName', 'Object Test');
      expect(objectResponse).toHaveProperty('stepId');
      expect(objectResponse).toHaveProperty('response', 'Object conversion test response');
      expect(objectResponse).toHaveProperty('timestamp');
      expect(objectResponse).toHaveProperty('timeSinceStart', 13000);
      expect(objectResponse).toHaveProperty('trialIndex', 3);
      expect(objectResponse).toHaveProperty('stepIndex', 4);
      expect(objectResponse).toHaveProperty('createdAt');
    });
  });

  describe('Error Handling', () => {
    it('should handle mongoose validation errors properly', async () => {
      const invalidResponse = new Response({
        // Missing all required fields
        createdAt: new Date()
      });

      try {
        await invalidResponse.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.experimentId).toBeDefined();
        expect(error.errors.experimentName).toBeDefined();
        expect(error.errors.stepId).toBeDefined();
        expect(error.errors.response).toBeDefined();
        expect(error.errors.timestamp).toBeDefined();
        expect(error.errors.timeSinceStart).toBeDefined();
        expect(error.errors.trialIndex).toBeDefined();
        expect(error.errors.stepIndex).toBeDefined();
      }
    });

    it('should handle invalid date formats', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Invalid Date Test',
        stepId: testStep1._id,
        response: 'Invalid date response',
        timestamp: 'invalid-date',
        timeSinceStart: 1000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
    });

    it('should handle invalid number formats', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: 'Invalid Number Test',
        stepId: testStep1._id,
        response: 'Invalid number response',
        timestamp: new Date(),
        timeSinceStart: 'not-a-number',
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      await expect(response.save()).rejects.toThrow();
    });

    it('should handle edge case values', async () => {
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: '',  // Empty string
        stepId: testStep1._id,
        response: '',  // Empty response
        timestamp: new Date(0),  // Unix epoch
        timeSinceStart: 0,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = new Response(responseData);
      
      // Empty experimentName should fail validation
      await expect(response.save()).rejects.toThrow();
    });
  });
});