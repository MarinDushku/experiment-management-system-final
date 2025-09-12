const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

let mongod;

beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(uri);
});

afterAll(async () => {
  // Clean up database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.testUtils = {
  // Generate test JWT token
  generateToken: (payload = { id: 'testUserId', role: 'user' }) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  },
  
  // Generate admin token
  generateAdminToken: () => {
    return jwt.sign({ id: 'adminUserId', role: 'admin' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  },
  
  // Generate researcher token
  generateResearcherToken: () => {
    return jwt.sign({ id: 'researcherUserId', role: 'researcher' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  },
  
  // Create test user data
  createUserData: (overrides = {}) => ({
    username: 'testuser',
    password: 'testpassword123',
    role: 'user',
    ...overrides
  }),
  
  // Create test experiment data
  createExperimentData: (overrides = {}) => ({
    name: 'Test Experiment',
    description: 'A test experiment for unit testing',
    status: 'Draft',
    trials: [],
    ...overrides
  }),
  
  // Create test step data
  createStepData: (overrides = {}) => ({
    name: 'Test Step',
    type: 'Music',
    duration: 30,
    details: { audioFile: 'test-audio.mp3' },
    ...overrides
  }),
  
  // Create test trial data
  createTrialData: (overrides = {}) => ({
    name: 'Test Trial',
    description: 'A test trial for unit testing',
    steps: [],
    ...overrides
  })
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';
process.env.PORT = '5001';