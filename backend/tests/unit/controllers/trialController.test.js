const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const trialController = require('../../../controllers/trialController');
const Trial = require('../../../models/Trial');
const Step = require('../../../models/Step');
const TestHelpers = require('../../utils/testHelpers');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  const mockAuth = (role = 'researcher') => (req, res, next) => {
    req.user = { 
      id: new mongoose.Types.ObjectId().toString(), 
      role: role 
    };
    next();
  };

  // Routes
  app.post('/trials', mockAuth('researcher'), trialController.createTrial);
  app.get('/trials', mockAuth('researcher'), trialController.getTrials);
  app.get('/trials/admin', mockAuth('admin'), trialController.getTrials);
  app.get('/trials/:id', mockAuth('researcher'), trialController.getTrialById);
  app.get('/trials/admin/:id', mockAuth('admin'), trialController.getTrialById);
  app.put('/trials/:id', mockAuth('researcher'), trialController.updateTrial);
  app.put('/trials/admin/:id', mockAuth('admin'), trialController.updateTrial);
  app.delete('/trials/:id', mockAuth('researcher'), trialController.deleteTrial);
  app.delete('/trials/admin/:id', mockAuth('admin'), trialController.deleteTrial);

  return app;
};

describe('Trial Controller', () => {
  let app;
  let testUser, adminUser, otherUser;
  let testStep1, testStep2;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test users
    testUser = await TestHelpers.createTestUser({
      username: 'trialuser',
      role: 'researcher'
    });
    
    adminUser = await TestHelpers.createTestUser({
      username: 'trialadmin',
      role: 'admin'
    });
    
    otherUser = await TestHelpers.createTestUser({
      username: 'othertrial',
      role: 'researcher'
    });
  });

  beforeEach(async () => {
    // Create test steps for each test
    testStep1 = await TestHelpers.createTestStep({
      name: 'Test Step 1',
      type: 'Music'
    }, testUser._id);

    testStep2 = await TestHelpers.createTestStep({
      name: 'Test Step 2',
      type: 'Question'
    }, testUser._id);
  });

  describe('POST /trials (createTrial)', () => {
    it('should create trial with valid data', async () => {
      const trialData = {
        name: 'Test Trial',
        description: 'A test trial',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: testStep2._id, order: 2 }
        ]
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(201);

      expect(response.body.name).toBe('Test Trial');
      expect(response.body.description).toBe('A test trial');
      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0].step.name).toBe('Test Step 1');
      expect(response.body.steps[1].step.name).toBe('Test Step 2');
      expect(response.body.createdBy).toBeDefined();
    });

    it('should create trial without steps', async () => {
      const trialData = {
        name: 'Empty Trial',
        description: 'Trial without steps'
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(201);

      expect(response.body.name).toBe('Empty Trial');
      expect(response.body.steps).toHaveLength(0);
    });

    it('should create trial with empty steps array', async () => {
      const trialData = {
        name: 'Empty Steps Trial',
        description: 'Trial with empty steps array',
        steps: []
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(201);

      expect(response.body.name).toBe('Empty Steps Trial');
      expect(response.body.steps).toHaveLength(0);
    });

    it('should validate step existence', async () => {
      const nonExistentStepId = new mongoose.Types.ObjectId();
      const trialData = {
        name: 'Invalid Trial',
        description: 'Trial with non-existent step',
        steps: [
          { step: nonExistentStepId, order: 1 }
        ]
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(400);

      expect(response.body.message).toContain('One or more steps not found');
    });

    it('should validate partial step existence', async () => {
      const nonExistentStepId = new mongoose.Types.ObjectId();
      const trialData = {
        name: 'Partially Invalid Trial',
        description: 'Trial with one valid and one invalid step',
        steps: [
          { step: testStep1._id, order: 1 },
          { step: nonExistentStepId, order: 2 }
        ]
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(400);

      expect(response.body.message).toContain('One or more steps not found');
    });

    it('should require name field', async () => {
      const trialData = {
        description: 'Trial without name',
        steps: []
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    it('should handle database errors', async () => {
      // Mock database error
      jest.spyOn(Trial.prototype, 'save').mockRejectedValueOnce(new Error('Database connection failed'));

      const trialData = {
        name: 'Error Trial',
        description: 'Trial that will cause database error'
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(500);

      expect(response.body.message).toBe('Server error');
      expect(response.body.error).toContain('Database connection failed');

      // Restore mock
      Trial.prototype.save.mockRestore();
    });
  });

  describe('GET /trials (getTrials)', () => {
    let userTrial, otherUserTrial;

    beforeEach(async () => {
      userTrial = await TestHelpers.createTestTrial({
        name: 'User Trial',
        steps: [{ step: testStep1._id, order: 1 }]
      }, testUser._id);

      otherUserTrial = await TestHelpers.createTestTrial({
        name: 'Other User Trial',
        steps: [{ step: testStep2._id, order: 1 }]
      }, otherUser._id);
    });

    it('should get user own trials only for non-admin', async () => {
      const response = await request(app)
        .get('/trials')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('User Trial');
      expect(response.body[0].steps[0].step.name).toBe('Test Step 1');
    });

    it('should get all trials for admin', async () => {
      const response = await request(app)
        .get('/trials/admin')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
      const trialNames = response.body.map(trial => trial.name);
      expect(trialNames).toContain('User Trial');
      expect(trialNames).toContain('Other User Trial');
    });

    it('should return trials sorted by creation date (newest first)', async () => {
      // Create another trial after a small delay
      await new Promise(resolve => setTimeout(resolve, 10));
      await TestHelpers.createTestTrial({
        name: 'Newer Trial'
      }, testUser._id);

      const response = await request(app)
        .get('/trials')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
      // Check that newer trial comes first
      const trialNames = response.body.map(trial => trial.name);
      expect(trialNames[0]).toBe('Newer Trial');
    });

    it('should handle database errors', async () => {
      jest.spyOn(Trial, 'find').mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      });

      const response = await request(app)
        .get('/trials')
        .expect(500);

      expect(response.body.message).toBe('Server error');

      Trial.find.mockRestore();
    });
  });

  describe('GET /trials/:id (getTrialById)', () => {
    let userTrial, otherUserTrial;

    beforeEach(async () => {
      userTrial = await TestHelpers.createTestTrial({
        name: 'User Specific Trial',
        steps: [{ step: testStep1._id, order: 1 }]
      }, testUser._id);

      otherUserTrial = await TestHelpers.createTestTrial({
        name: 'Other User Specific Trial'
      }, otherUser._id);
    });

    it('should get own trial successfully', async () => {
      const response = await request(app)
        .get(`/trials/${userTrial._id}`)
        .expect(200);

      expect(response.body._id).toBe(userTrial._id.toString());
      expect(response.body.name).toBe('User Specific Trial');
      expect(response.body.steps[0].step.name).toBe('Test Step 1');
    });

    it('should allow admin to access any trial', async () => {
      const response = await request(app)
        .get(`/trials/admin/${otherUserTrial._id}`)
        .expect(200);

      expect(response.body._id).toBe(otherUserTrial._id.toString());
      expect(response.body.name).toBe('Other User Specific Trial');
    });

    it('should deny access to other user trial', async () => {
      const response = await request(app)
        .get(`/trials/${otherUserTrial._id}`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to access this trial');
    });

    it('should return 404 for non-existent trial', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/trials/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('Trial not found');
    });

    it('should handle invalid ObjectId', async () => {
      const response = await request(app)
        .get('/trials/invalid_id')
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    it('should handle database errors', async () => {
      jest.spyOn(Trial, 'findById').mockReturnValueOnce({
        populate: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      });

      const response = await request(app)
        .get(`/trials/${userTrial._id}`)
        .expect(500);

      expect(response.body.message).toBe('Server error');

      Trial.findById.mockRestore();
    });
  });

  describe('PUT /trials/:id (updateTrial)', () => {
    let userTrial, otherUserTrial;

    beforeEach(async () => {
      userTrial = await TestHelpers.createTestTrial({
        name: 'Original Trial',
        description: 'Original description',
        steps: [{ step: testStep1._id, order: 1 }]
      }, testUser._id);

      otherUserTrial = await TestHelpers.createTestTrial({
        name: 'Other Original Trial'
      }, otherUser._id);
    });

    it('should update own trial successfully', async () => {
      const updateData = {
        name: 'Updated Trial',
        description: 'Updated description',
        steps: [
          { step: testStep2._id, order: 1 },
          { step: testStep1._id, order: 2 }
        ]
      };

      const response = await request(app)
        .put(`/trials/${userTrial._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Trial');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0].step.name).toBe('Test Step 2');
      expect(response.body.steps[1].step.name).toBe('Test Step 1');
    });

    it('should allow admin to update any trial', async () => {
      const updateData = {
        name: 'Admin Updated Trial',
        description: 'Updated by admin',
        steps: []
      };

      const response = await request(app)
        .put(`/trials/admin/${otherUserTrial._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Admin Updated Trial');
      expect(response.body.description).toBe('Updated by admin');
      expect(response.body.steps).toHaveLength(0);
    });

    it('should deny update access to other user trial', async () => {
      const updateData = {
        name: 'Unauthorized Update',
        description: 'This should fail'
      };

      const response = await request(app)
        .put(`/trials/${otherUserTrial._id}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to update this trial');
    });

    it('should validate step existence on update', async () => {
      const nonExistentStepId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated Trial',
        description: 'Updated description',
        steps: [
          { step: nonExistentStepId, order: 1 }
        ]
      };

      const response = await request(app)
        .put(`/trials/${userTrial._id}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('One or more steps not found');
    });

    it('should handle empty steps array on update', async () => {
      const updateData = {
        name: 'Updated Trial',
        description: 'Updated description',
        steps: []
      };

      const response = await request(app)
        .put(`/trials/${userTrial._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.steps).toHaveLength(0);
    });

    it('should return 404 for non-existent trial', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated Trial',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/trials/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Trial not found');
    });

    it('should handle database errors', async () => {
      jest.spyOn(Trial, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const updateData = {
        name: 'Updated Trial',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/trials/${userTrial._id}`)
        .send(updateData)
        .expect(500);

      expect(response.body.message).toBe('Server error');

      Trial.findById.mockRestore();
    });
  });

  describe('DELETE /trials/:id (deleteTrial)', () => {
    let userTrial, otherUserTrial;

    beforeEach(async () => {
      userTrial = await TestHelpers.createTestTrial({
        name: 'Trial to Delete'
      }, testUser._id);

      otherUserTrial = await TestHelpers.createTestTrial({
        name: 'Other Trial to Delete'
      }, otherUser._id);
    });

    it('should delete own trial successfully', async () => {
      const response = await request(app)
        .delete(`/trials/${userTrial._id}`)
        .expect(200);

      expect(response.body.message).toBe('Trial removed');

      // Verify trial is deleted
      const deletedTrial = await Trial.findById(userTrial._id);
      expect(deletedTrial).toBeNull();
    });

    it('should allow admin to delete any trial', async () => {
      const response = await request(app)
        .delete(`/trials/admin/${otherUserTrial._id}`)
        .expect(200);

      expect(response.body.message).toBe('Trial removed');

      // Verify trial is deleted
      const deletedTrial = await Trial.findById(otherUserTrial._id);
      expect(deletedTrial).toBeNull();
    });

    it('should deny delete access to other user trial', async () => {
      const response = await request(app)
        .delete(`/trials/${otherUserTrial._id}`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to delete this trial');

      // Verify trial is not deleted
      const existingTrial = await Trial.findById(otherUserTrial._id);
      expect(existingTrial).toBeTruthy();
    });

    it('should return 404 for non-existent trial', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/trials/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('Trial not found');
    });

    it('should handle invalid ObjectId', async () => {
      const response = await request(app)
        .delete('/trials/invalid_id')
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    it('should handle database errors', async () => {
      jest.spyOn(Trial, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete(`/trials/${userTrial._id}`)
        .expect(500);

      expect(response.body.message).toBe('Server error');

      Trial.findById.mockRestore();
    });
  });

  describe('Authorization and Edge Cases', () => {
    it('should handle missing user in request', async () => {
      const app = express();
      app.use(express.json());
      app.post('/trials', trialController.createTrial);

      const response = await request(app)
        .post('/trials')
        .send({ name: 'Test Trial' })
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    it('should handle step validation with mixed valid/invalid steps', async () => {
      const validStepId = testStep1._id;
      const invalidStepId = new mongoose.Types.ObjectId();
      
      const trialData = {
        name: 'Mixed Validity Trial',
        steps: [
          { step: validStepId, order: 1 },
          { step: invalidStepId, order: 2 },
          { step: testStep2._id, order: 3 }
        ]
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(400);

      expect(response.body.message).toContain('One or more steps not found');
    });

    it('should preserve step order information', async () => {
      const trialData = {
        name: 'Order Test Trial',
        description: 'Testing step order preservation',
        steps: [
          { step: testStep2._id, order: 2 },
          { step: testStep1._id, order: 1 }
        ]
      };

      const response = await request(app)
        .post('/trials')
        .send(trialData)
        .expect(201);

      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0].order).toBe(2);
      expect(response.body.steps[1].order).toBe(1);
    });
  });
});