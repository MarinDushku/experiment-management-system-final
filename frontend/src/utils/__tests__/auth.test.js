import { isAuthenticated, getCurrentUser, hasRole, logout } from '../auth';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('returns true when both token and user exist', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return JSON.stringify({ id: '1', username: 'testuser' });
        return null;
      });

      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when token is missing', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return null;
        if (key === 'user') return JSON.stringify({ id: '1', username: 'testuser' });
        return null;
      });

      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when user is missing', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return null;
        return null;
      });

      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when both token and user are missing', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when token is empty string', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return '';
        if (key === 'user') return JSON.stringify({ id: '1', username: 'testuser' });
        return null;
      });

      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when user is empty string', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return '';
        return null;
      });

      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('returns parsed user object when valid JSON is stored', () => {
      const mockUser = { id: '1', username: 'testuser', role: 'researcher' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
    });

    it('returns null when no user is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getCurrentUser();

      expect(result).toBeNull();
    });

    it('returns null when user data is empty string', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = getCurrentUser();

      expect(result).toBeNull();
    });

    it('returns null and logs error when invalid JSON is stored', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLocalStorage.getItem.mockReturnValue('invalid-json{');

      const result = getCurrentUser();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing user from localStorage', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('handles nested object properties correctly', () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        role: 'admin',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        permissions: ['read', 'write', 'delete']
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(result.profile.firstName).toBe('John');
      expect(result.permissions).toContain('read');
    });
  });

  describe('hasRole', () => {
    const mockUser = { id: '1', username: 'testuser', role: 'researcher' };

    beforeEach(() => {
      // Mock isAuthenticated to return true and getCurrentUser to return mock user
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });
    });

    it('returns true when user has the exact required role (string)', () => {
      expect(hasRole('researcher')).toBe(true);
    });

    it('returns false when user does not have the required role (string)', () => {
      expect(hasRole('admin')).toBe(false);
    });

    it('returns true when user has one of the required roles (array)', () => {
      expect(hasRole(['admin', 'researcher'])).toBe(true);
    });

    it('returns true when user has all required roles in array', () => {
      expect(hasRole(['researcher'])).toBe(true);
    });

    it('returns false when user has none of the required roles (array)', () => {
      expect(hasRole(['admin', 'user'])).toBe(false);
    });

    it('returns false when user is not authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(hasRole('researcher')).toBe(false);
      expect(hasRole(['researcher', 'admin'])).toBe(false);
    });

    it('returns false when getCurrentUser returns null', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return 'invalid-json{';
        return null;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(hasRole('researcher')).toBe(false);

      consoleSpy.mockRestore();
    });

    it('returns false when user object has no role property', () => {
      const userWithoutRole = { id: '1', username: 'testuser' };
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return JSON.stringify(userWithoutRole);
        return null;
      });

      expect(hasRole('researcher')).toBe(false);
    });

    it('handles empty array of roles', () => {
      expect(hasRole([])).toBe(false);
    });

    it('handles null and undefined role requirements', () => {
      expect(hasRole(null)).toBe(false);
      expect(hasRole(undefined)).toBe(false);
    });

    it('is case sensitive for role checking', () => {
      expect(hasRole('Researcher')).toBe(false); // Capital R
      expect(hasRole('RESEARCHER')).toBe(false); // All caps
    });

    it('works with different role types', () => {
      const adminUser = { id: '2', username: 'admin', role: 'admin' };
      const userRoleUser = { id: '3', username: 'user', role: 'user' };

      // Test admin user
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return JSON.stringify(adminUser);
        return null;
      });

      expect(hasRole('admin')).toBe(true);
      expect(hasRole(['admin', 'researcher'])).toBe(true);
      expect(hasRole('researcher')).toBe(false);

      // Test user role user
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return JSON.stringify(userRoleUser);
        return null;
      });

      expect(hasRole('user')).toBe(true);
      expect(hasRole(['user', 'researcher'])).toBe(true);
      expect(hasRole('admin')).toBe(false);
    });
  });

  describe('logout', () => {
    it('removes both token and user from localStorage', () => {
      logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
    });

    it('does not throw error when called multiple times', () => {
      expect(() => {
        logout();
        logout();
        logout();
      }).not.toThrow();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(6); // 2 calls × 3 invocations
    });

    it('works even when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(() => logout()).not.toThrow();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Integration Tests', () => {
    it('correctly handles full authentication flow', () => {
      // Initially not authenticated
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(isAuthenticated()).toBe(false);
      expect(getCurrentUser()).toBeNull();
      expect(hasRole('researcher')).toBe(false);

      // Simulate login by setting token and user
      const user = { id: '1', username: 'testuser', role: 'researcher' };
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'auth-token';
        if (key === 'user') return JSON.stringify(user);
        return null;
      });

      expect(isAuthenticated()).toBe(true);
      expect(getCurrentUser()).toEqual(user);
      expect(hasRole('researcher')).toBe(true);
      expect(hasRole('admin')).toBe(false);

      // Simulate logout
      logout();
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(isAuthenticated()).toBe(false);
      expect(getCurrentUser()).toBeNull();
      expect(hasRole('researcher')).toBe(false);
    });

    it('handles corrupted localStorage data gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Corrupted user data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'user') return '{broken-json';
        return null;
      });

      expect(isAuthenticated()).toBe(true); // Token exists, user data exists (even if corrupted)
      expect(getCurrentUser()).toBeNull(); // But parsing fails
      expect(hasRole('researcher')).toBe(false); // And role check fails

      consoleSpy.mockRestore();
    });
  });
});