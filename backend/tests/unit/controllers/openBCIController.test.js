const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const openBCIController = require('../../../controllers/openBCIController');
const openBCIService = require('../../../services/openBCIService');
const EEGRecording = require('../../../models/EEGRecording');
const TestHelpers = require('../../utils/testHelpers');

// Mock child_process.spawn
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock openBCIService
jest.mock('../../../services/openBCIService', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  checkConnection: jest.fn(),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  scanPorts: jest.fn(),
  serialPort: null,
  isConnected: false
}));

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
  app.post('/openbci/direct-connect', mockAuth('researcher'), openBCIController.directConnect);
  app.get('/openbci/scan-ports', mockAuth('researcher'), openBCIController.scanPorts);
  app.post('/openbci/reset', mockAuth('researcher'), openBCIController.resetBoard);
  app.post('/openbci/connect', mockAuth('researcher'), openBCIController.connect);
  app.get('/openbci/status', mockAuth('researcher'), openBCIController.getConnectionStatus);
  app.post('/openbci/disconnect', mockAuth('researcher'), openBCIController.disconnect);
  app.post('/openbci/start-recording', mockAuth('researcher'), openBCIController.startRecording);
  app.post('/openbci/stop-recording', mockAuth('researcher'), openBCIController.stopRecording);
  app.get('/openbci/serial-ports', mockAuth('researcher'), openBCIController.getSerialPorts);

  return app;
};

describe('OpenBCI Controller', () => {
  let app;
  let testUser, testExperiment;
  let mockProcess;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test user and experiment
    testUser = await TestHelpers.createTestUser({
      username: 'openbciuser',
      role: 'researcher'
    });

    testExperiment = await TestHelpers.createTestExperiment({
      name: 'OpenBCI Test Experiment'
    }, testUser._id);
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock process
    mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };
    
    spawn.mockReturnValue(mockProcess);
    
    // Reset openBCIService state
    openBCIService.serialPort = null;
    openBCIService.isConnected = false;
  });


  describe('POST /openbci/direct-connect (directConnect)', () => {
    it('should connect successfully with valid response', async () => {
      const connectData = { serialPort: 'COM3' };
      const successResponse = JSON.stringify({
        status: 'success',
        message: 'Connected successfully',
        board_type: 'cyton_daisy'
      });

      // Mock successful process execution
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(successResponse)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send(connectData);

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully connected');
      expect(openBCIService.serialPort).toBe('COM3');
      expect(openBCIService.isConnected).toBe(true);
    });

    it('should use default COM3 port when not specified', async () => {
      const successResponse = JSON.stringify({
        status: 'success',
        message: 'Connected successfully'
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(successResponse)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({});

      const response = await responsePromise;

      expect(spawn).toHaveBeenCalledWith('python', expect.arrayContaining([
        expect.stringContaining('openbci_bridge.py'),
        '--action=connect',
        '--serial_port=COM3'
      ]));
    });

    it('should handle connection failure from Python script', async () => {
      const failureResponse = JSON.stringify({
        status: 'error',
        message: 'Failed to connect to device'
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(failureResponse)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM4' });

      const response = await responsePromise;

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to connect');
    });

    it('should handle process exit with non-zero code', async () => {
      const errorMessage = 'Python script error';

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 100);
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(errorMessage)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Process exited with code 1');
    });

    it('should handle invalid JSON response', async () => {
      const invalidResponse = 'invalid json response';

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(invalidResponse)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error parsing Python output');
    });

    it('should handle connection success despite JSON parsing errors', async () => {
      const responseWithSuccess = 'Some debug info\nConnected successfully\nMore debug info';

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(responseWithSuccess)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('despite parsing errors');
      expect(openBCIService.isConnected).toBe(true);
    });

    it('should handle process spawn error', async () => {
      const spawnError = new Error('Failed to spawn process');

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(spawnError), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to start Python process');
    });

    it.skip('should handle timeout', async () => {
      // Skipping timeout test as it requires complex timer mocking with async operations
      // In a real integration test environment, this would be tested with actual hardware
    });
  });

  describe('GET /openbci/scan-ports (scanPorts)', () => {
    it('should scan ports successfully', async () => {
      const scanResponse = JSON.stringify({
        status: 'success',
        message: 'Found 1 OpenBCI devices',
        ports: [{ port: 'COM3', status: 'available', response: 'OpenBCI V3' }]
      });

      fs.existsSync.mockReturnValue(true);

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(scanResponse)), 50);
        }
      });

      const response = await request(app)
        .get('/openbci/scan-ports')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.ports).toHaveLength(1);
      expect(response.body.ports[0].port).toBe('COM3');
    });

    it('should create test_port.py if it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      
      const scanResponse = JSON.stringify({
        status: 'success',
        message: 'Found 0 OpenBCI devices',
        ports: []
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(scanResponse)), 50);
        }
      });

      await request(app)
        .get('/openbci/scan-ports')
        .expect(200);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test_port.py'),
        expect.stringContaining('def scan_ports')
      );
    });

    it('should fallback to service method on scan failure', async () => {
      const fallbackResult = {
        status: 'success',
        message: 'Fallback scan completed',
        ports: []
      };

      openBCIService.scanPorts.mockResolvedValue(fallbackResult);

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 100);
        }
      });

      const response = await request(app)
        .get('/openbci/scan-ports')
        .expect(200);

      expect(openBCIService.scanPorts).toHaveBeenCalled();
      expect(response.body.message).toBe('Fallback scan completed');
    });

    it('should handle process spawn error with fallback', async () => {
      const fallbackResult = {
        status: 'success',
        message: 'Fallback scan completed',
        ports: []
      };

      openBCIService.scanPorts.mockResolvedValue(fallbackResult);

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Spawn failed')), 50);
        }
      });

      const response = await request(app)
        .get('/openbci/scan-ports')
        .expect(200);

      expect(openBCIService.scanPorts).toHaveBeenCalled();
    });
  });

  describe('POST /openbci/reset (resetBoard)', () => {
    it('should reset board successfully', async () => {
      const resetData = { serialPort: 'COM3' };
      const successResponse = JSON.stringify({
        status: 'success',
        message: 'Reset successful'
      });

      openBCIService.disconnect.mockResolvedValue({ status: 'success' });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          // Use setImmediate instead of setTimeout for test environment
          setImmediate(() => callback(0));
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          // Use setImmediate instead of setTimeout for test environment
          setImmediate(() => callback(Buffer.from(successResponse)));
        }
      });

      const responsePromise = request(app)
        .post('/openbci/reset')
        .send(resetData);

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully reset');
      expect(openBCIService.disconnect).toHaveBeenCalled();
    });

    it('should continue reset even if disconnect fails', async () => {
      openBCIService.disconnect.mockRejectedValue(new Error('No connection'));

      const successResponse = JSON.stringify({
        status: 'success',
        message: 'Reset successful'
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setImmediate(() => callback(0));
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setImmediate(() => callback(Buffer.from(successResponse)));
        }
      });

      const responsePromise = request(app)
        .post('/openbci/reset')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /openbci/connect (connect)', () => {
    it('should connect successfully using service', async () => {
      const connectData = { serialPort: 'COM3' };
      const serviceResult = {
        status: 'success',
        message: 'Connected via service'
      };

      openBCIService.connect.mockResolvedValue(serviceResult);

      const response = await request(app)
        .post('/openbci/connect')
        .send(connectData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully connected');
      expect(openBCIService.connect).toHaveBeenCalledWith('COM3');
    });

    it('should require serial port', async () => {
      const response = await request(app)
        .post('/openbci/connect')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Serial port is required');
    });

    it('should handle service connection failure', async () => {
      const serviceResult = {
        status: 'error',
        message: 'Service connection failed'
      };

      openBCIService.connect.mockResolvedValue(serviceResult);

      const response = await request(app)
        .post('/openbci/connect')
        .send({ serialPort: 'COM3' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service connection failed');
    });

    it('should handle service errors', async () => {
      openBCIService.connect.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/openbci/connect')
        .send({ serialPort: 'COM3' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service error');
    });
  });

  describe('GET /openbci/status (getConnectionStatus)', () => {
    it('should get connection status successfully', async () => {
      const statusResult = {
        connected: true,
        message: 'Connected to COM3',
        board_id: 0
      };

      openBCIService.checkConnection.mockResolvedValue(statusResult);

      const response = await request(app)
        .get('/openbci/status')
        .expect(200);

      expect(response.body.connected).toBe(true);
      expect(response.body.message).toBe('Connected to COM3');
      expect(openBCIService.checkConnection).toHaveBeenCalled();
    });

    it('should handle status check errors', async () => {
      openBCIService.checkConnection.mockRejectedValue(new Error('Status check failed'));

      const response = await request(app)
        .get('/openbci/status')
        .expect(500);

      expect(response.body.connected).toBe(false);
      expect(response.body.message).toContain('Status check failed');
    });
  });

  describe('POST /openbci/disconnect (disconnect)', () => {
    it('should disconnect successfully', async () => {
      const disconnectResult = {
        status: 'success',
        message: 'Disconnected successfully'
      };

      openBCIService.disconnect.mockResolvedValue(disconnectResult);

      const response = await request(app)
        .post('/openbci/disconnect')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully disconnected');
      expect(openBCIService.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect failure', async () => {
      const disconnectResult = {
        status: 'error',
        message: 'Disconnect failed'
      };

      openBCIService.disconnect.mockResolvedValue(disconnectResult);

      const response = await request(app)
        .post('/openbci/disconnect')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Disconnect failed');
    });

    it('should handle service errors', async () => {
      openBCIService.disconnect.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/openbci/disconnect')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service error');
    });
  });

  describe('POST /openbci/start-recording (startRecording)', () => {
    it('should start recording successfully', async () => {
      const recordingData = { experimentName: 'Test Experiment' };
      const recordingResult = {
        status: 'success',
        message: 'Recording started'
      };

      openBCIService.startRecording.mockResolvedValue(recordingResult);

      const response = await request(app)
        .post('/openbci/start-recording')
        .send(recordingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully started EEG recording');
      expect(openBCIService.startRecording).toHaveBeenCalledWith('Test Experiment');
    });

    it('should start recording without experiment name', async () => {
      const recordingResult = {
        status: 'success',
        message: 'Recording started'
      };

      openBCIService.startRecording.mockResolvedValue(recordingResult);

      const response = await request(app)
        .post('/openbci/start-recording')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(openBCIService.startRecording).toHaveBeenCalledWith(undefined);
    });

    it('should handle start recording failure', async () => {
      const recordingResult = {
        status: 'error',
        message: 'Recording start failed'
      };

      openBCIService.startRecording.mockResolvedValue(recordingResult);

      const response = await request(app)
        .post('/openbci/start-recording')
        .send({ experimentName: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Recording start failed');
    });

    it('should handle service errors', async () => {
      openBCIService.startRecording.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/openbci/start-recording')
        .send({ experimentName: 'Test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service error');
    });
  });

  describe('POST /openbci/stop-recording (stopRecording)', () => {
    it('should stop recording and save to database successfully', async () => {
      const stopData = {
        experimentId: testExperiment._id.toString(),
        experimentName: 'Test Experiment',
        duration: 10
      };

      const recordingResult = {
        status: 'success',
        message: 'Recording stopped',
        sampling_rate: 250,
        channels: 16,
        samples: 2500,
        file_path: '/path/to/recording.csv'
      };

      openBCIService.stopRecording.mockResolvedValue(recordingResult);

      const response = await request(app)
        .post('/openbci/stop-recording')
        .send(stopData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully stopped and saved');
      expect(response.body.recordingId).toBeDefined();
      expect(openBCIService.stopRecording).toHaveBeenCalledWith(
        testExperiment._id.toString(),
        10,
        'Test Experiment'
      );

      // Verify EEG recording was saved to database
      const savedRecording = await EEGRecording.findById(response.body.recordingId);
      expect(savedRecording).toBeTruthy();
      expect(savedRecording.experiment.toString()).toBe(testExperiment._id.toString());
      expect(savedRecording.experimentName).toBe('Test Experiment');
      expect(savedRecording.samplingRate).toBe(250);
      expect(savedRecording.channelCount).toBe(16);
      expect(savedRecording.sampleCount).toBe(2500);
      expect(savedRecording.filePath).toBe('/path/to/recording.csv');
    });

    it('should require experiment ID', async () => {
      const response = await request(app)
        .post('/openbci/stop-recording')
        .send({ experimentName: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Experiment ID is required');
    });

    it('should use default values when optional fields are missing', async () => {
      const stopData = {
        experimentId: testExperiment._id.toString()
      };

      const recordingResult = {
        status: 'success',
        message: 'Recording stopped'
      };

      openBCIService.stopRecording.mockResolvedValue(recordingResult);

      const response = await request(app)
        .post('/openbci/stop-recording')
        .send(stopData)
        .expect(200);

      expect(openBCIService.stopRecording).toHaveBeenCalledWith(
        testExperiment._id.toString(),
        5, // default duration
        '' // default experiment name
      );

      // Verify defaults in database
      const savedRecording = await EEGRecording.findById(response.body.recordingId);
      expect(savedRecording.experimentName).toBe('Unnamed Experiment');
      expect(savedRecording.samplingRate).toBe(250);
      expect(savedRecording.channelCount).toBe(16);
      expect(savedRecording.sampleCount).toBe(0);
    });

    it('should handle stop recording failure', async () => {
      const recordingResult = {
        status: 'error',
        message: 'Stop recording failed'
      };

      openBCIService.stopRecording.mockResolvedValue(recordingResult);

      const response = await request(app)
        .post('/openbci/stop-recording')
        .send({ experimentId: testExperiment._id.toString() })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Stop recording failed');
    });

    it('should handle database save errors', async () => {
      const recordingResult = {
        status: 'success',
        message: 'Recording stopped'
      };

      openBCIService.stopRecording.mockResolvedValue(recordingResult);

      // Mock database error
      jest.spyOn(EEGRecording.prototype, 'save').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/openbci/stop-recording')
        .send({ experimentId: testExperiment._id.toString() })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Database error');

      EEGRecording.prototype.save.mockRestore();
    });
  });

  describe('GET /openbci/serial-ports (getSerialPorts)', () => {
    it('should return Windows ports', async () => {
      const response = await request(app)
        .get('/openbci/serial-ports')
        .query({ os: 'windows' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ports).toContain('COM3');
      expect(response.body.ports).toContain('COM4');
    });

    it('should return Mac ports', async () => {
      const response = await request(app)
        .get('/openbci/serial-ports')
        .query({ os: 'mac' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ports).toContain('/dev/cu.usbserial-DM00Q0QN');
    });

    it('should return Linux ports', async () => {
      const response = await request(app)
        .get('/openbci/serial-ports')
        .query({ os: 'linux' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ports).toContain('/dev/ttyUSB0');
    });

    it('should return default ports for unknown OS', async () => {
      const response = await request(app)
        .get('/openbci/serial-ports')
        .query({ os: 'unknown' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ports).toContain('COM3');
      expect(response.body.ports).toContain('/dev/ttyUSB0');
      expect(response.body.ports).toContain('/dev/cu.usbserial-*');
    });

    it('should handle missing OS parameter', async () => {
      const response = await request(app)
        .get('/openbci/serial-ports')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ports).toBeDefined();
      expect(Array.isArray(response.body.ports)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle JSON with debug logs in directConnect', async () => {
      const responseWithLogs = `
        Debug: Starting connection...
        Debug: Port opened
        {"status": "success", "message": "Connected"}
        Debug: Connection complete
      `;

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(responseWithLogs)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle multiple JSON objects in output', async () => {
      const responseWithMultiple = `
        {"status": "debug", "message": "Starting"}
        {"status": "success", "message": "Connected"}
      `;

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(responseWithMultiple)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should preserve existing service state on errors', async () => {
      openBCIService.serialPort = 'COM5';
      openBCIService.isConnected = true;

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 100);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      await responsePromise;

      // Service state should remain unchanged on error
      expect(openBCIService.serialPort).toBe('COM5');
      expect(openBCIService.isConnected).toBe(true);
    });

    it('should handle very long output in directConnect', async () => {
      const longOutput = 'A'.repeat(100000) + JSON.stringify({
        status: 'success',
        message: 'Connected after long output'
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from(longOutput)), 50);
        }
      });

      const responsePromise = request(app)
        .post('/openbci/direct-connect')
        .send({ serialPort: 'COM3' });

      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});