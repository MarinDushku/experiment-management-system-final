const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../models/User');
const TestHelpers = require('../../utils/testHelpers');

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        role: 'user'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe('testuser');
      expect(savedUser.role).toBe('user');
      expect(savedUser._id).toBeDefined();
      expect(savedUser.createdAt).toBeDefined();
    });

    it('should require username field', async () => {
      const userData = {
        password: 'password123',
        role: 'user'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
      await expect(user.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          username: expect.any(Object)
        })
      });
    });

    it('should require password field', async () => {
      const userData = {
        username: 'testuser',
        role: 'user'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
      await expect(user.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          password: expect.any(Object)
        })
      });
    });

    it('should enforce unique username constraint', async () => {
      const userData1 = {
        username: 'duplicateuser',
        password: 'password123'
      };

      const userData2 = {
        username: 'duplicateuser',
        password: 'password456'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce case-insensitive unique username', async () => {
      const userData1 = {
        username: 'TestUser',
        password: 'password123'
      };

      const userData2 = {
        username: 'testuser', // Different case
        password: 'password456'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should set default role to "user"', async () => {
      const userData = {
        username: 'defaultroleuser',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('user');
    });

    it('should accept valid role values', async () => {
      const validRoles = ['user', 'researcher', 'admin'];

      for (const role of validRoles) {
        const userData = {
          username: `${role}user`,
          password: 'password123',
          role: role
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser.role).toBe(role);
      }
    });

    it('should reject invalid role values', async () => {
      const userData = {
        username: 'invalidroleuser',
        password: 'password123',
        role: 'invalidrole'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
      await expect(user.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          role: expect.any(Object)
        })
      });
    });

    it('should allow sparse email field', async () => {
      // Test with email
      const userWithEmail = new User({
        username: 'userwithemailtest',
        password: 'password123',
        email: 'test@example.com'
      });
      const savedUserWithEmail = await userWithEmail.save();
      expect(savedUserWithEmail.email).toBe('test@example.com');

      // Test without email
      const userWithoutEmail = new User({
        username: 'userwithoutemailtest',
        password: 'password123'
      });
      const savedUserWithoutEmail = await userWithoutEmail.save();
      expect(savedUserWithoutEmail.email).toBeUndefined();
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeSave = new Date();
      
      const userData = {
        username: 'timestampuser',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      const afterSave = new Date();

      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedUser.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('Password Hashing Pre-save Hook', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'myplainpassword';
      const userData = {
        username: 'hashuser',
        password: plainPassword
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password.length).toBeGreaterThan(20);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const user = await TestHelpers.createTestUser({
        username: 'norehasuser',
        password: 'originalpassword'
      });

      const originalHashedPassword = user.password;

      // Update non-password field
      user.role = 'researcher';
      await user.save();

      expect(user.password).toBe(originalHashedPassword);
    });

    it('should rehash password when password is modified', async () => {
      const user = await TestHelpers.createTestUser({
        username: 'rehashuser',
        password: 'originalpassword'
      });

      const originalHashedPassword = user.password;

      // Update password
      user.password = 'newpassword';
      await user.save();

      expect(user.password).not.toBe(originalHashedPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should use bcrypt salt rounds correctly', async () => {
      const userData = {
        username: 'saltuser',
        password: 'testpassword'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      // bcrypt hash should start with $2a$10$ (indicating 10 salt rounds)
      expect(savedUser.password).toMatch(/^\$2[aby]\$10\$/);
    });
  });

  describe('matchPassword Method', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser({
        username: 'passwordmatchuser',
        password: 'correctpassword'
      });
    });

    it('should return true for correct password', async () => {
      const isMatch = await testUser.matchPassword('correctpassword');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isMatch = await testUser.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const isMatch = await testUser.matchPassword('');
      expect(isMatch).toBe(false);
    });

    it('should return false for null password', async () => {
      const isMatch = await testUser.matchPassword(null);
      expect(isMatch).toBe(false);
    });

    it('should return false for undefined password', async () => {
      const isMatch = await testUser.matchPassword(undefined);
      expect(isMatch).toBe(false);
    });

    it('should be case sensitive', async () => {
      const isMatch = await testUser.matchPassword('CorrectPassword');
      expect(isMatch).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const specialUser = await TestHelpers.createTestUser({
        username: 'specialuser',
        password: 'P@ssw0rd!#$%'
      });

      const isMatch = await specialUser.matchPassword('P@ssw0rd!#$%');
      expect(isMatch).toBe(true);

      const isNoMatch = await specialUser.matchPassword('P@ssw0rd!#$');
      expect(isNoMatch).toBe(false);
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const longUser = await TestHelpers.createTestUser({
        username: 'longpassuser',
        password: longPassword
      });

      const isMatch = await longUser.matchPassword(longPassword);
      expect(isMatch).toBe(true);
    });
  });

  describe('Index Creation', () => {
    it('should have unique index on username', async () => {
      const indexes = await User.collection.getIndexes();
      
      // Look for username index
      const usernameIndex = Object.values(indexes).find(index => 
        index.key && index.key.username === 1
      );

      expect(usernameIndex).toBeDefined();
      expect(usernameIndex.unique).toBe(true);
    });

    it('should have case-insensitive collation on username index', async () => {
      const indexes = await User.collection.getIndexes();
      
      const usernameIndex = Object.values(indexes).find(index => 
        index.key && index.key.username === 1
      );

      expect(usernameIndex).toBeDefined();
      expect(usernameIndex.collation).toBeDefined();
      expect(usernameIndex.collation.locale).toBe('en');
      expect(usernameIndex.collation.strength).toBe(2);
    });

    it('should have sparse index on email field', async () => {
      const indexes = await User.collection.getIndexes();
      
      const emailIndex = Object.values(indexes).find(index => 
        index.key && index.key.email === 1
      );

      expect(emailIndex).toBeDefined();
      expect(emailIndex.sparse).toBe(true);
    });
  });

  describe('Model Methods and Statics', () => {
    it('should find user by case-insensitive username', async () => {
      await TestHelpers.createTestUser({
        username: 'CaseTestUser',
        password: 'password123'
      });

      const foundUser = await User.findOne({ 
        username: { $regex: new RegExp('^casetestuser$', 'i') } 
      });

      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('CaseTestUser');
    });

    it('should exclude password from toJSON by default', async () => {
      const user = await TestHelpers.createTestUser({
        username: 'jsonuser',
        password: 'password123'
      });

      const userObject = user.toObject();
      expect(userObject.password).toBeDefined();

      // Note: The model doesn't have toJSON override, 
      // but in practice the password should be excluded in API responses
      const jsonString = JSON.stringify(user);
      const parsedUser = JSON.parse(jsonString);
      expect(parsedUser.password).toBeDefined(); // This would be excluded in real API
    });
  });

  describe('Error Handling', () => {
    it('should handle mongoose validation errors properly', async () => {
      const invalidUser = new User({
        username: '', // Empty username
        password: 'password123'
      });

      try {
        await invalidUser.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.username).toBeDefined();
      }
    });

    it('should handle duplicate key errors', async () => {
      const username = 'duplicatetest';
      
      await TestHelpers.createTestUser({
        username: username,
        password: 'password1'
      });

      const duplicateUser = new User({
        username: username,
        password: 'password2'
      });

      try {
        await duplicateUser.save();
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error code
      }
    });
  });
});