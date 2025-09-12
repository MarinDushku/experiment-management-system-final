const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const userController = require('../../../controllers/userController');
const User = require('../../../models/User');
const TestHelpers = require('../../utils/testHelpers');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  const mockAuth = (role = 'admin') => (req, res, next) => {
    req.user = { 
      id: new mongoose.Types.ObjectId().toString(), 
      role: role 
    };
    next();
  };

  // Routes
  app.get('/users', mockAuth('admin'), userController.getUsers);
  app.get('/users/non-admin', mockAuth('user'), userController.getUsers);
  app.get('/users/:id', mockAuth('admin'), userController.getUserById);
  app.get('/users/non-admin/:id', mockAuth('user'), userController.getUserById);
  app.put('/users/:id/role', mockAuth('admin'), userController.updateUserRole);
  app.put('/users/non-admin/:id/role', mockAuth('user'), userController.updateUserRole);
  app.delete('/users/:id', mockAuth('admin'), userController.deleteUser);
  app.delete('/users/non-admin/:id', mockAuth('user'), userController.deleteUser);

  return app;
};

describe('User Controller', () => {
  let app;
  let testUser1, testUser2, adminUser, mdUser;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Create test users for each test
    testUser1 = await TestHelpers.createTestUser({
      username: 'user1',
      role: 'user'
    });

    testUser2 = await TestHelpers.createTestUser({
      username: 'user2',
      role: 'researcher'
    });

    adminUser = await TestHelpers.createTestUser({
      username: 'admin1',
      role: 'admin'
    });

    // Create special 'md' admin user
    mdUser = await TestHelpers.createTestUser({
      username: 'md',
      role: 'admin'
    });
  });

  describe('GET /users (getUsers)', () => {
    it('should get all users excluding passwords', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(4);
      
      // Check that passwords are not included
      response.body.forEach(user => {
        expect(user.password).toBeUndefined();
        expect(user.username).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user._id).toBeDefined();
      });

      // Check that all test users are included
      const usernames = response.body.map(user => user.username);
      expect(usernames).toContain('user1');
      expect(usernames).toContain('user2');
      expect(usernames).toContain('admin1');
      expect(usernames).toContain('md');
    });

    it('should include all user roles', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      const roles = response.body.map(user => user.role);
      expect(roles).toContain('user');
      expect(roles).toContain('researcher');
      expect(roles).toContain('admin');
    });

    it('should return users with proper structure', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      
      const firstUser = response.body[0];
      expect(firstUser).toHaveProperty('_id');
      expect(firstUser).toHaveProperty('username');
      expect(firstUser).toHaveProperty('role');
      expect(firstUser).toHaveProperty('createdAt');
      expect(firstUser).not.toHaveProperty('password');
    });

    it('should handle database errors', async () => {
      jest.spyOn(User, 'find').mockReturnValueOnce({
        select: jest.fn().mockRejectedValueOnce(new Error('Database connection failed'))
      });

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body.message).toContain('Server Error');
      expect(response.body.message).toContain('Database connection failed');

      User.find.mockRestore();
    });

    it('should work for admin users', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /users/:id (getUserById)', () => {
    it('should get user by ID excluding password', async () => {
      const response = await request(app)
        .get(`/users/${testUser1._id}`)
        .expect(200);

      expect(response.body._id).toBe(testUser1._id.toString());
      expect(response.body.username).toBe('user1');
      expect(response.body.role).toBe('user');
      expect(response.body.password).toBeUndefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/users/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should handle invalid ObjectId', async () => {
      const response = await request(app)
        .get('/users/invalid_id')
        .expect(500);

      expect(response.body.message).toBe('Server Error');
    });

    it('should get admin user successfully', async () => {
      const response = await request(app)
        .get(`/users/${adminUser._id}`)
        .expect(200);

      expect(response.body._id).toBe(adminUser._id.toString());
      expect(response.body.username).toBe('admin1');
      expect(response.body.role).toBe('admin');
      expect(response.body.password).toBeUndefined();
    });

    it('should handle database errors', async () => {
      jest.spyOn(User, 'findById').mockReturnValueOnce({
        select: jest.fn().mockRejectedValueOnce(new Error('Database error'))
      });

      const response = await request(app)
        .get(`/users/${testUser1._id}`)
        .expect(500);

      expect(response.body.message).toBe('Server Error');

      User.findById.mockRestore();
    });
  });

  describe('PUT /users/:id/role (updateUserRole)', () => {
    it('should update user role successfully', async () => {
      const updateData = { role: 'researcher' };

      const response = await request(app)
        .put(`/users/${testUser1._id}/role`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User role updated successfully');

      // Verify the role was actually updated
      const updatedUser = await User.findById(testUser1._id);
      expect(updatedUser.role).toBe('researcher');
    });

    it('should update from researcher to admin', async () => {
      const updateData = { role: 'admin' };

      const response = await request(app)
        .put(`/users/${testUser2._id}/role`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User role updated successfully');

      const updatedUser = await User.findById(testUser2._id);
      expect(updatedUser.role).toBe('admin');
    });

    it('should validate role values', async () => {
      const invalidRoles = ['invalid', 'superuser', '', null, undefined];

      for (const role of invalidRoles) {
        const updateData = { role };

        const response = await request(app)
          .put(`/users/${testUser1._id}/role`)
          .send(updateData)
          .expect(400);

        expect(response.body.message).toBe('Invalid role');
      }
    });

    it('should accept all valid roles', async () => {
      const validRoles = ['user', 'researcher', 'admin'];

      for (const role of validRoles) {
        const testUser = await TestHelpers.createTestUser({
          username: `test_${role}_user`,
          role: 'user'
        });

        const updateData = { role };

        const response = await request(app)
          .put(`/users/${testUser._id}/role`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('User role updated successfully');

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.role).toBe(role);
      }
    });

    it('should prevent changing md admin user role', async () => {
      const updateData = { role: 'user' };

      const response = await request(app)
        .put(`/users/${mdUser._id}/role`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toBe('Cannot change admin user role');

      // Verify the role was not changed
      const unchangedUser = await User.findById(mdUser._id);
      expect(unchangedUser.role).toBe('admin');
    });

    it('should allow updating md user to admin (same role)', async () => {
      const updateData = { role: 'admin' };

      const response = await request(app)
        .put(`/users/${mdUser._id}/role`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('User role updated successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { role: 'researcher' };

      const response = await request(app)
        .put(`/users/${nonExistentId}/role`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should handle invalid ObjectId', async () => {
      const updateData = { role: 'researcher' };

      const response = await request(app)
        .put('/users/invalid_id/role')
        .send(updateData)
        .expect(500);

      expect(response.body.message).toBe('Server Error');
    });

    it('should handle database errors during find', async () => {
      jest.spyOn(User, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const updateData = { role: 'researcher' };

      const response = await request(app)
        .put(`/users/${testUser1._id}/role`)
        .send(updateData)
        .expect(500);

      expect(response.body.message).toBe('Server Error');

      User.findById.mockRestore();
    });

    it('should handle database errors during save', async () => {
      const user = await User.findById(testUser1._id);
      jest.spyOn(user, 'save').mockRejectedValueOnce(new Error('Save failed'));

      // We need to mock findById to return our mocked user
      jest.spyOn(User, 'findById').mockResolvedValueOnce(user);

      const updateData = { role: 'researcher' };

      const response = await request(app)
        .put(`/users/${testUser1._id}/role`)
        .send(updateData)
        .expect(500);

      expect(response.body.message).toBe('Server Error');

      User.findById.mockRestore();
    });
  });

  describe('DELETE /users/:id (deleteUser)', () => {
    it('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/users/${testUser1._id}`)
        .expect(200);

      expect(response.body.message).toBe('User removed');

      // Verify the user was actually deleted
      const deletedUser = await User.findById(testUser1._id);
      expect(deletedUser).toBeNull();
    });

    it('should delete researcher user successfully', async () => {
      const response = await request(app)
        .delete(`/users/${testUser2._id}`)
        .expect(200);

      expect(response.body.message).toBe('User removed');

      const deletedUser = await User.findById(testUser2._id);
      expect(deletedUser).toBeNull();
    });

    it('should delete regular admin user successfully', async () => {
      const response = await request(app)
        .delete(`/users/${adminUser._id}`)
        .expect(200);

      expect(response.body.message).toBe('User removed');

      const deletedUser = await User.findById(adminUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should prevent deleting md admin user', async () => {
      const response = await request(app)
        .delete(`/users/${mdUser._id}`)
        .expect(400);

      expect(response.body.message).toBe('Cannot delete admin user');

      // Verify the user was not deleted
      const existingUser = await User.findById(mdUser._id);
      expect(existingUser).toBeTruthy();
      expect(existingUser.username).toBe('md');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/users/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should handle invalid ObjectId', async () => {
      const response = await request(app)
        .delete('/users/invalid_id')
        .expect(500);

      expect(response.body.message).toBe('Server Error');
    });

    it('should handle database errors during find', async () => {
      jest.spyOn(User, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete(`/users/${testUser1._id}`)
        .expect(500);

      expect(response.body.message).toBe('Server Error');

      User.findById.mockRestore();
    });

    it('should handle database errors during delete', async () => {
      jest.spyOn(User, 'findByIdAndDelete').mockRejectedValueOnce(new Error('Delete failed'));

      const response = await request(app)
        .delete(`/users/${testUser1._id}`)
        .expect(500);

      expect(response.body.message).toBe('Server Error');

      User.findByIdAndDelete.mockRestore();
    });
  });

  describe('Authorization and Edge Cases', () => {
    it('should handle missing user in request', async () => {
      const app = express();
      app.use(express.json());
      app.get('/users', userController.getUsers);

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body.message).toContain('Server Error');
    });

    it('should handle missing role in update request', async () => {
      const updateData = {}; // No role provided

      const response = await request(app)
        .put(`/users/${testUser1._id}/role`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toBe('Invalid role');
    });

    it('should handle various special username cases', async () => {
      // Create users with different usernames
      const specialUsers = await Promise.all([
        TestHelpers.createTestUser({ username: 'MD', role: 'admin' }), // Uppercase
        TestHelpers.createTestUser({ username: 'Md', role: 'admin' }), // Mixed case
        TestHelpers.createTestUser({ username: 'md_test', role: 'admin' }) // Contains md
      ]);

      // Only exact 'md' username should be protected
      for (const user of specialUsers) {
        const deleteResponse = await request(app)
          .delete(`/users/${user._id}`)
          .expect(200);

        expect(deleteResponse.body.message).toBe('User removed');
      }
    });

    it('should preserve user data integrity during role updates', async () => {
      const originalUser = await User.findById(testUser1._id);
      const originalUsername = originalUser.username;
      const originalCreatedAt = originalUser.createdAt;

      const updateData = { role: 'researcher' };

      await request(app)
        .put(`/users/${testUser1._id}/role`)
        .send(updateData)
        .expect(200);

      const updatedUser = await User.findById(testUser1._id);
      expect(updatedUser.username).toBe(originalUsername);
      expect(updatedUser.createdAt.getTime()).toBe(originalCreatedAt.getTime());
      expect(updatedUser.role).toBe('researcher');
    });

    it('should handle concurrent role updates gracefully', async () => {
      const updateRequests = [
        request(app).put(`/users/${testUser1._id}/role`).send({ role: 'researcher' }),
        request(app).put(`/users/${testUser1._id}/role`).send({ role: 'admin' })
      ];

      const responses = await Promise.all(updateRequests);
      
      // Both should succeed (last one wins)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User role updated successfully');
      });

      // Final role should be one of the requested roles
      const finalUser = await User.findById(testUser1._id);
      expect(['researcher', 'admin']).toContain(finalUser.role);
    });
  });
});