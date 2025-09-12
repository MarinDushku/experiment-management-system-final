# Two-Device EEG Experiment System Implementation Plan

## Overview
Transform the current single-device system into a **two-device networked experiment system** where an admin (Ubuntu PC) controls experiments and views real-time brainwaves, while a participant device shows only controlled stimuli.

## Current System Analysis

### ✅ Already exists:
- Sophisticated Python brainwave visualizer with real-time EEG display
- OpenBCI integration with data collection
- Complete experiment management system
- Role-based authentication
- Docker containerization
- Comprehensive testing infrastructure
- CI/CD pipeline with GitHub Actions

### ❌ Missing for two-device setup:
- WebSocket real-time communication
- Device discovery/pairing system
- Network-based experiment coordination
- Admin vs participant UI separation
- Real-time brainwave display in web interface

## Implementation Plan

### Phase 1: Real-time Communication Infrastructure

#### 1. Add WebSocket server to backend
- Install `socket.io` for Node.js backend
- Create WebSocket handlers for experiment events
- Implement real-time EEG data streaming
- Add WebSocket authentication middleware

#### 2. Add WebSocket client to frontend
- Install `socket.io-client` for React frontend  
- Create WebSocket context for managing connections
- Handle real-time experiment synchronization
- Implement connection state management

### Phase 2: Device Connection System

#### 3. Create Device Discovery & Pairing
- Add "Device Connection" option to navbar
- Implement network device scanning (mDNS/Bonjour or simple HTTP discovery)
- Create pairing interface with QR codes or device codes
- Store paired devices with roles (admin/participant)
- Add device management interface

#### 4. Network Security
- Device authentication with temporary tokens
- Encrypted WebSocket connections (WSS)
- IP whitelisting for local network only
- Session-based device validation
- Automatic device cleanup on disconnect

### Phase 3: Admin Interface Enhancement

#### 5. Integrate Real-time Brainwave Display
- **Option A**: WebSocket bridge to Python visualizer
  - Stream EEG data from Python to web interface
  - Create web-based real-time charts using Chart.js or D3.js
  - Maintain Python visualizer for advanced analysis
- **Option B**: Convert Python visualizer to web-based
  - Migrate matplotlib visualization to web canvas
  - Implement real-time data streaming to browser
  - Add interactive controls for scaling, filtering

#### 6. Admin Experiment Control Panel
- Start/stop experiment across devices
- Monitor participant device status
- Control which stimuli participant sees
- Real-time experiment state management
- EEG data recording controls
- Participant device synchronization status

### Phase 4: Participant Interface

#### 7. Participant-Only Interface
- Stripped-down UI showing only current experiment step
- No access to experiment management or brainwave data
- Full-screen stimulus display mode
- Real-time synchronization with admin commands
- Connection status indicators

#### 8. Stimulus Presentation
- Audio/visual stimuli synchronized across network
- Fullscreen mode for distraction-free experience
- Progress indicators (if allowed by admin)
- Automatic step progression based on admin control
- Error handling for network interruptions

### Phase 5: Network Architecture

#### 9. Multi-Device Experiment Flow
- Admin starts experiment → broadcasts to participant device
- Participant device receives and displays stimuli
- EEG data streams only to admin device
- Real-time synchronization of experiment timeline
- Automatic reconnection and state recovery

#### 10. Connection Management
- Automatic reconnection handling
- Network interruption recovery
- Device status monitoring
- Connection quality indicators
- Graceful degradation when network issues occur

## Technical Implementation Details

### WebSocket Events:
```javascript
// Device Management
'device-pair-request'    // Device wants to pair
'device-pair-response'   // Pairing response (accept/reject)
'device-connected'       // Device successfully connected
'device-disconnect'      // Handle disconnections
'device-status'          // Regular device health checks

// Experiment Control
'experiment-start'       // Admin starts experiment
'experiment-stop'        // Admin stops experiment
'experiment-pause'       // Admin pauses experiment
'step-change'           // Synchronize experiment steps
'step-complete'         // Participant completes step

// Data Streaming
'eeg-data-stream'       // Real-time EEG data to admin
'eeg-recording-start'   // Start EEG recording
'eeg-recording-stop'    // Stop EEG recording

// Synchronization
'time-sync'             // Time synchronization between devices
'experiment-state'      // Current experiment state broadcast
```

### New API Endpoints:
```
GET    /api/devices/discover          // Scan for devices on network
POST   /api/devices/pair             // Pair with device
DELETE /api/devices/unpair/:id       // Unpair device
GET    /api/devices/status           // Get all paired devices status

GET    /api/experiments/{id}/stream  // WebSocket upgrade for real-time
POST   /api/experiments/{id}/broadcast // Send to participant device
GET    /api/experiments/{id}/participants // Get connected participants

POST   /api/eeg/stream/start         // Start EEG data streaming
POST   /api/eeg/stream/stop          // Stop EEG data streaming
GET    /api/eeg/stream/status        // Get streaming status
```

### Database Changes:
```javascript
// New Collections/Models:
DevicePair {
  _id: ObjectId,
  adminDeviceId: String,
  participantDeviceId: String,
  pairingCode: String,
  status: ['paired', 'connecting', 'disconnected'],
  lastSeen: Date,
  networkInfo: {
    ip: String,
    userAgent: String,
    deviceType: String
  },
  createdAt: Date
}

ExperimentSession {
  _id: ObjectId,
  experimentId: ObjectId,
  adminUserId: ObjectId,
  participantDeviceId: String,
  status: ['preparing', 'running', 'paused', 'completed'],
  currentStep: Number,
  startTime: Date,
  endTime: Date,
  eegRecordingFile: String,
  sessionData: Object // Real-time experiment data
}

NetworkConfig {
  _id: ObjectId,
  allowedNetworks: [String], // CIDR notation
  discoveryPort: Number,
  websocketPort: Number,
  securitySettings: Object
}
```

### Frontend Architecture Changes:
```
src/
  contexts/
    DeviceContext.js          // Device pairing and management
    WebSocketContext.js       // Real-time communication
    ExperimentSyncContext.js  // Experiment synchronization
  
  components/
    devices/
      DeviceConnection.js     // Device discovery and pairing
      DeviceStatus.js         // Connection status display
      ParticipantView.js      // Participant-only interface
    
    admin/
      ExperimentControl.js    // Admin experiment controls
      BrainwaveDisplay.js     // Real-time EEG visualization
      ParticipantMonitor.js   // Monitor participant devices
    
    realtime/
      WebSocketProvider.js    // WebSocket connection management
      SynchronizedStep.js     // Steps that sync across devices
```

### Backend Architecture Changes:
```
backend/
  sockets/
    deviceSocket.js           // Device management WebSocket handlers
    experimentSocket.js       // Experiment control WebSocket handlers
    eegSocket.js             // EEG data streaming handlers
  
  services/
    deviceDiscoveryService.js // Network device discovery
    devicePairingService.js   // Device pairing logic
    experimentSyncService.js  // Multi-device experiment sync
    eegStreamingService.js    // Real-time EEG data streaming
  
  middleware/
    socketAuth.js            // WebSocket authentication
    deviceValidation.js      // Device validation middleware
```

## Security Considerations

### Network Security:
- **Local Network Only**: Restrict connections to local network ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- **Device Authentication**: Temporary pairing codes (like Bluetooth pairing)
- **Session Security**: Short-lived session tokens for device authentication
- **Encrypted Communication**: WSS (WebSocket Secure) for all real-time communication
- **IP Whitelisting**: Admin can whitelist specific device IPs

### Device Pairing Process:
1. **Discovery**: Admin device scans local network for available devices
2. **Code Generation**: Generate 6-digit pairing code on admin device
3. **Code Entry**: Participant enters pairing code on their device
4. **Validation**: Server validates code and establishes secure session
5. **Pairing**: Devices are paired and can communicate securely

### Data Protection:
- **EEG Data**: Only transmitted to admin device, never stored on participant device
- **Experiment Data**: Participant sees only current step, no full experiment data
- **User Data**: No personal information transmitted to participant device
- **Session Isolation**: Each experiment session is isolated and temporary

## Expected Workflow

### 1. Admin Device (Ubuntu PC):
```
1. Open "Device Connection" from navbar
2. Click "Scan for Devices" → system scans local network
3. Select participant device from discovered devices
4. Generate pairing code → display on screen
5. Wait for participant to enter code
6. Once paired → can start experiments
7. Start experiment → real-time brainwaves display + experiment controls
8. Control participant's view (start/stop stimuli, advance steps)
9. Monitor EEG data and participant device status
10. Complete experiment → data saved, devices can be unpaired
```

### 2. Participant Device (Any device on same network):
```
1. Navigate to the experiment system URL
2. See "Connect to Experiment" interface
3. Enter 6-digit pairing code from admin
4. Wait for pairing confirmation
5. Automatically switch to participant-only interface
6. See only current experiment step as controlled by admin
7. Experience stimuli (audio, visual, text) in fullscreen
8. Automatic progression based on admin control
9. No access to brainwave data or experiment management
10. Session ends when admin completes experiment
```

### 3. Real-time Synchronization:
- **Time Sync**: Devices synchronize clocks for precise timing
- **State Sync**: Participant device always reflects admin's experiment state
- **Data Flow**: EEG data flows only to admin device
- **Control Flow**: All controls originate from admin device
- **Status Updates**: Both devices show connection and experiment status

## Implementation Priority

### Phase 1 (Critical): 
- Fix GitHub CI/CD test failures
- WebSocket infrastructure
- Basic device pairing

### Phase 2 (High):
- Admin brainwave display integration
- Participant interface
- Device discovery system

### Phase 3 (Medium):
- Advanced synchronization
- Security hardening
- Error handling improvements

### Phase 4 (Low):
- UI/UX enhancements
- Performance optimizations
- Additional features

## Notes

- **Network Requirements**: Both devices must be on same local network (WiFi/Ethernet)
- **Browser Compatibility**: Modern browsers with WebSocket support required
- **Performance**: EEG data streaming may require optimization for smooth real-time display
- **Scalability**: Initially designed for 1 admin + 1 participant, can be extended for multiple participants
- **Testing**: Will require physical testing with actual devices and OpenBCI hardware

This implementation will create a professional, secure, networked two-device system perfect for research experiments with real-time EEG monitoring and synchronized stimulus presentation.