const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const experimentController = require('../../../controllers/experimentController');
const Experiment = require('../../../models/Experiment');
const Trial = require('../../../models/Trial');
const TestHelpers = require('../../utils/testHelpers');

// Create test app
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

// Define routes
app.post('/experiments', mockAuth('researcher'), experimentController.createExperiment);
app.get('/experiments', mockAuth('researcher'), experimentController.getExperiments);
app.get('/experiments/:id', mockAuth('researcher'), experimentController.getExperimentById);
app.put('/experiments/:id', mockAuth('researcher'), experimentController.updateExperiment);
app.delete('/experiments/:id', mockAuth('researcher'), experimentController.deleteExperiment);
app.post('/experiments/:id/run', mockAuth('researcher'), experimentController.runExperiment);

describe('Experiment Controller', () => {
  let testUser, testTrial, testExperiment;

  beforeEach(async () => {
    testUser = await TestHelpers.createTestResearcher();
    testTrial = await TestHelpers.createTestTrial({}, testUser._id);
  });

  describe('POST /experiments', () => {
    it('should create experiment successfully', async () => {
      const experimentData = {
        name: 'New Test Experiment',
        description: 'A test experiment',
        trials: [{
          trial: testTrial._id,
          order: 1
        }]
      };

      // Override auth middleware for this test
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/experiments', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.createExperiment);

      const response = await request(testApp)
        .post('/experiments')
        .send(experimentData)
        .expect(201);

      expect(response.body.name).toBe('New Test Experiment');
      expect(response.body.description).toBe('A test experiment');
      expect(response.body.trials).toHaveLength(1);
      expect(response.body.status).toBe('Draft');
      expect(response.body.createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should create experiment without trials', async () => {
      const experimentData = {
        name: 'Simple Experiment',
        description: 'No trials yet'
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/experiments', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.createExperiment);

      const response = await request(testApp)
        .post('/experiments')
        .send(experimentData)
        .expect(201);

      expect(response.body.name).toBe('Simple Experiment');
      expect(response.body.trials).toHaveLength(0);
    });

    it('should return error for invalid trial references', async () => {
      const invalidTrialId = new mongoose.Types.ObjectId();
      const experimentData = {
        name: 'Invalid Experiment',
        description: 'Has invalid trial',
        trials: [{
          trial: invalidTrialId,
          order: 1
        }]
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/experiments', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.createExperiment);

      const response = await request(testApp)
        .post('/experiments')
        .send(experimentData)
        .expect(400);

      expect(response.body.message).toBe('One or more trials not found');
    });
  });

  describe('GET /experiments', () => {
    beforeEach(async () => {
      // Create test experiments for different users
      testExperiment = await TestHelpers.createTestExperiment({}, testUser._id);
      await TestHelpers.createTestExperiment({ name: 'Other User Experiment' });
    });

    it('should return experiments for researcher user', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/experiments', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.getExperiments);

      const response = await request(testApp)
        .get('/experiments')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should return all experiments for admin user', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/experiments', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'admin' };
        next();
      }, experimentController.getExperiments);

      const response = await request(testApp)
        .get('/experiments')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /experiments/:id', () => {
    beforeEach(async () => {
      testExperiment = await TestHelpers.createTestExperiment({}, testUser._id);
    });

    it('should return experiment by ID for owner', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/experiments/:id', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.getExperimentById);

      const response = await request(testApp)
        .get(`/experiments/${testExperiment._id}`)
        .expect(200);

      expect(response.body._id).toBe(testExperiment._id.toString());
      expect(response.body.name).toBe(testExperiment.name);
    });

    it('should return 404 for non-existent experiment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/experiments/:id', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.getExperimentById);

      const response = await request(testApp)
        .get(`/experiments/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('Experiment not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const otherUser = await TestHelpers.createTestResearcher();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/experiments/:id', (req, res, next) => {
        req.user = { id: otherUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.getExperimentById);

      const response = await request(testApp)
        .get(`/experiments/${testExperiment._id}`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to access this experiment');
    });

    it('should allow admin access to any experiment', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/experiments/:id', (req, res, next) => {
        req.user = { id: new mongoose.Types.ObjectId().toString(), role: 'admin' };
        next();
      }, experimentController.getExperimentById);

      const response = await request(testApp)
        .get(`/experiments/${testExperiment._id}`)
        .expect(200);

      expect(response.body._id).toBe(testExperiment._id.toString());
    });
  });

  describe('PUT /experiments/:id', () => {
    beforeEach(async () => {
      testExperiment = await TestHelpers.createTestExperiment({}, testUser._id);
    });

    it('should update experiment successfully', async () => {
      const updateData = {
        name: 'Updated Experiment Name',
        description: 'Updated description',
        status: 'Active'
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.put('/experiments/:id', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.updateExperiment);

      const response = await request(testApp)
        .put(`/experiments/${testExperiment._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Experiment Name');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.status).toBe('Active');
    });

    it('should validate status field', async () => {
      const updateData = {
        status: 'InvalidStatus'
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.put('/experiments/:id', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.updateExperiment);

      const response = await request(testApp)
        .put(`/experiments/${testExperiment._id}`)
        .send(updateData)
        .expect(200);

      // Invalid status should be ignored, original status preserved
      expect(response.body.status).toBe(testExperiment.status);
    });

    it('should return 403 for unauthorized update', async () => {
      const otherUser = await TestHelpers.createTestResearcher();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.put('/experiments/:id', (req, res, next) => {
        req.user = { id: otherUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.updateExperiment);

      const response = await request(testApp)
        .put(`/experiments/${testExperiment._id}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.message).toBe('Not authorized to update this experiment');
    });
  });

  describe('DELETE /experiments/:id', () => {
    beforeEach(async () => {
      testExperiment = await TestHelpers.createTestExperiment({}, testUser._id);
    });

    it('should delete experiment successfully', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.delete('/experiments/:id', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.deleteExperiment);

      const response = await request(testApp)
        .delete(`/experiments/${testExperiment._id}`)
        .expect(200);

      expect(response.body.message).toBe('Experiment removed');

      // Verify experiment was deleted
      const deletedExperiment = await Experiment.findById(testExperiment._id);
      expect(deletedExperiment).toBeNull();
    });

    it('should return 403 for unauthorized deletion', async () => {
      const otherUser = await TestHelpers.createTestResearcher();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.delete('/experiments/:id', (req, res, next) => {
        req.user = { id: otherUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.deleteExperiment);

      const response = await request(testApp)
        .delete(`/experiments/${testExperiment._id}`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to delete this experiment');
    });
  });

  describe('POST /experiments/:id/run', () => {
    beforeEach(async () => {
      testExperiment = await TestHelpers.createTestExperiment({}, testUser._id);
    });

    it('should run experiment successfully', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/experiments/:id/run', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.runExperiment);

      const response = await request(testApp)
        .post(`/experiments/${testExperiment._id}/run`)
        .expect(200);

      expect(response.body.message).toBe('Experiment started successfully');
      expect(response.body.experiment.status).toBe('Active');
    });

    it('should return error for experiment without trials', async () => {
      const emptyExperiment = await TestHelpers.createTestExperiment({
        trials: []
      }, testUser._id);
      
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/experiments/:id/run', (req, res, next) => {
        req.user = { id: testUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.runExperiment);

      const response = await request(testApp)
        .post(`/experiments/${emptyExperiment._id}/run`)
        .expect(400);

      expect(response.body.message).toBe('Experiment must have at least one trial assigned to run');
    });

    it('should return 403 for unauthorized run', async () => {
      const otherUser = await TestHelpers.createTestResearcher();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/experiments/:id/run', (req, res, next) => {
        req.user = { id: otherUser._id.toString(), role: 'researcher' };
        next();
      }, experimentController.runExperiment);

      const response = await request(testApp)
        .post(`/experiments/${testExperiment._id}/run`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to run this experiment');
    });
  });
});