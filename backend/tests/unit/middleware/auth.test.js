const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../../../middleware/auth');
const TestHelpers = require('../../utils/testHelpers');

describe('Auth Middleware', () => {
  describe('protect middleware', () => {
    it('should authenticate valid JWT token', async () => {
      const validToken = global.testUtils.generateToken({ id: 'testUserId', role: 'user' });
      
      const req = TestHelpers.createMockReq({
        headers: {
          authorization: `Bearer ${validToken}`
        }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('testUserId');
      expect(req.user.role).toBe('user');
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      const req = TestHelpers.createMockReq({
        headers: {}
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      const req = TestHelpers.createMockReq({
        headers: {
          authorization: 'InvalidFormat token'
        }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid JWT token', async () => {
      const req = TestHelpers.createMockReq({
        headers: {
          authorization: 'Bearer invalid.jwt.token'
        }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: 'testUserId', role: 'user' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = TestHelpers.createMockReq({
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', async () => {
      const req = TestHelpers.createMockReq({
        headers: {
          authorization: 'sometoken'
        }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle different JWT secrets gracefully', async () => {
      const tokenWithDifferentSecret = jwt.sign(
        { id: 'testUserId', role: 'user' },
        'different_secret',
        { expiresIn: '1h' }
      );

      const req = TestHelpers.createMockReq({
        headers: {
          authorization: `Bearer ${tokenWithDifferentSecret}`
        }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should extract user data correctly from token', async () => {
      const userData = { id: 'userId123', role: 'researcher' };
      const validToken = global.testUtils.generateToken(userData);
      
      const req = TestHelpers.createMockReq({
        headers: {
          authorization: `Bearer ${validToken}`
        }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      await protect(req, res, next);

      expect(req.user.id).toBe('userId123');
      expect(req.user.role).toBe('researcher');
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for authorized role', () => {
      const authorizeMiddleware = authorize(['admin', 'researcher']);
      
      const req = TestHelpers.createMockReq({
        user: { id: 'testUserId', role: 'admin' }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      const authorizeMiddleware = authorize(['admin', 'researcher']);
      
      const req = TestHelpers.createMockReq({
        user: { id: 'testUserId', role: 'user' }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Role (user) not authorized to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow multiple authorized roles', () => {
      const authorizeMiddleware = authorize(['admin', 'researcher', 'user']);
      
      // Test each role
      const roles = ['admin', 'researcher', 'user'];
      
      roles.forEach(role => {
        const req = TestHelpers.createMockReq({
          user: { id: 'testUserId', role: role }
        });
        const res = TestHelpers.createMockRes();
        const next = TestHelpers.createMockNext();

        authorizeMiddleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
        
        // Reset mocks for next iteration
        next.mockClear();
        res.status.mockClear();
      });
    });

    it('should work with single role authorization', () => {
      const authorizeMiddleware = authorize(['admin']);
      
      const req = TestHelpers.createMockReq({
        user: { id: 'testUserId', role: 'admin' }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      const authorizeMiddleware = authorize([]);
      
      const req = TestHelpers.createMockReq({
        user: { id: 'testUserId', role: 'admin' }
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Role (admin) not authorized to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle undefined user role', () => {
      const authorizeMiddleware = authorize(['admin']);
      
      const req = TestHelpers.createMockReq({
        user: { id: 'testUserId' } // No role property
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Role (undefined) not authorized to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case sensitive for roles', () => {
      const authorizeMiddleware = authorize(['admin']);
      
      const req = TestHelpers.createMockReq({
        user: { id: 'testUserId', role: 'Admin' } // Different case
      });
      const res = TestHelpers.createMockRes();
      const next = TestHelpers.createMockNext();

      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Role (Admin) not authorized to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Integration between protect and authorize', () => {
    it('should work together for complete authentication and authorization', async () => {
      const adminToken = global.testUtils.generateAdminToken();
      const authorizeMiddleware = authorize(['admin']);
      
      // First, test protect middleware
      const req = TestHelpers.createMockReq({
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });
      const res = TestHelpers.createMockRes();
      const nextProtect = TestHelpers.createMockNext();

      await protect(req, res, nextProtect);

      expect(nextProtect).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('admin');

      // Then, test authorize middleware
      const nextAuthorize = TestHelpers.createMockNext();
      authorizeMiddleware(req, res, nextAuthorize);

      expect(nextAuthorize).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unauthorized role even with valid token', async () => {
      const userToken = global.testUtils.generateToken({ id: 'userId', role: 'user' });
      const authorizeMiddleware = authorize(['admin']);
      
      // First, test protect middleware
      const req = TestHelpers.createMockReq({
        headers: {
          authorization: `Bearer ${userToken}`
        }
      });
      const res = TestHelpers.createMockRes();
      const nextProtect = TestHelpers.createMockNext();

      await protect(req, res, nextProtect);

      expect(nextProtect).toHaveBeenCalledWith();
      expect(req.user.role).toBe('user');

      // Then, test authorize middleware (should reject)
      const nextAuthorize = TestHelpers.createMockNext();
      authorizeMiddleware(req, res, nextAuthorize);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(nextAuthorize).not.toHaveBeenCalled();
    });
  });
});