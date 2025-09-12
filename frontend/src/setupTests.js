// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Service Worker setup (disabled for now due to dependency issues)
// import { server } from './test/mocks/server';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

// Establish API mocking before all tests (disabled for now)
// beforeAll(() => {
//   server.listen({
//     onUnhandledRequest: 'error',
//   });
// });

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  // server.resetHandlers();
  // Clear all mocks after each test
  jest.clearAllMocks();
  // Clear localStorage and sessionStorage
  localStorageMock.clear.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Clean up after the tests are finished
// afterAll(() => {
//   server.close();
// });

// Increase timeout for integration tests
jest.setTimeout(10000);

// Suppress console errors during tests unless explicitly needed
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is deprecated')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock Audio constructor for audio-related tests
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 180,
  src: '',
  volume: 1,
  muted: false,
  ended: false,
  paused: true
}));

window.HTMLMediaElement.prototype.load = () => {};
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.addTextTrack = () => {};

// Add custom test utilities to global scope
global.testUtils = {
  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Mock file for upload tests
  createMockFile: (name = 'test.mp3', size = 1024, type = 'audio/mpeg') => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  },
  
  // Mock experiment data
  mockExperiment: {
    _id: '64f8b123456789abcdef0123',
    name: 'Test Experiment',
    description: 'A test experiment for unit tests',
    status: 'Draft',
    trials: [],
    createdAt: new Date('2023-10-15T10:00:00Z'),
  },
  
  // Mock user data
  mockUser: {
    _id: '64f8b123456789abcdef0456',
    username: 'testuser',
    role: 'researcher',
    createdAt: new Date('2023-10-15T09:00:00Z'),
  },
  
  // Mock step data
  mockStep: {
    _id: '64f8b123456789abcdef0789',
    name: 'Test Step',
    type: 'Music',
    duration: 60,
    details: { volume: 0.8 },
    createdAt: new Date('2023-10-15T09:30:00Z'),
  },
  
  // Mock trial data
  mockTrial: {
    _id: '64f8b123456789abcdef0012',
    name: 'Test Trial',
    description: 'A test trial',
    steps: [],
    createdAt: new Date('2023-10-15T09:45:00Z'),
  },
};