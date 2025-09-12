const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authController = require('../../../controllers/authController');
const User = require('../../../models/User');
const TestHelpers = require('../../utils/testHelpers');

// Create test app
const app = express();
app.use(express.json());
app.post('/register', authController.register);
app.post('/login', authController.login);
app.get('/me', authController.getMe);

describe('Auth Controller', () => {
  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully. Awaiting admin approval.');

      // Verify user was created in database
      const user = await User.findOne({ username: 'newuser' });
      expect(user).toBeTruthy();
      expect(user.username).toBe('newuser');
      expect(user.role).toBe('user'); // Default role
    });

    it('should return error for missing username', async () => {
      const userData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Please provide both username and password');
    });

    it('should return error for missing password', async () => {
      const userData = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Please provide both username and password');
    });

    it('should return error for duplicate username', async () => {
      // Create initial user
      await TestHelpers.createTestUser({ username: 'existinguser' });

      const userData = {
        username: 'existinguser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });

    it('should handle case-insensitive username uniqueness', async () => {
      // Create initial user
      await TestHelpers.createTestUser({ username: 'TestUser' });

      const userData = {
        username: 'testuser', // Different case
        password: 'password123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });

    it('should hash password before storing', async () => {
      const userData = {
        username: 'passwordtest',
        password: 'plainpassword'
      };

      await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ username: 'passwordtest' });
      expect(user.password).not.toBe('plainpassword');
      expect(user.password.length).toBeGreaterThan(10); // Hashed password should be longer
    });
  });

  describe('POST /login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser({
        username: 'loginuser',
        password: 'password123'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('loginuser');
      expect(response.body.user.role).toBe('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return error for invalid username', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should handle case-insensitive username login', async () => {
      const loginData = {
        username: 'LoginUser', // Different case
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.username).toBe('loginuser');
    });

    it('should include role in JWT token', async () => {
      const adminUser = await TestHelpers.createTestAdmin({
        username: 'adminuser',
        password: 'password123'
      });

      const loginData = {
        username: 'adminuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.role).toBe('admin');
      
      // Verify token contains role
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'test_secret');
      expect(decoded.role).toBe('admin');
    });
  });

  describe('GET /me', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser({
        username: 'meuser',
        password: 'password123'
      });
      validToken = global.testUtils.generateToken({ 
        id: testUser._id.toString(), 
        role: testUser.role 
      });
    });

    it('should return user info with valid token', async () => {
      // Mock the auth middleware by setting req.user
      const authMiddleware = (req, res, next) => {
        req.user = { id: testUser._id.toString() };
        next();
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.get('/me', authMiddleware, authController.getMe);

      const response = await request(testApp)
        .get('/me')
        .expect(200);

      expect(response.body.username).toBe('meuser');
      expect(response.body.role).toBe('user');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const authMiddleware = (req, res, next) => {
        req.user = { id: nonExistentId.toString() };
        next();
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.get('/me', authMiddleware, authController.getMe);

      const response = await request(testApp)
        .get('/me')
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Temporarily close the database connection
      await mongoose.connection.close();

      const userData = {
        username: 'errortest',
        password: 'password123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(500);

      expect(response.body.message).toContain('Server Error');

      // Reconnect for other tests
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
    });
  });
});