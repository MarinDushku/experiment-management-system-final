import React, { useState } from 'react';
import LiveEEGViewer from '../components/experiments/LiveEEGViewer';

const EEGTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [experimentName, setExperimentName] = useState('EEG Test');

  return (
    <div style={{ padding: '20px' }}>
      <h1>🧠 Live EEG Visualization Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setIsRecording(!isRecording)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRecording ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isRecording ? 'Stop EEG Stream' : 'Start EEG Stream'}
        </button>
        
        <input 
          type="text"
          value={experimentName}
          onChange={(e) => setExperimentName(e.target.value)}
          placeholder="Experiment Name"
          style={{
            marginLeft: '10px',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
        <h3>Debug Info:</h3>
        <div>Recording: {isRecording ? '✅ Active' : '❌ Stopped'}</div>
        <div>Experiment: {experimentName}</div>
        <div>Component Should Render: {isRecording ? '✅ Yes' : '❌ No'}</div>
      </div>

      {isRecording && (
        <div>
          <h3>🎯 Live EEG Visualization:</h3>
          <LiveEEGViewer 
            experimentId="test-123"
            experimentName={experimentName}
            isRecording={isRecording}
          />
        </div>
      )}
      
      <div style={{ marginTop: '40px', padding: '15px', background: '#e9ecef', borderRadius: '5px' }}>
        <h4>📋 Instructions:</h4>
        <ol>
          <li>Make sure OpenBCI is connected via the connection interface</li>
          <li>Start an experiment recording via API or connection interface</li>
          <li>Click "Start EEG Stream" above</li>
          <li>You should see live brainwave data streaming in real-time</li>
        </ol>
      </div>
    </div>
  );
};

export default EEGTest;