# API Usage Examples

This document provides comprehensive examples of how to use the Research Experiment Management System API.

## Authentication Examples

### Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher01",
    "password": "securepassword123",
    "role": "researcher"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8b123456789abcdef0001",
    "username": "researcher01",
    "role": "researcher",
    "createdAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher01",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8b123456789abcdef0001",
    "username": "researcher01",
    "role": "researcher"
  }
}
```

## Experiment Management Examples

### Create a New Experiment

```bash
curl -X POST http://localhost:5000/api/experiments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Memory Recall Study with EEG",
    "description": "A comprehensive study investigating memory recall patterns using EEG data collection and audio stimuli",
    "status": "Draft"
  }'
```

**Response:**
```json
{
  "_id": "64f8b123456789abcdef0002",
  "name": "Memory Recall Study with EEG",
  "description": "A comprehensive study investigating memory recall patterns using EEG data collection and audio stimuli",
  "status": "Draft",
  "createdBy": {
    "_id": "64f8b123456789abcdef0001",
    "username": "researcher01",
    "role": "researcher"
  },
  "trials": [],
  "createdAt": "2024-01-15T10:35:22.456Z",
  "updatedAt": "2024-01-15T10:35:22.456Z"
}
```

### Get All Experiments

```bash
curl -X GET http://localhost:5000/api/experiments \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Filter Experiments by Status

```bash
curl -X GET "http://localhost:5000/api/experiments?status=Active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Update Experiment Status

```bash
curl -X PUT http://localhost:5000/api/experiments/64f8b123456789abcdef0002 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "status": "Active"
  }'
```

## Step Creation Examples

### Audio Step

```bash
curl -X POST http://localhost:5000/api/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Relaxing Music Stimulus",
    "type": "Audio",
    "duration": 60,
    "content": "/uploads/audio/relaxing_music.mp3",
    "description": "Play relaxing background music for 60 seconds to establish baseline"
  }'
```

### Visual Step

```bash
curl -X POST http://localhost:5000/api/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Memory Task Display",
    "type": "Visual",
    "duration": 30,
    "content": "Show sequence of numbers: 7-3-9-2-8",
    "description": "Display number sequence for memorization"
  }'
```

### EEG Recording Step

```bash
curl -X POST http://localhost:5000/api/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "EEG Baseline Recording",
    "type": "EEG",
    "duration": 120,
    "content": "baseline_recording",
    "description": "Record baseline EEG activity for 2 minutes with eyes closed"
  }'
```

### Text Instruction Step

```bash
curl -X POST http://localhost:5000/api/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Memory Recall Instructions",
    "type": "Text",
    "duration": 15,
    "content": "Please recall and write down the sequence of numbers you saw earlier.",
    "description": "Instructions for memory recall task"
  }'
```

## Trial Management Examples

### Create a Complete Trial

```bash
curl -X POST http://localhost:5000/api/trials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Trial 1 - Baseline Memory",
    "experiment": "64f8b123456789abcdef0002",
    "participant": "64f8b123456789abcdef0003",
    "steps": [
      "64f8b123456789abcdef0004",
      "64f8b123456789abcdef0005",
      "64f8b123456789abcdef0006",
      "64f8b123456789abcdef0007"
    ]
  }'
```

**Response:**
```json
{
  "_id": "64f8b123456789abcdef0008",
  "name": "Trial 1 - Baseline Memory",
  "experiment": "64f8b123456789abcdef0002",
  "participant": {
    "_id": "64f8b123456789abcdef0003",
    "username": "participant01",
    "role": "user"
  },
  "steps": [
    {
      "_id": "64f8b123456789abcdef0004",
      "name": "Relaxing Music Stimulus",
      "type": "Audio",
      "duration": 60
    },
    {
      "_id": "64f8b123456789abcdef0005",
      "name": "Memory Task Display",
      "type": "Visual",
      "duration": 30
    },
    {
      "_id": "64f8b123456789abcdef0006",
      "name": "EEG Baseline Recording",
      "type": "EEG",
      "duration": 120
    },
    {
      "_id": "64f8b123456789abcdef0007",
      "name": "Memory Recall Instructions",
      "type": "Text",
      "duration": 15
    }
  ],
  "results": {},
  "createdBy": {
    "_id": "64f8b123456789abcdef0001",
    "username": "researcher01",
    "role": "researcher"
  },
  "createdAt": "2024-01-15T10:45:33.789Z",
  "updatedAt": "2024-01-15T10:45:33.789Z"
}
```

## OpenBCI/EEG Data Collection Examples

### Check OpenBCI Device Status

```bash
curl -X GET http://localhost:5000/api/openbci/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "connected": true,
  "recording": false,
  "device_info": {
    "board_id": "OpenBCI_Cyton",
    "serial_port": "COM3",
    "sampling_rate": 250
  },
  "current_session": null
}
```

### Start EEG Data Collection

```bash
curl -X POST http://localhost:5000/api/openbci/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "participant_name": "participant_001",
    "session_name": "memory_baseline_trial1",
    "duration": 120
  }'
```

**Response:**
```json
{
  "message": "EEG data collection started successfully",
  "filename": "eeg_participant_001_2024-01-15T10-50-15.123Z.csv"
}
```

### Stop EEG Data Collection

```bash
curl -X POST http://localhost:5000/api/openbci/stop \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "message": "EEG data collection stopped successfully",
  "filename": "eeg_participant_001_2024-01-15T10-50-15.123Z.csv"
}
```

## File Upload Examples

### Upload Audio File

```bash
curl -X POST http://localhost:5000/api/upload/audio \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/your/audio.mp3"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "filename": "audioFile-1757564319175-328863484.mp3",
  "url": "/uploads/audioFile-1757564319175-328863484.mp3"
}
```

## Complete Workflow Example

Here's a complete example of setting up and running an experiment:

### 1. Register and Login

```bash
# Register researcher
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher_jane",
    "password": "securepassword123",
    "role": "researcher"
  }'

# Login to get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher_jane",
    "password": "securepassword123"
  }' | jq -r '.token')
```

### 2. Create Experiment

```bash
EXPERIMENT_ID=$(curl -s -X POST http://localhost:5000/api/experiments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Cognitive Load Study",
    "description": "Study measuring cognitive load during memory tasks using EEG"
  }' | jq -r '._id')
```

### 3. Create Steps

```bash
# Audio stimulus step
AUDIO_STEP_ID=$(curl -s -X POST http://localhost:5000/api/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Background Music",
    "type": "Audio",
    "duration": 30,
    "content": "/uploads/background_music.mp3"
  }' | jq -r '._id')

# EEG recording step
EEG_STEP_ID=$(curl -s -X POST http://localhost:5000/api/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "EEG Recording",
    "type": "EEG", 
    "duration": 60,
    "content": "cognitive_load_task"
  }' | jq -r '._id')
```

### 4. Create Trial

```bash
TRIAL_ID=$(curl -s -X POST http://localhost:5000/api/trials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Trial 1",
    "experiment": "'$EXPERIMENT_ID'",
    "steps": ["'$AUDIO_STEP_ID'", "'$EEG_STEP_ID'"]
  }' | jq -r '._id')
```

### 5. Start EEG Recording

```bash
curl -X POST http://localhost:5000/api/openbci/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "participant_name": "participant_001",
    "session_name": "cognitive_load_trial1",
    "duration": 60
  }'
```

### 6. Stop Recording After Trial

```bash
curl -X POST http://localhost:5000/api/openbci/stop \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling Examples

### Authentication Error
```bash
curl -X GET http://localhost:5000/api/experiments
```

**Response (401):**
```json
{
  "message": "Access denied. No token provided."
}
```

### Invalid Data Error
```bash
curl -X POST http://localhost:5000/api/experiments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "",
    "description": "Invalid experiment with empty name"
  }'
```

**Response (400):**
```json
{
  "message": "Validation failed",
  "error": "Experiment validation failed: name: Path `name` is required."
}
```

### Permission Error
```bash
# User with 'user' role trying to create experiment
curl -X POST http://localhost:5000/api/experiments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "name": "Unauthorized Experiment",
    "description": "This should fail"
  }'
```

**Response (403):**
```json
{
  "message": "Access denied. Researchers and Admins only."
}
```

## Testing with JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Login and get token
async function login() {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'researcher01',
    password: 'securepassword123'
  });
  return response.data.token;
}

// Create experiment
async function createExperiment(token) {
  const response = await axios.post(`${BASE_URL}/experiments`, {
    name: 'JavaScript Test Experiment',
    description: 'Created via JavaScript client'
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
}

// Usage
(async () => {
  try {
    const token = await login();
    const experiment = await createExperiment(token);
    console.log('Created experiment:', experiment);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();
```