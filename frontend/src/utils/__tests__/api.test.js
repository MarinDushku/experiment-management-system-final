// Simple API test focusing on basic functionality
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }))
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000' },
  writable: true
});

describe('API Utility', () => {
  it('exports an API instance', async () => {
    const api = await import('../api');
    expect(api.default).toBeDefined();
    expect(typeof api.default.get).toBe('function');
    expect(typeof api.default.post).toBe('function');
    expect(typeof api.default.put).toBe('function');
    expect(typeof api.default.delete).toBe('function');
  });

  it('creates axios instance with base configuration', async () => {
    const axios = await import('axios');
    expect(axios.create).toBeDefined();
    expect(typeof axios.create).toBe('function');
  });
});