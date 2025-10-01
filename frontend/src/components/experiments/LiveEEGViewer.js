import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const LiveEEGViewer = ({ experimentId, experimentName, isRecording }) => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [eegData, setEegData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Initialize socket connection for EEG data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !isRecording) return;

    // Create socket connection
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('EEG viewer connected to WebSocket');
      setConnectionStatus('connected');
      setIsStreaming(true);
    });

    socket.on('disconnect', () => {
      console.log('EEG viewer disconnected from WebSocket');
      setConnectionStatus('disconnected');
      setIsStreaming(false);
    });

    socket.on('eeg-realtime-data', (data) => {
      console.log('Received EEG data:', data);
      setEegData(prevData => {
        const newData = [...prevData, {
          timestamp: data.timestamp,
          channels: data.channels,
          boardType: data.boardType
        }];
        // Keep only last 1000 data points for smooth visualization
        return newData.slice(-1000);
      });
    });

    socket.on('error', (error) => {
      console.error('EEG WebSocket error:', error);
      setConnectionStatus('error');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isRecording]);

  // Draw EEG data on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || eegData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Determine number of channels from first data point
    const numChannels = eegData.length > 0 && eegData[0].channels ? eegData[0].channels.length : 16;
    const channelHeight = height / numChannels;
    const timeScale = width / Math.min(eegData.length, 500); // Show last 2 seconds

    const colors = [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
      '#FF00FF', '#00FFFF', '#FF8000', '#8000FF',
      '#FF0080', '#00FF80', '#0080FF', '#80FF00',
      '#800080', '#008080', '#804000', '#408000'
    ];

    for (let channel = 0; channel < numChannels; channel++) {
      ctx.strokeStyle = colors[channel % colors.length];
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const centerY = channelHeight * (channel + 0.5);
      let firstPoint = true;

      for (let i = Math.max(0, eegData.length - 500); i < eegData.length; i++) {
        const dataPoint = eegData[i];
        if (dataPoint && dataPoint.channels && dataPoint.channels[channel] !== undefined) {
          const x = (i - (eegData.length - 500)) * timeScale;
          const amplitude = dataPoint.channels[channel];
          const y = centerY - (amplitude / 200) * (channelHeight * 0.4); // Scale amplitude

          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Draw channel label
      ctx.fillStyle = colors[channel % colors.length];
      ctx.font = '12px Arial';
      ctx.fillText(`Ch${channel + 1}`, 5, centerY - 5);
    }
  }, [eegData]);

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h3>Live EEG Visualization</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <span style={{ 
          color: connectionStatus === 'connected' ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          ● {connectionStatus.toUpperCase()}
        </span>
        <span style={{ marginLeft: '20px', fontSize: '12px' }}>
          Experiment: {experimentName}
        </span>
        <span style={{ marginLeft: '20px', fontSize: '12px' }}>
          Data Points: {eegData.length}
        </span>
      </div>

      <div style={{ 
        border: '2px solid #333',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ 
            display: 'block',
            background: '#000'
          }}
        />
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Data points received: {eegData.length} | 
        Channels: 16 | 
        Sample Rate: 250 Hz
      </div>
    </div>
  );
};

export default LiveEEGViewer;