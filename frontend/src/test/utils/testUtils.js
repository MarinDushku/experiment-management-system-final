import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/authContext';
import { AlertProvider } from '../../contexts/alertContext';

// Mock authentication context for testing
const MockAuthProvider = ({ children, user = null, isAuthenticated = false }) => {
  const mockAuthContext = {
    user,
    token: isAuthenticated ? 'mock-token' : null,
    isAuthenticated,
    login: jest.fn().mockResolvedValue({}),
    register: jest.fn().mockResolvedValue({}),
    logout: jest.fn(),
    loading: false,
  };

  return React.createElement(
    AuthProvider,
    { value: mockAuthContext },
    children
  );
};

// Mock alert context for testing
const MockAlertProvider = ({ children }) => {
  const mockAlertContext = {
    alerts: [],
    setAlert: jest.fn(),
    removeAlert: jest.fn(),
  };

  return React.createElement(
    AlertProvider,
    { value: mockAlertContext },
    children
  );
};

// Custom render function that includes providers
const customRender = (
  ui,
  {
    initialEntries = ['/'],
    user = null,
    isAuthenticated = false,
    route = '/',
    ...renderOptions
  } = {}
) => {
  // If route is provided, set it as the initial entry
  if (route !== '/') {
    initialEntries = [route];
  }

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <MockAuthProvider user={user} isAuthenticated={isAuthenticated}>
        <MockAlertProvider>
          {children}
        </MockAlertProvider>
      </MockAuthProvider>
    </BrowserRouter>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Render with authenticated user
const renderWithAuth = (ui, options = {}) => {
  const defaultUser = {
    _id: '64f8b123456789abcdef0003',
    username: 'testuser',
    role: 'researcher',
  };

  return customRender(ui, {
    user: defaultUser,
    isAuthenticated: true,
    ...options,
  });
};

// Render with admin user
const renderWithAdmin = (ui, options = {}) => {
  const adminUser = {
    _id: '64f8b123456789abcdef0001',
    username: 'admin',
    role: 'admin',
  };

  return customRender(ui, {
    user: adminUser,
    isAuthenticated: true,
    ...options,
  });
};

// Render without authentication
const renderWithoutAuth = (ui, options = {}) => {
  return customRender(ui, {
    user: null,
    isAuthenticated: false,
    ...options,
  });
};

// Mock file for testing file uploads
const createMockFile = (name = 'test.mp3', size = 1024, type = 'audio/mpeg') => {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
};

// Mock HTML5 drag and drop events
const createMockDragEvent = (type, files = []) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
  });
  return event;
};

// Mock FormData for testing form submissions
const createMockFormData = (data = {}) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(item => formData.append(key, item));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};

// Wait for loading states to complete
const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
  }, { timeout: 3000 });
};

// Wait for specific element to appear
const waitForElement = async (selector) => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(document.querySelector(selector)).toBeInTheDocument();
  }, { timeout: 3000 });
};

// Mock experiment data factory
const createMockExperiment = (overrides = {}) => ({
  _id: '64f8b123456789abcdef0301',
  name: 'Test Experiment',
  description: 'A test experiment for unit tests',
  status: 'Draft',
  trials: [],
  eegRecordings: [],
  createdBy: '64f8b123456789abcdef0002',
  createdAt: new Date('2023-10-15T11:00:00Z').toISOString(),
  ...overrides,
});

// Mock step data factory
const createMockStep = (overrides = {}) => ({
  _id: '64f8b123456789abcdef0101',
  name: 'Test Step',
  type: 'Music',
  duration: 60,
  details: { volume: 0.8 },
  createdBy: '64f8b123456789abcdef0002',
  createdAt: new Date('2023-10-15T09:00:00Z').toISOString(),
  ...overrides,
});

// Mock trial data factory
const createMockTrial = (overrides = {}) => ({
  _id: '64f8b123456789abcdef0201',
  name: 'Test Trial',
  description: 'A test trial for unit tests',
  steps: [],
  createdBy: '64f8b123456789abcdef0002',
  createdAt: new Date('2023-10-15T10:00:00Z').toISOString(),
  ...overrides,
});

// Mock user data factory
const createMockUser = (overrides = {}) => ({
  _id: '64f8b123456789abcdef0003',
  username: 'testuser',
  role: 'user',
  createdAt: new Date('2023-10-15T09:00:00Z').toISOString(),
  ...overrides,
});

// Mock response data factory
const createMockResponse = (overrides = {}) => ({
  _id: '64f8b123456789abcdef0401',
  experimentId: '64f8b123456789abcdef0301',
  experimentName: 'Test Experiment',
  stepId: '64f8b123456789abcdef0101',
  response: 'Test response',
  timestamp: new Date('2023-10-15T12:00:00Z').toISOString(),
  timeSinceStart: 15000,
  trialIndex: 0,
  stepIndex: 0,
  createdAt: new Date('2023-10-15T12:00:00Z').toISOString(),
  ...overrides,
});

// Mock API responses
const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {},
});

const mockApiError = (message = 'API Error', status = 500) => {
  const error = new Error(message);
  error.response = {
    data: { message },
    status,
    statusText: 'Error',
  };
  return error;
};

// Test data sets for common scenarios
const testDataSets = {
  validStepData: {
    name: 'Valid Test Step',
    type: 'Music',
    duration: 120,
    details: { volume: 0.7, track: 'test.mp3' },
  },
  invalidStepData: {
    name: '', // Invalid: empty name
    type: 'InvalidType', // Invalid: not in enum
    duration: -1, // Invalid: negative duration
  },
  validTrialData: {
    name: 'Valid Test Trial',
    description: 'A valid trial for testing',
    steps: [
      { step: '64f8b123456789abcdef0101', order: 1 },
      { step: '64f8b123456789abcdef0102', order: 2 },
    ],
  },
  validExperimentData: {
    name: 'Valid Test Experiment',
    description: 'A valid experiment for testing',
    status: 'Draft',
    trials: [
      { trial: '64f8b123456789abcdef0201', order: 1 },
    ],
  },
  validUserData: {
    username: 'newuser',
    password: 'password123',
    role: 'user',
  },
  loginCredentials: {
    valid: { username: 'testuser', password: 'password123' },
    invalid: { username: 'wronguser', password: 'wrongpass' },
  },
};

// Custom matchers
const customMatchers = {
  toBeLoading: (element) => {
    const pass = element.getAttribute('data-testid') === 'loading' ||
                 element.classList.contains('loading') ||
                 element.querySelector('[data-testid="loading"]') !== null;
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be loading`
          : `Expected element to be loading`,
    };
  },
  
  toHaveAlert: (container, type, message) => {
    const alerts = container.querySelectorAll('.alert, [role="alert"]');
    const matchingAlert = Array.from(alerts).find(alert => {
      const hasType = type ? alert.classList.contains(type) || alert.classList.contains(`alert-${type}`) : true;
      const hasMessage = message ? alert.textContent.includes(message) : true;
      return hasType && hasMessage;
    });
    
    const pass = !!matchingAlert;
    
    return {
      pass,
      message: () =>
        pass
          ? `Expected not to find alert${type ? ` of type "${type}"` : ''}${message ? ` with message "${message}"` : ''}`
          : `Expected to find alert${type ? ` of type "${type}"` : ''}${message ? ` with message "${message}"` : ''}`,
    };
  },
};

// Export everything
export {
  customRender as render,
  renderWithAuth,
  renderWithAdmin,
  renderWithoutAuth,
  createMockFile,
  createMockDragEvent,
  createMockFormData,
  waitForLoadingToFinish,
  waitForElement,
  createMockExperiment,
  createMockStep,
  createMockTrial,
  createMockUser,
  createMockResponse,
  mockApiResponse,
  mockApiError,
  testDataSets,
  customMatchers,
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';