import { rest } from 'msw';

const API_BASE = 'http://localhost:5000/api';

// Mock data
const mockUsers = [
  {
    _id: '64f8b123456789abcdef0001',
    username: 'admin',
    role: 'admin',
    createdAt: new Date('2023-10-15T08:00:00Z'),
  },
  {
    _id: '64f8b123456789abcdef0002',
    username: 'researcher',
    role: 'researcher',
    createdAt: new Date('2023-10-15T08:30:00Z'),
  },
  {
    _id: '64f8b123456789abcdef0003',
    username: 'testuser',
    role: 'user',
    createdAt: new Date('2023-10-15T09:00:00Z'),
  },
];

const mockSteps = [
  {
    _id: '64f8b123456789abcdef0101',
    name: 'Background Music',
    type: 'Music',
    duration: 120,
    details: { volume: 0.7, track: 'background.mp3' },
    createdBy: '64f8b123456789abcdef0002',
    createdAt: new Date('2023-10-15T09:00:00Z'),
  },
  {
    _id: '64f8b123456789abcdef0102',
    name: 'Feeling Question',
    type: 'Question',
    duration: 30,
    details: { questionText: 'How are you feeling?', options: ['Good', 'Neutral', 'Bad'] },
    createdBy: '64f8b123456789abcdef0002',
    createdAt: new Date('2023-10-15T09:15:00Z'),
  },
  {
    _id: '64f8b123456789abcdef0103',
    name: 'Rest Period',
    type: 'Rest',
    duration: 60,
    details: { instructions: 'Please relax and close your eyes' },
    createdBy: '64f8b123456789abcdef0002',
    createdAt: new Date('2023-10-15T09:30:00Z'),
  },
];

const mockTrials = [
  {
    _id: '64f8b123456789abcdef0201',
    name: 'Music and Questions Trial',
    description: 'A trial combining music and questions',
    steps: [
      { step: mockSteps[0], order: 1 },
      { step: mockSteps[1], order: 2 },
    ],
    createdBy: '64f8b123456789abcdef0002',
    createdAt: new Date('2023-10-15T10:00:00Z'),
  },
  {
    _id: '64f8b123456789abcdef0202',
    name: 'Rest Trial',
    description: 'A simple rest trial',
    steps: [
      { step: mockSteps[2], order: 1 },
    ],
    createdBy: '64f8b123456789abcdef0002',
    createdAt: new Date('2023-10-15T10:15:00Z'),
  },
];

const mockExperiments = [
  {
    _id: '64f8b123456789abcdef0301',
    name: 'Pilot Study',
    description: 'Initial pilot study for testing',
    status: 'Draft',
    trials: [
      { trial: mockTrials[0], order: 1 },
      { trial: mockTrials[1], order: 2 },
    ],
    eegRecordings: [],
    createdBy: '64f8b123456789abcdef0002',
    createdAt: new Date('2023-10-15T11:00:00Z'),
  },
  {
    _id: '64f8b123456789abcdef0302',
    name: 'Active Study',
    description: 'Currently running study',
    status: 'Active',
    trials: [
      { trial: mockTrials[0], order: 1 },
    ],
    eegRecordings: [],
    createdBy: '64f8b123456789abcdef0002',
    createdAt: new Date('2023-10-15T11:30:00Z'),
  },
];

const mockResponses = [
  {
    _id: '64f8b123456789abcdef0401',
    experimentId: '64f8b123456789abcdef0301',
    experimentName: 'Pilot Study',
    stepId: '64f8b123456789abcdef0102',
    response: 'Good',
    timestamp: new Date('2023-10-15T12:00:00Z'),
    timeSinceStart: 15000,
    trialIndex: 0,
    stepIndex: 1,
    createdAt: new Date('2023-10-15T12:00:00Z'),
  },
];

export const handlers = [
  // Authentication endpoints
  rest.post(`${API_BASE}/auth/login`, (req, res, ctx) => {
    const { username, password } = req.body;
    
    if (username === 'testuser' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          token: 'mock-jwt-token',
          user: mockUsers.find(u => u.username === username),
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid credentials' })
    );
  }),

  rest.post(`${API_BASE}/auth/register`, (req, res, ctx) => {
    const { username, password } = req.body;
    
    // Check if user already exists
    if (mockUsers.find(u => u.username === username)) {
      return res(
        ctx.status(400),
        ctx.json({ message: 'User already exists' })
      );
    }
    
    const newUser = {
      _id: `64f8b123456789abcdef000${mockUsers.length + 1}`,
      username,
      role: 'user',
      createdAt: new Date(),
    };
    
    mockUsers.push(newUser);
    
    return res(
      ctx.status(201),
      ctx.json({ message: 'User registered successfully' })
    );
  }),

  rest.get(`${API_BASE}/auth/me`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({ message: 'No token provided' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(mockUsers[2]) // Return testuser
    );
  }),

  // Steps endpoints
  rest.get(`${API_BASE}/steps`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockSteps)
    );
  }),

  rest.get(`${API_BASE}/steps/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const step = mockSteps.find(s => s._id === id);
    
    if (!step) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Step not found' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(step)
    );
  }),

  rest.post(`${API_BASE}/steps`, (req, res, ctx) => {
    const { name, type, duration, details } = req.body;
    
    const newStep = {
      _id: `64f8b123456789abcdef010${mockSteps.length + 1}`,
      name,
      type,
      duration,
      details: details || {},
      createdBy: '64f8b123456789abcdef0002',
      createdAt: new Date(),
    };
    
    mockSteps.push(newStep);
    
    return res(
      ctx.status(201),
      ctx.json(newStep)
    );
  }),

  rest.put(`${API_BASE}/steps/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const stepIndex = mockSteps.findIndex(s => s._id === id);
    
    if (stepIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Step not found' })
      );
    }
    
    mockSteps[stepIndex] = { ...mockSteps[stepIndex], ...req.body };
    
    return res(
      ctx.status(200),
      ctx.json(mockSteps[stepIndex])
    );
  }),

  rest.delete(`${API_BASE}/steps/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const stepIndex = mockSteps.findIndex(s => s._id === id);
    
    if (stepIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Step not found' })
      );
    }
    
    mockSteps.splice(stepIndex, 1);
    
    return res(
      ctx.status(200),
      ctx.json({ message: 'Step removed' })
    );
  }),

  // Trials endpoints
  rest.get(`${API_BASE}/trials`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockTrials)
    );
  }),

  rest.get(`${API_BASE}/trials/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const trial = mockTrials.find(t => t._id === id);
    
    if (!trial) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Trial not found' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(trial)
    );
  }),

  rest.post(`${API_BASE}/trials`, (req, res, ctx) => {
    const { name, description, steps } = req.body;
    
    const newTrial = {
      _id: `64f8b123456789abcdef020${mockTrials.length + 1}`,
      name,
      description: description || '',
      steps: steps || [],
      createdBy: '64f8b123456789abcdef0002',
      createdAt: new Date(),
    };
    
    mockTrials.push(newTrial);
    
    return res(
      ctx.status(201),
      ctx.json(newTrial)
    );
  }),

  rest.put(`${API_BASE}/trials/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const trialIndex = mockTrials.findIndex(t => t._id === id);
    
    if (trialIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Trial not found' })
      );
    }
    
    mockTrials[trialIndex] = { ...mockTrials[trialIndex], ...req.body };
    
    return res(
      ctx.status(200),
      ctx.json(mockTrials[trialIndex])
    );
  }),

  rest.delete(`${API_BASE}/trials/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const trialIndex = mockTrials.findIndex(t => t._id === id);
    
    if (trialIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Trial not found' })
      );
    }
    
    mockTrials.splice(trialIndex, 1);
    
    return res(
      ctx.status(200),
      ctx.json({ message: 'Trial removed' })
    );
  }),

  // Experiments endpoints
  rest.get(`${API_BASE}/experiments`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockExperiments)
    );
  }),

  rest.get(`${API_BASE}/experiments/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const experiment = mockExperiments.find(e => e._id === id);
    
    if (!experiment) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Experiment not found' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(experiment)
    );
  }),

  rest.post(`${API_BASE}/experiments`, (req, res, ctx) => {
    const { name, description, trials } = req.body;
    
    const newExperiment = {
      _id: `64f8b123456789abcdef030${mockExperiments.length + 1}`,
      name,
      description: description || '',
      status: 'Draft',
      trials: trials || [],
      eegRecordings: [],
      createdBy: '64f8b123456789abcdef0002',
      createdAt: new Date(),
    };
    
    mockExperiments.push(newExperiment);
    
    return res(
      ctx.status(201),
      ctx.json(newExperiment)
    );
  }),

  rest.put(`${API_BASE}/experiments/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const experimentIndex = mockExperiments.findIndex(e => e._id === id);
    
    if (experimentIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Experiment not found' })
      );
    }
    
    mockExperiments[experimentIndex] = { ...mockExperiments[experimentIndex], ...req.body };
    
    return res(
      ctx.status(200),
      ctx.json(mockExperiments[experimentIndex])
    );
  }),

  rest.post(`${API_BASE}/experiments/:id/run`, (req, res, ctx) => {
    const { id } = req.params;
    const experiment = mockExperiments.find(e => e._id === id);
    
    if (!experiment) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Experiment not found' })
      );
    }
    
    if (experiment.trials.length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Cannot run experiment without trials' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({ message: 'Experiment started successfully' })
    );
  }),

  rest.delete(`${API_BASE}/experiments/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const experimentIndex = mockExperiments.findIndex(e => e._id === id);
    
    if (experimentIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Experiment not found' })
      );
    }
    
    mockExperiments.splice(experimentIndex, 1);
    
    return res(
      ctx.status(200),
      ctx.json({ message: 'Experiment removed' })
    );
  }),

  // Responses endpoints
  rest.get(`${API_BASE}/responses`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockResponses)
    );
  }),

  rest.get(`${API_BASE}/responses/experiment/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const experimentResponses = mockResponses.filter(r => r.experimentId === id);
    
    return res(
      ctx.status(200),
      ctx.json(experimentResponses)
    );
  }),

  rest.post(`${API_BASE}/responses`, (req, res, ctx) => {
    const responseData = req.body;
    
    const newResponse = {
      _id: `64f8b123456789abcdef040${mockResponses.length + 1}`,
      ...responseData,
      createdAt: new Date(),
    };
    
    mockResponses.push(newResponse);
    
    return res(
      ctx.status(201),
      ctx.json(newResponse)
    );
  }),

  // Users endpoints (admin only)
  rest.get(`${API_BASE}/users`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockUsers)
    );
  }),

  rest.get(`${API_BASE}/users/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const user = mockUsers.find(u => u._id === id);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'User not found' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(user)
    );
  }),

  rest.put(`${API_BASE}/users/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const userIndex = mockUsers.findIndex(u => u._id === id);
    
    if (userIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'User not found' })
      );
    }
    
    if (mockUsers[userIndex].username === 'md' && req.body.role !== 'admin') {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Cannot change admin user role' })
      );
    }
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...req.body };
    
    return res(
      ctx.status(200),
      ctx.json(mockUsers[userIndex])
    );
  }),

  rest.delete(`${API_BASE}/users/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const userIndex = mockUsers.findIndex(u => u._id === id);
    
    if (userIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'User not found' })
      );
    }
    
    if (mockUsers[userIndex].username === 'md') {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Cannot delete admin user' })
      );
    }
    
    mockUsers.splice(userIndex, 1);
    
    return res(
      ctx.status(200),
      ctx.json({ message: 'User removed' })
    );
  }),

  // OpenBCI endpoints
  rest.post(`${API_BASE}/openbci/connect`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Successfully connected to OpenBCI device',
        data: { status: 'success', board_type: 'cyton_daisy' }
      })
    );
  }),

  rest.get(`${API_BASE}/openbci/status`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        connected: true,
        message: 'Connected to COM3',
        data: { board_id: 0, sampling_rate: 250 }
      })
    );
  }),

  rest.post(`${API_BASE}/openbci/disconnect`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Successfully disconnected from OpenBCI device'
      })
    );
  }),

  rest.post(`${API_BASE}/openbci/start-recording`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Successfully started EEG recording'
      })
    );
  }),

  rest.post(`${API_BASE}/openbci/stop-recording`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Successfully stopped and saved EEG recording',
        recordingId: '64f8b123456789abcdef0501'
      })
    );
  }),

  rest.get(`${API_BASE}/openbci/serial-ports`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        ports: ['COM3', 'COM4', 'COM5']
      })
    );
  }),

  // File upload endpoint
  rest.post(`${API_BASE}/upload`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        filePath: '/uploads/test-file.mp3',
        message: 'File uploaded successfully'
      })
    );
  }),

  // Fallback for unhandled requests
  rest.get('*', (req, res, ctx) => {
    console.warn('Unhandled GET request:', req.url.toString());
    return res(
      ctx.status(404),
      ctx.json({ message: 'Not found' })
    );
  }),

  rest.post('*', (req, res, ctx) => {
    console.warn('Unhandled POST request:', req.url.toString());
    return res(
      ctx.status(404),
      ctx.json({ message: 'Not found' })
    );
  }),
];