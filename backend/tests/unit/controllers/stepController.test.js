const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const stepController = require('../../../controllers/stepController');
const Step = require('../../../models/Step');
const TestHelpers = require('../../utils/testHelpers');

// Create test app
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (userId, role = 'researcher') => (req, res, next) => {
  req.user = { 
    id: userId || new mongoose.Types.ObjectId().toString(), 
    role: role 
  };
  next();
};

// Mock multer middleware for file uploads
const mockMulter = (req, res, next) => {
  if (req.body.hasFile) {
    req.file = {
      path: 'test-uploads/test-audio.mp3',
      filename: 'test-audio.mp3',
      mimetype: 'audio/mpeg',
      size: 1024
    };
  }
  next();
};

// Define routes
app.post('/steps', mockAuth(), mockMulter, stepController.createStep);
app.get('/steps', mockAuth(), stepController.getSteps);
app.get('/steps/:id', mockAuth(), stepController.getStepById);
app.put('/steps/:id', mockAuth(), mockMulter, stepController.updateStep);
app.delete('/steps/:id', mockAuth(), stepController.deleteStep);

describe('Step Controller', () => {
  let testUser, testStep;

  beforeEach(async () => {
    testUser = await TestHelpers.createTestResearcher();
  });

  describe('POST /steps', () => {
    it('should create music step with audio file', async () => {
      const stepData = {
        name: 'Test Music Step',
        type: 'Music',
        duration: 60,
        details: JSON.stringify({ volume: 0.8 }),
        hasFile: true // This will trigger mock file upload
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/steps', mockAuth(testUser._id.toString()), mockMulter, stepController.createStep);

      const response = await request(testApp)
        .post('/steps')
        .send(stepData)
        .expect(201);

      expect(response.body.name).toBe('Test Music Step');
      expect(response.body.type).toBe('Music');
      expect(response.body.duration).toBe(60);
      expect(response.body.details.audioFile).toBe('test-uploads/test-audio.mp3');
      expect(response.body.details.volume).toBe(0.8);
      expect(response.body.createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should create question step without file', async () => {
      const stepData = {
        name: 'Test Question Step',
        type: 'Question',
        duration: 30,
        details: JSON.stringify({ 
          question: 'How do you feel?',
          options: ['Good', 'Bad', 'Neutral']
        })
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/steps', mockAuth(testUser._id.toString()), mockMulter, stepController.createStep);

      const response = await request(testApp)
        .post('/steps')
        .send(stepData)
        .expect(201);

      expect(response.body.name).toBe('Test Question Step');
      expect(response.body.type).toBe('Question');
      expect(response.body.details.question).toBe('How do you feel?');
      expect(response.body.details.options).toEqual(['Good', 'Bad', 'Neutral']);
      expect(response.body.details).not.toHaveProperty('audioFile');
    });

    it('should create rest step', async () => {
      const stepData = {
        name: 'Rest Period',
        type: 'Rest',
        duration: 15,
        details: JSON.stringify({ instructions: 'Please relax' })
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/steps', mockAuth(testUser._id.toString()), mockMulter, stepController.createStep);

      const response = await request(testApp)
        .post('/steps')
        .send(stepData)
        .expect(201);

      expect(response.body.name).toBe('Rest Period');
      expect(response.body.type).toBe('Rest');
      expect(response.body.details.instructions).toBe('Please relax');
    });

    it('should handle empty details gracefully', async () => {
      const stepData = {
        name: 'Simple Step',
        type: 'Rest',
        duration: 10
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/steps', mockAuth(testUser._id.toString()), mockMulter, stepController.createStep);

      const response = await request(testApp)
        .post('/steps')
        .send(stepData)
        .expect(201);

      expect(response.body.details).toEqual({});
    });
  });

  describe('GET /steps', () => {
    beforeEach(async () => {
      // Create test steps for different users
      testStep = await TestHelpers.createTestStep({}, testUser._id);
      await TestHelpers.createTestStep({ name: 'Other User Step' });
    });

    it('should return steps for researcher user', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/steps', mockAuth(testUser._id.toString(), 'researcher'), stepController.getSteps);

      const response = await request(testApp)
        .get('/steps')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should return all steps for admin user', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/steps', mockAuth(testUser._id.toString(), 'admin'), stepController.getSteps);

      const response = await request(testApp)
        .get('/steps')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return steps in descending order by creation date', async () => {
      // Create additional step
      const newerStep = await TestHelpers.createTestStep({
        name: 'Newer Step'
      }, testUser._id);

      const testApp = express();
      testApp.use(express.json());
      testApp.get('/steps', mockAuth(testUser._id.toString()), stepController.getSteps);

      const response = await request(testApp)
        .get('/steps')
        .expect(200);

      expect(response.body[0]._id).toBe(newerStep._id.toString());
    });
  });

  describe('GET /steps/:id', () => {
    beforeEach(async () => {
      testStep = await TestHelpers.createTestStep({}, testUser._id);
    });

    it('should return step by ID for owner', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/steps/:id', mockAuth(testUser._id.toString()), stepController.getStepById);

      const response = await request(testApp)
        .get(`/steps/${testStep._id}`)
        .expect(200);

      expect(response.body._id).toBe(testStep._id.toString());
      expect(response.body.name).toBe(testStep.name);
    });

    it('should return 404 for non-existent step', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/steps/:id', mockAuth(testUser._id.toString()), stepController.getStepById);

      const response = await request(testApp)
        .get(`/steps/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('Step not found');
    });

    it('should return 403 for unauthorized access', async () => {
      const otherUser = await TestHelpers.createTestResearcher();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/steps/:id', mockAuth(otherUser._id.toString()), stepController.getStepById);

      const response = await request(testApp)
        .get(`/steps/${testStep._id}`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to access this step');
    });

    it('should allow admin access to any step', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/steps/:id', mockAuth(testUser._id.toString(), 'admin'), stepController.getStepById);

      const response = await request(testApp)
        .get(`/steps/${testStep._id}`)
        .expect(200);

      expect(response.body._id).toBe(testStep._id.toString());
    });
  });

  describe('PUT /steps/:id', () => {
    beforeEach(async () => {
      testStep = await TestHelpers.createTestStep({}, testUser._id);
    });

    it('should update step successfully', async () => {
      const updateData = {
        name: 'Updated Step Name',
        duration: 120,
        details: JSON.stringify({ newProperty: 'new value' })
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.put('/steps/:id', mockAuth(testUser._id.toString()), mockMulter, stepController.updateStep);

      const response = await request(testApp)
        .put(`/steps/${testStep._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Step Name');
      expect(response.body.duration).toBe(120);
      expect(response.body.details.newProperty).toBe('new value');
    });

    it('should update music step with new audio file', async () => {
      const musicStep = await TestHelpers.createTestStep({
        type: 'Music',
        details: { audioFile: 'old-audio.mp3' }
      }, testUser._id);

      const updateData = {
        hasFile: true // This will trigger mock file upload
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.put('/steps/:id', mockAuth(testUser._id.toString()), mockMulter, stepController.updateStep);

      const response = await request(testApp)
        .put(`/steps/${musicStep._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.details.audioFile).toBe('test-uploads/test-audio.mp3');
    });

    it('should return 403 for unauthorized update', async () => {
      const otherUser = await TestHelpers.createTestResearcher();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.put('/steps/:id', mockAuth(otherUser._id.toString()), mockMulter, stepController.updateStep);

      const response = await request(testApp)
        .put(`/steps/${testStep._id}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.message).toBe('Not authorized to update this step');
    });

    it('should allow admin to update any step', async () => {
      const updateData = {
        name: 'Admin Updated'
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.put('/steps/:id', mockAuth(testUser._id.toString(), 'admin'), mockMulter, stepController.updateStep);

      const response = await request(testApp)
        .put(`/steps/${testStep._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Admin Updated');
    });
  });

  describe('DELETE /steps/:id', () => {
    beforeEach(async () => {
      testStep = await TestHelpers.createTestStep({}, testUser._id);
    });

    it('should delete step successfully', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.delete('/steps/:id', mockAuth(testUser._id.toString()), stepController.deleteStep);

      const response = await request(testApp)
        .delete(`/steps/${testStep._id}`)
        .expect(200);

      expect(response.body.message).toBe('Step removed');

      // Verify step was deleted
      const deletedStep = await Step.findById(testStep._id);
      expect(deletedStep).toBeNull();
    });

    it('should delete music step and remove audio file', async () => {
      const musicStep = await TestHelpers.createTestStep({
        type: 'Music',
        details: { audioFile: 'test-audio-to-delete.mp3' }
      }, testUser._id);

      // Mock fs.existsSync and fs.unlinkSync
      const originalExistsSync = fs.existsSync;
      const originalUnlinkSync = fs.unlinkSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.unlinkSync = jest.fn();

      const testApp = express();
      testApp.use(express.json());
      testApp.delete('/steps/:id', mockAuth(testUser._id.toString()), stepController.deleteStep);

      const response = await request(testApp)
        .delete(`/steps/${musicStep._id}`)
        .expect(200);

      expect(response.body.message).toBe('Step removed');
      expect(fs.unlinkSync).toHaveBeenCalledWith('test-audio-to-delete.mp3');

      // Restore original functions
      fs.existsSync = originalExistsSync;
      fs.unlinkSync = originalUnlinkSync;
    });

    it('should return 403 for unauthorized deletion', async () => {
      const otherUser = await TestHelpers.createTestResearcher();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.delete('/steps/:id', mockAuth(otherUser._id.toString()), stepController.deleteStep);

      const response = await request(testApp)
        .delete(`/steps/${testStep._id}`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to delete this step');
    });

    it('should return 404 for non-existent step', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const testApp = express();
      testApp.use(express.json());
      testApp.delete('/steps/:id', mockAuth(testUser._id.toString()), stepController.deleteStep);

      const response = await request(testApp)
        .delete(`/steps/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('Step not found');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in details field', async () => {
      const stepData = {
        name: 'Invalid JSON Step',
        type: 'Question',
        duration: 30,
        details: 'invalid json string'
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.post('/steps', mockAuth(testUser._id.toString()), mockMulter, stepController.createStep);

      const response = await request(testApp)
        .post('/steps')
        .send(stepData)
        .expect(500);

      expect(response.body.message).toBe('Server error');
    });

    it('should handle file system errors gracefully', async () => {
      const musicStep = await TestHelpers.createTestStep({
        type: 'Music',
        details: { audioFile: 'error-file.mp3' }
      }, testUser._id);

      // Mock fs.unlinkSync to throw an error
      const originalUnlinkSync = fs.unlinkSync;
      fs.unlinkSync = jest.fn(() => {
        throw new Error('File system error');
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.delete('/steps/:id', mockAuth(testUser._id.toString()), stepController.deleteStep);

      // Should still delete the step even if file deletion fails
      const response = await request(testApp)
        .delete(`/steps/${musicStep._id}`)
        .expect(200);

      expect(response.body.message).toBe('Step removed');

      // Restore original function
      fs.unlinkSync = originalUnlinkSync;
    });
  });
});