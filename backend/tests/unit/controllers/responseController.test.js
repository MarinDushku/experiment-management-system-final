const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const responseController = require('../../../controllers/responseController');
const Response = require('../../../models/Response');
const TestHelpers = require('../../utils/testHelpers');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  const mockAuth = (role = 'user') => (req, res, next) => {
    req.user = { 
      id: new mongoose.Types.ObjectId().toString(), 
      role: role 
    };
    next();
  };

  // Routes
  app.post('/responses', mockAuth('user'), responseController.createResponse);
  app.get('/responses/experiment', mockAuth('researcher'), responseController.getResponsesByExperiment);

  return app;
};

describe('Response Controller', () => {
  let app;
  let testUser, testExperiment, testStep;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test user, experiment, and step
    testUser = await TestHelpers.createTestUser({
      username: 'responseuser',
      role: 'user'
    });

    testExperiment = await TestHelpers.createTestExperiment({
      name: 'Response Test Experiment'
    }, testUser._id);

    testStep = await TestHelpers.createTestStep({
      name: 'Response Test Step',
      type: 'Question'
    }, testUser._id);
  });

  describe('POST /responses (createResponse)', () => {
    it('should create response with all required fields', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Test response answer',
        timestamp: new Date().toISOString(),
        timeSinceStart: 15000,
        trialIndex: 0,
        stepIndex: 0
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.experimentId).toBe(responseData.experimentId);
      expect(response.body.data.experimentName).toBe('Response Test Experiment');
      expect(response.body.data.stepId).toBe(responseData.stepId);
      expect(response.body.data.response).toBe('Test response answer');
      expect(response.body.data.timeSinceStart).toBe(15000);
      expect(response.body.data.trialIndex).toBe(0);
      expect(response.body.data.stepIndex).toBe(0);
    });

    it('should create response with only required fields', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Minimal response',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.experimentId).toBe(responseData.experimentId);
      expect(response.body.data.experimentName).toBe('Response Test Experiment');
      expect(response.body.data.stepId).toBe(responseData.stepId);
      expect(response.body.data.response).toBe('Minimal response');
      
      // Optional fields should be undefined/null
      expect(response.body.data.timeSinceStart).toBeDefined(); // May be undefined
      expect(response.body.data.trialIndex).toBeDefined(); // May be undefined
      expect(response.body.data.stepIndex).toBeDefined(); // May be undefined
    });

    it('should handle timestamp conversion correctly', async () => {
      const testTimestamp = '2023-10-15T14:30:00.000Z';
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Timestamp test response',
        timestamp: testTimestamp
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(new Date(response.body.data.timestamp).toISOString()).toBe(testTimestamp);
    });

    it('should validate missing experimentId', async () => {
      const responseData = {
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Test response',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should validate missing experimentName', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        stepId: testStep._id.toString(),
        response: 'Test response',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should validate missing stepId', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        response: 'Test response',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should validate missing response', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should validate missing timestamp', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Test response'
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should validate empty string values', async () => {
      const responseData = {
        experimentId: '',
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Test response',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should handle null values', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: null,
        stepId: testStep._id.toString(),
        response: 'Test response',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should handle various response data types', async () => {
      const responseTypes = [
        'Simple text response',
        '42',
        'true',
        JSON.stringify({ answer: 'A', confidence: 8 }),
        'Multi-line\nresponse\nwith\nbreaks'
      ];

      for (const responseText of responseTypes) {
        const responseData = {
          experimentId: testExperiment._id.toString(),
          experimentName: 'Response Test Experiment',
          stepId: testStep._id.toString(),
          response: responseText,
          timestamp: new Date().toISOString()
        };

        const response = await request(app)
          .post('/responses')
          .send(responseData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.response).toBe(responseText);
      }
    });

    it('should handle numeric values for optional fields', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Numeric fields test',
        timestamp: new Date().toISOString(),
        timeSinceStart: 0, // Zero is valid
        trialIndex: 5,
        stepIndex: 10
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeSinceStart).toBe(0);
      expect(response.body.data.trialIndex).toBe(5);
      expect(response.body.data.stepIndex).toBe(10);
    });

    it('should handle negative values for optional fields', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Negative fields test',
        timestamp: new Date().toISOString(),
        timeSinceStart: -1,
        trialIndex: -1,
        stepIndex: -1
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeSinceStart).toBe(-1);
      expect(response.body.data.trialIndex).toBe(-1);
      expect(response.body.data.stepIndex).toBe(-1);
    });

    it('should handle database errors', async () => {
      jest.spyOn(Response.prototype, 'save').mockRejectedValueOnce(new Error('Database connection failed'));

      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Error test response',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
      expect(response.body.error).toContain('Database connection failed');

      Response.prototype.save.mockRestore();
    });

    it('should handle invalid timestamp format', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Invalid timestamp test',
        timestamp: 'invalid-date'
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /responses/experiment (getResponsesByExperiment)', () => {
    let testResponses;

    beforeEach(async () => {
      // Create test responses
      testResponses = [];
      
      const baseResponse1 = {
        experimentId: testExperiment._id,
        experimentName: 'Response Test Experiment',
        stepId: testStep._id,
        response: 'First response',
        timestamp: new Date('2023-10-15T10:00:00Z'),
        timeSinceStart: 5000,
        trialIndex: 0,
        stepIndex: 0
      };

      const baseResponse2 = {
        experimentId: testExperiment._id,
        experimentName: 'Response Test Experiment',
        stepId: testStep._id,
        response: 'Second response',
        timestamp: new Date('2023-10-15T10:05:00Z'),
        timeSinceStart: 10000,
        trialIndex: 0,
        stepIndex: 1
      };

      testResponses.push(await TestHelpers.createTestResponse(baseResponse1));
      testResponses.push(await TestHelpers.createTestResponse(baseResponse2));
    });

    it('should get responses by experimentId', async () => {
      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentId: testExperiment._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].response).toBe('First response');
      expect(response.body.data[1].response).toBe('Second response');
      
      // Should be sorted by timestamp
      expect(new Date(response.body.data[0].timestamp).getTime())
        .toBeLessThan(new Date(response.body.data[1].timestamp).getTime());
    });

    it('should get responses by experimentName', async () => {
      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentName: 'Response Test Experiment' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].experimentName).toBe('Response Test Experiment');
      expect(response.body.data[1].experimentName).toBe('Response Test Experiment');
    });

    it('should get responses by both experimentId and experimentName', async () => {
      const response = await request(app)
        .get('/responses/experiment')
        .query({ 
          experimentId: testExperiment._id.toString(),
          experimentName: 'Response Test Experiment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array for non-existent experiment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentId: nonExistentId.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return empty array for non-existent experiment name', async () => {
      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentName: 'Non-existent Experiment' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should require either experimentId or experimentName', async () => {
      const response = await request(app)
        .get('/responses/experiment')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Must provide experimentId or experimentName');
    });

    it('should handle empty query parameters', async () => {
      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentId: '', experimentName: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Must provide experimentId or experimentName');
    });

    it('should sort responses by timestamp in ascending order', async () => {
      // Create additional response with earlier timestamp
      const earlierResponse = {
        experimentId: testExperiment._id,
        experimentName: 'Response Test Experiment',
        stepId: testStep._id,
        response: 'Earlier response',
        timestamp: new Date('2023-10-15T09:00:00Z'),
        timeSinceStart: 1000,
        trialIndex: 0,
        stepIndex: 0
      };

      await TestHelpers.createTestResponse(earlierResponse);

      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentId: testExperiment._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].response).toBe('Earlier response');
      expect(response.body.data[1].response).toBe('First response');
      expect(response.body.data[2].response).toBe('Second response');
    });

    it('should handle database errors', async () => {
      jest.spyOn(Response, 'find').mockReturnValueOnce({
        sort: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      });

      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentId: testExperiment._id.toString() })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');

      Response.find.mockRestore();
    });

    it('should filter correctly with partial experiment name match', async () => {
      // Create response with different experiment name
      const differentExperimentResponse = {
        experimentId: new mongoose.Types.ObjectId(),
        experimentName: 'Different Experiment',
        stepId: testStep._id,
        response: 'Different experiment response',
        timestamp: new Date(),
        timeSinceStart: 2000
      };

      await TestHelpers.createTestResponse(differentExperimentResponse);

      const response = await request(app)
        .get('/responses/experiment')
        .query({ experimentName: 'Response Test Experiment' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(r => r.experimentName === 'Response Test Experiment')).toBe(true);
    });

    it('should handle mixed query parameters correctly', async () => {
      // Test with experimentId that doesn't match experimentName
      const differentExperimentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get('/responses/experiment')
        .query({ 
          experimentId: differentExperimentId.toString(),
          experimentName: 'Response Test Experiment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // No matches should be found
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large response text', async () => {
      const largeResponse = 'A'.repeat(10000); // 10KB response
      
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: largeResponse,
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe(largeResponse);
    });

    it('should handle special characters in response', async () => {
      const specialCharsResponse = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~€£¥₹';
      
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: specialCharsResponse,
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe(specialCharsResponse);
    });

    it('should handle unicode characters in response', async () => {
      const unicodeResponse = '🚀 Hello 世界 🌍 Привет мир 🎉';
      
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: unicodeResponse,
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe(unicodeResponse);
    });

    it('should handle extremely large numeric values', async () => {
      const responseData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Response Test Experiment',
        stepId: testStep._id.toString(),
        response: 'Large numbers test',
        timestamp: new Date().toISOString(),
        timeSinceStart: Number.MAX_SAFE_INTEGER,
        trialIndex: 999999,
        stepIndex: 999999
      };

      const response = await request(app)
        .post('/responses')
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeSinceStart).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});