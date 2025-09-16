const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('../../config/db');
const TestHelpers = require('../utils/testHelpers');

// Import routes
const authRoutes = require('../../routes/auth');
const userRoutes = require('../../routes/users');
const stepRoutes = require('../../routes/steps');
const trialRoutes = require('../../routes/trials');
const experimentRoutes = require('../../routes/experiments');
const responseRoutes = require('../../routes/responses');

// Create test app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/steps', stepRoutes);
  app.use('/api/trials', trialRoutes);
  app.use('/api/experiments', experimentRoutes);
  app.use('/api/responses', responseRoutes);
  
  // Error handling
  app.use((err, req, res, next) => {
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ message: 'Invalid JSON' });
    }
    
    // Handle other errors
    res.status(err.status || 500).json({ 
      message: err.message || 'Server error' 
    });
  });
  
  return app;
};

describe('API Integration Tests', () => {
  let app;
  let adminUser, researcherUser, regularUser;
  let adminToken, researcherToken, userToken;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test users
    adminUser = await TestHelpers.createTestAdmin({
      username: 'integrationadmin',
      password: 'password123'
    });
    
    researcherUser = await TestHelpers.createTestResearcher({
      username: 'integrationresearcher',
      password: 'password123'
    });
    
    regularUser = await TestHelpers.createTestUser({
      username: 'integrationuser',
      password: 'password123'
    });
    
    // Generate tokens
    adminToken = global.testUtils.generateToken({
      id: adminUser._id.toString(),
      role: 'admin'
    });
    
    researcherToken = global.testUtils.generateToken({
      id: researcherUser._id.toString(),
      role: 'researcher'
    });
    
    userToken = global.testUtils.generateToken({
      id: regularUser._id.toString(),
      role: 'user'
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      const newUserData = {
        username: 'newintegrationuser',
        password: 'newpassword123'
      };

      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newUserData)
        .expect(201);

      expect(registerResponse.body.message).toContain('registered successfully');

      // 2. Login with new user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(newUserData)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.username).toBe('newintegrationuser');

      // 3. Access protected route
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(meResponse.body.username).toBe('newintegrationuser');
    });

    it('should handle login with incorrect credentials', async () => {
      const invalidCredentials = {
        username: 'integrationuser',
        password: 'wrongpassword'
      };

      await request(app)
        .post('/api/auth/login')
        .send(invalidCredentials)
        .expect(401);
    });
  });

  describe('Step Management Workflow', () => {
    it('should complete full step CRUD workflow', async () => {
      // 1. Create a music step
      const musicStepData = {
        name: 'Integration Music Step',
        type: 'Music',
        duration: 60,
        details: JSON.stringify({ volume: 0.8 })
      };

      const createResponse = await request(app)
        .post('/api/steps')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(musicStepData)
        .expect(201);

      const stepId = createResponse.body._id;
      expect(createResponse.body.name).toBe('Integration Music Step');

      // 2. Get all steps
      const getAllResponse = await request(app)
        .get('/api/steps')
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(getAllResponse.body.length).toBeGreaterThanOrEqual(1);
      expect(getAllResponse.body.some(step => step._id === stepId)).toBe(true);

      // 3. Get specific step
      const getOneResponse = await request(app)
        .get(`/api/steps/${stepId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(getOneResponse.body._id).toBe(stepId);
      expect(getOneResponse.body.name).toBe('Integration Music Step');

      // 4. Update step
      const updateData = {
        name: 'Updated Integration Music Step',
        duration: 90
      };

      const updateResponse = await request(app)
        .put(`/api/steps/${stepId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Integration Music Step');
      expect(updateResponse.body.duration).toBe(90);

      // 5. Delete step
      await request(app)
        .delete(`/api/steps/${stepId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      // 6. Verify deletion
      await request(app)
        .get(`/api/steps/${stepId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(404);
    });

    it('should enforce authorization for step operations', async () => {
      // Create step as researcher
      const stepData = {
        name: 'Authorization Test Step',
        type: 'Rest',
        duration: 30
      };

      const createResponse = await request(app)
        .post('/api/steps')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(stepData)
        .expect(201);

      const stepId = createResponse.body._id;

      // Try to access as regular user (should fail)
      await request(app)
        .get(`/api/steps/${stepId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // Try to update as regular user (should fail)
      await request(app)
        .put(`/api/steps/${stepId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      // Admin should have access
      await request(app)
        .get(`/api/steps/${stepId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Trial Management Workflow', () => {
    let testStep1, testStep2;

    beforeEach(async () => {
      testStep1 = await TestHelpers.createTestStep({
        name: 'Trial Step 1',
        type: 'Music'
      }, researcherUser._id);

      testStep2 = await TestHelpers.createTestStep({
        name: 'Trial Step 2',
        type: 'Question'
      }, researcherUser._id);
    });

    it('should complete full trial workflow with steps', async () => {
      // 1. Create trial with steps
      const trialData = {
        name: 'Integration Trial',
        description: 'A trial for integration testing',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: testStep2._id, order: 2 }
        ]
      };

      const createResponse = await request(app)
        .post('/api/trials')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(trialData)
        .expect(201);

      const trialId = createResponse.body._id;
      expect(createResponse.body.steps).toHaveLength(2);

      // 2. Get trial with populated steps
      const getResponse = await request(app)
        .get(`/api/trials/${trialId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(getResponse.body.steps).toHaveLength(2);
      expect(getResponse.body.steps[0].step.name).toBe('Trial Step 1');
      expect(getResponse.body.steps[1].step.name).toBe('Trial Step 2');

      // 3. Update trial steps order
      const updateData = {
        steps: [
          { step: testStep2._id, order: 1 },
          { step: testStep1._id, order: 2 }
        ]
      };

      const updateResponse = await request(app)
        .put(`/api/trials/${trialId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.steps[0].step.toString()).toBe(testStep2._id.toString());
      expect(updateResponse.body.steps[1].step.toString()).toBe(testStep1._id.toString());
    });
  });

  describe('Experiment Management Workflow', () => {
    let testTrial;

    beforeEach(async () => {
      const testStep = await TestHelpers.createTestStep({}, researcherUser._id);
      testTrial = await TestHelpers.createTestTrial({
        name: 'Experiment Trial',
        steps: [{ step: testStep._id, order: 1 }]
      }, researcherUser._id);
    });

    it('should complete full experiment lifecycle', async () => {
      // 1. Create experiment
      const experimentData = {
        name: 'Integration Experiment',
        description: 'Full lifecycle test experiment',
        trials: [{ trial: testTrial._id, order: 1 }]
      };

      const createResponse = await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(experimentData)
        .expect(201);

      const experimentId = createResponse.body._id;
      expect(createResponse.body.status).toBe('Draft');

      // 2. Update experiment to Active status
      const updateResponse = await request(app)
        .put(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: 'Active' })
        .expect(200);

      expect(updateResponse.body.status).toBe('Active');

      // 3. Run experiment
      const runResponse = await request(app)
        .post(`/api/experiments/${experimentId}/run`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(runResponse.body.message).toContain('started successfully');

      // 4. Complete experiment
      await request(app)
        .put(`/api/experiments/${experimentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ status: 'Completed' })
        .expect(200);
    });

    it('should prevent running experiment without trials', async () => {
      // Create experiment without trials
      const experimentData = {
        name: 'Empty Experiment',
        description: 'Experiment without trials',
        trials: []
      };

      const createResponse = await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(experimentData)
        .expect(201);

      // Try to run empty experiment (should fail)
      await request(app)
        .post(`/api/experiments/${createResponse.body._id}/run`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(400);
    });
  });

  describe('Response Collection Workflow', () => {
    let testExperiment, testStep;

    beforeEach(async () => {
      testStep = await TestHelpers.createTestStep({
        type: 'Question'
      }, researcherUser._id);
      
      testExperiment = await TestHelpers.createTestExperiment({}, researcherUser._id);
    });

    it('should collect and retrieve experiment responses', async () => {
      // 1. Submit response
      const responseData = {
        experimentId: testExperiment._id,
        experimentName: testExperiment.name,
        stepId: testStep._id,
        response: 'Test response answer',
        timestamp: new Date().toISOString(),
        timeSinceStart: 15000,
        trialIndex: 0,
        stepIndex: 0
      };

      const submitResponse = await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(responseData)
        .expect(201);

      expect(submitResponse.body.response).toBe('Test response answer');

      // 2. Get responses for experiment
      const getResponse = await request(app)
        .get(`/api/responses/experiment/${testExperiment._id}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].response).toBe('Test response answer');

      // 3. Get all responses
      const getAllResponse = await request(app)
        .get('/api/responses')
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      expect(getAllResponse.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('User Management (Admin Only)', () => {
    it('should allow admin to manage users', async () => {
      // 1. Get all users (admin only)
      const getUsersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getUsersResponse.body.length).toBeGreaterThanOrEqual(3);

      // 2. Update user role
      const updateUserResponse = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'researcher' })
        .expect(200);

      expect(updateUserResponse.body.role).toBe('researcher');

      // 3. Delete user
      await request(app)
        .delete(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should prevent non-admin from accessing user management', async () => {
      // Regular user tries to access user management
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // Researcher tries to access user management
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(403);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid JSON payloads', async () => {
      await request(app)
        .post('/api/steps')
        .set('Authorization', `Bearer ${researcherToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing authorization headers', async () => {
      await request(app)
        .get('/api/steps')
        .expect(401);
    });

    it('should handle invalid authorization tokens', async () => {
      await request(app)
        .get('/api/steps')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should handle non-existent resource IDs', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/steps/${nonExistentId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(404);
    });

    it('should handle malformed MongoDB ObjectIDs', async () => {
      await request(app)
        .get('/api/steps/invalid_id')
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(500);
    });

    it('should validate required fields', async () => {
      // Try to create step without required fields
      const incompleteStepData = {
        name: 'Incomplete Step'
        // Missing type and duration
      };

      await request(app)
        .post('/api/steps')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(incompleteStepData)
        .expect(500);
    });
  });

  describe('Data Consistency and Relationships', () => {
    it('should maintain referential integrity between models', async () => {
      // Create step
      const step = await TestHelpers.createTestStep({}, researcherUser._id);
      
      // Create trial with step
      const trial = await TestHelpers.createTestTrial({
        steps: [{ step: step._id, order: 1 }]
      }, researcherUser._id);
      
      // Create experiment with trial
      const experiment = await TestHelpers.createTestExperiment({
        trials: [{ trial: trial._id, order: 1 }]
      }, researcherUser._id);

      // Get experiment with full population
      const response = await request(app)
        .get(`/api/experiments/${experiment._id}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      // Verify full relationship chain
      expect(response.body.trials).toHaveLength(1);
      expect(response.body.trials[0].trial.steps).toHaveLength(1);
      expect(response.body.trials[0].trial.steps[0].step.name).toBe(step.name);
    });

    it('should handle deletion of referenced resources', async () => {
      const step = await TestHelpers.createTestStep({}, researcherUser._id);
      
      // Delete step
      await request(app)
        .delete(`/api/steps/${step._id}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(200);

      // Try to create trial with deleted step (should handle gracefully)
      const trialData = {
        name: 'Trial with Deleted Step',
        steps: [{ step: step._id, order: 1 }]
      };

      // This should either fail validation or handle the missing reference
      const response = await request(app)
        .post('/api/trials')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(trialData);

      // Response should be either 400 (validation error) or 500 (server error)
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = [];
      
      // Create 10 concurrent step creation requests
      for (let i = 0; i < 10; i++) {
        const stepData = {
          name: `Concurrent Step ${i}`,
          type: 'Rest',
          duration: 10
        };
        
        const request = app
          .request()
          .post('/api/steps')
          .set('Authorization', `Bearer ${researcherToken}`)
          .send(stepData);
        
        concurrentRequests.push(request);
      }

      // Wait for all requests to complete
      const responses = await Promise.all(concurrentRequests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle large payloads efficiently', async () => {
      const largeDetails = {
        description: 'A'.repeat(10000), // 10KB string
        metadata: Array(1000).fill(0).map((_, i) => ({ id: i, value: `item_${i}` }))
      };

      const stepData = {
        name: 'Large Payload Step',
        type: 'Question',
        duration: 60,
        details: JSON.stringify(largeDetails)
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/steps')
        .set('Authorization', `Bearer ${researcherToken}`)
        .send(stepData)
        .expect(201);

      const responseTime = Date.now() - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(responseTime).toBeLessThan(5000);
      expect(response.body.name).toBe('Large Payload Step');
    });
  });
});