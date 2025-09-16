import axios from 'axios';
import api from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000',
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn()
};
Object.defineProperty(window, 'location', { 
  value: mockLocation,
  writable: true 
});

describe('API Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Axios Instance Creation', () => {
    it('creates axios instance with correct base configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('Request Interceptor', () => {
    let mockApiInstance;
    let requestInterceptor;

    beforeEach(() => {
      // Mock the axios instance that would be returned by axios.create
      mockApiInstance = {
        interceptors: {
          request: {
            use: jest.fn()
          },
          response: {
            use: jest.fn()
          }
        }
      };

      mockedAxios.create.mockReturnValue(mockApiInstance);
      
      // Re-import to get fresh instance with our mocks
      jest.resetModules();
      require('../api');
      
      // Get the request interceptor function
      requestInterceptor = mockApiInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('adds Authorization header when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123');

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result.headers['Authorization']).toBe('Bearer test-token-123');
    });

    it('does not add Authorization header when token is null', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result.headers['Authorization']).toBeUndefined();
    });

    it('does not add Authorization header when token is empty string', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result.headers['Authorization']).toBeUndefined();
    });

    it('preserves existing headers', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');

      const config = { 
        headers: { 
          'Custom-Header': 'custom-value',
          'Another-Header': 'another-value'
        } 
      };
      const result = requestInterceptor(config);

      expect(result.headers['Custom-Header']).toBe('custom-value');
      expect(result.headers['Another-Header']).toBe('another-value');
      expect(result.headers['Authorization']).toBe('Bearer test-token');
    });

    it('overwrites existing Authorization header', () => {
      mockLocalStorage.getItem.mockReturnValue('new-token');

      const config = { 
        headers: { 
          'Authorization': 'Bearer old-token'
        } 
      };
      const result = requestInterceptor(config);

      expect(result.headers['Authorization']).toBe('Bearer new-token');
    });

    it('handles config without headers object', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');

      const config = {};
      const result = requestInterceptor(config);

      expect(result.headers['Authorization']).toBe('Bearer test-token');
    });

    it('returns the same config object reference', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result).toBe(config); // Same reference
    });

    it('handles request interceptor error correctly', () => {
      const errorHandler = mockApiInstance.interceptors.request.use.mock.calls[0][1];
      const error = new Error('Request interceptor error');

      expect(() => errorHandler(error)).rejects.toBe(error);
    });
  });

  describe('Response Interceptor', () => {
    let mockApiInstance;
    let responseSuccessHandler;
    let responseErrorHandler;

    beforeEach(() => {
      mockApiInstance = {
        interceptors: {
          request: {
            use: jest.fn()
          },
          response: {
            use: jest.fn()
          }
        }
      };

      mockedAxios.create.mockReturnValue(mockApiInstance);
      
      jest.resetModules();
      require('../api');
      
      // Get the response interceptor functions
      responseSuccessHandler = mockApiInstance.interceptors.response.use.mock.calls[0][0];
      responseErrorHandler = mockApiInstance.interceptors.response.use.mock.calls[0][1];
    });

    it('passes through successful responses unchanged', () => {
      const response = { 
        data: { message: 'Success' }, 
        status: 200,
        statusText: 'OK'
      };

      const result = responseSuccessHandler(response);

      expect(result).toBe(response);
    });

    it('clears auth data and redirects on 401 error', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      expect(() => responseErrorHandler(error)).rejects.toBe(error);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocation.href).toBe('/login');
    });

    it('does not redirect on non-401 errors', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };

      expect(() => responseErrorHandler(error)).rejects.toBe(error);
      
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe('http://localhost:3000'); // Original value
    });

    it('handles errors without response object', () => {
      const error = new Error('Network Error');

      expect(() => responseErrorHandler(error)).rejects.toBe(error);
      
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe('http://localhost:3000');
    });

    it('handles errors with response but no status', () => {
      const error = {
        response: {
          data: { message: 'Some error' }
          // status is undefined
        }
      };

      expect(() => responseErrorHandler(error)).rejects.toBe(error);
      
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it('handles 401 error without response.data', () => {
      const error = {
        response: {
          status: 401
          // data is undefined
        }
      };

      expect(() => responseErrorHandler(error)).rejects.toBe(error);
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('API Instance Usage', () => {
    let apiInstance;

    beforeEach(() => {
      // Create a mock API instance
      apiInstance = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };

      mockedAxios.create.mockReturnValue(apiInstance);
    });

    it('provides standard HTTP methods', () => {
      jest.resetModules();
      const api = require('../api').default;

      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.delete).toBe('function');
    });

    it('can make GET requests', async () => {
      const mockResponse = { data: { users: [] } };
      apiInstance.get.mockResolvedValue(mockResponse);

      jest.resetModules();
      const api = require('../api').default;
      
      const result = await api.get('/users');

      expect(apiInstance.get).toHaveBeenCalledWith('/users');
      expect(result).toBe(mockResponse);
    });

    it('can make POST requests', async () => {
      const mockData = { name: 'Test User' };
      const mockResponse = { data: { id: 1, ...mockData } };
      apiInstance.post.mockResolvedValue(mockResponse);

      jest.resetModules();
      const api = require('../api').default;
      
      const result = await api.post('/users', mockData);

      expect(apiInstance.post).toHaveBeenCalledWith('/users', mockData);
      expect(result).toBe(mockResponse);
    });

    it('can make PUT requests', async () => {
      const mockData = { name: 'Updated User' };
      const mockResponse = { data: { id: 1, ...mockData } };
      apiInstance.put.mockResolvedValue(mockResponse);

      jest.resetModules();
      const api = require('../api').default;
      
      const result = await api.put('/users/1', mockData);

      expect(apiInstance.put).toHaveBeenCalledWith('/users/1', mockData);
      expect(result).toBe(mockResponse);
    });

    it('can make DELETE requests', async () => {
      const mockResponse = { data: { success: true } };
      apiInstance.delete.mockResolvedValue(mockResponse);

      jest.resetModules();
      const api = require('../api').default;
      
      const result = await api.delete('/users/1');

      expect(apiInstance.delete).toHaveBeenCalledWith('/users/1');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Error Handling Integration', () => {
    let apiInstance;
    let responseErrorHandler;

    beforeEach(() => {
      apiInstance = {
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };

      mockedAxios.create.mockReturnValue(apiInstance);
      
      jest.resetModules();
      require('../api');
      
      responseErrorHandler = apiInstance.interceptors.response.use.mock.calls[0][1];
    });

    it('handles multiple 401 errors correctly', () => {
      const error1 = { response: { status: 401 } };
      const error2 = { response: { status: 401 } };

      expect(() => responseErrorHandler(error1)).rejects.toBe(error1);
      expect(() => responseErrorHandler(error2)).rejects.toBe(error2);

      // Should clear localStorage and redirect both times
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(4); // 2 calls × 2 errors
      expect(mockLocation.href).toBe('/login');
    });

    it('handles concurrent requests with 401 error', () => {
      const error = { response: { status: 401 } };

      // Simulate multiple concurrent requests failing
      Promise.all([
        expect(() => responseErrorHandler(error)).rejects.toBe(error),
        expect(() => responseErrorHandler(error)).rejects.toBe(error),
        expect(() => responseErrorHandler(error)).rejects.toBe(error)
      ]);

      // Should handle all gracefully
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Edge Cases', () => {
    let mockApiInstance;
    let requestInterceptor;
    let responseErrorHandler;

    beforeEach(() => {
      mockApiInstance = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };

      mockedAxios.create.mockReturnValue(mockApiInstance);
      
      jest.resetModules();
      require('../api');
      
      requestInterceptor = mockApiInstance.interceptors.request.use.mock.calls[0][0];
      responseErrorHandler = mockApiInstance.interceptors.response.use.mock.calls[0][1];
    });

    it('handles localStorage errors gracefully in request interceptor', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const config = { headers: {} };
      
      expect(() => {
        requestInterceptor(config);
      }).not.toThrow();

      expect(config.headers['Authorization']).toBeUndefined();
    });

    it('handles localStorage errors gracefully in response interceptor', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const error = { response: { status: 401 } };

      expect(() => responseErrorHandler(error)).rejects.toBe(error);
      // Should not crash even if localStorage operations fail
    });

    it('handles window.location assignment errors', () => {
      const originalHref = mockLocation.href;
      Object.defineProperty(mockLocation, 'href', {
        set: () => {
          throw new Error('Navigation blocked');
        },
        get: () => originalHref
      });

      const error = { response: { status: 401 } };

      expect(() => responseErrorHandler(error)).rejects.toBe(error);
      // Should handle navigation errors gracefully
    });
  });

  describe('TypeScript-like Type Safety (Runtime Checks)', () => {
    let mockApiInstance;
    let requestInterceptor;

    beforeEach(() => {
      mockApiInstance = {
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };

      mockedAxios.create.mockReturnValue(mockApiInstance);
      
      jest.resetModules();
      require('../api');
      
      requestInterceptor = mockApiInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('handles non-string token values', () => {
      mockLocalStorage.getItem.mockReturnValue(12345); // Number instead of string

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result.headers['Authorization']).toBe('Bearer 12345');
    });

    it('handles boolean token values', () => {
      mockLocalStorage.getItem.mockReturnValue(true);

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result.headers['Authorization']).toBe('Bearer true');
    });

    it('handles object token values', () => {
      mockLocalStorage.getItem.mockReturnValue({ token: 'actual-token' });

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result.headers['Authorization']).toBe('Bearer [object Object]');
    });
  });
});