import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { useDevice } from '../contexts/deviceContext';
import { useExperimentSync } from '../contexts/experimentSyncContext';
import './ParticipantExperiment.css';

const ParticipantExperiment = () => {
  const { experimentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPaired, pairedDevice, connectionStatus } = useDevice();
  const { 
    currentStep, 
    experimentStatus, 
    isParticipant,
    stepContent,
    timeRemaining 
  } = useExperimentSync();

  const [isReady, setIsReady] = useState(false);
  const [response, setResponse] = useState('');

  useEffect(() => {
    // Redirect if not a regular user
    if (user?.role !== 'user') {
      navigate('/dashboard');
      return;
    }

    // Check if paired with admin device
    if (!isPaired) {
      navigate('/devices');
      return;
    }

    setIsReady(true);
  }, [user, isPaired, navigate]);

  const handleResponse = (value) => {
    setResponse(value);
    // Send response to admin device via experiment sync
    // This would be handled by the experiment sync context
  };

  const renderStepContent = () => {
    if (!currentStep) {
      return (
        <div className="waiting-content">
          <div className="waiting-icon">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <h3>Waiting for Experiment to Start</h3>
          <p>Please wait while the admin prepares the experiment.</p>
          {pairedDevice && (
            <div className="connection-info">
              <p>Connected to: <strong>{pairedDevice.userName}</strong></p>
              <div className={`status-indicator ${connectionStatus}`}>
                {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (currentStep.type) {
      case 'Rest':
        return (
          <div className="rest-step">
            <div className="step-icon">
              <i className="fas fa-pause-circle"></i>
            </div>
            <h2>Rest Period</h2>
            <p className="instructions">
              {currentStep.details?.instructions || 'Please relax and remain still.'}
            </p>
            {timeRemaining && (
              <div className="timer">
                <div className="timer-circle">
                  <span className="timer-text">{Math.ceil(timeRemaining / 1000)}s</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'Question':
        return (
          <div className="question-step">
            <div className="step-icon">
              <i className="fas fa-question-circle"></i>
            </div>
            <h2>Question</h2>
            <p className="question-text">{currentStep.details?.question}</p>
            
            {currentStep.details?.options && (
              <div className="options-container">
                {currentStep.details.options.split(',').map((option, index) => (
                  <button
                    key={index}
                    className={`option-button ${response === option.trim() ? 'selected' : ''}`}
                    onClick={() => handleResponse(option.trim())}
                  >
                    {option.trim()}
                  </button>
                ))}
              </div>
            )}
            
            {!currentStep.details?.options && (
              <div className="text-response">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter your response here..."
                  className="response-textarea"
                />
                <button 
                  className="submit-button"
                  onClick={() => handleResponse(response)}
                  disabled={!response.trim()}
                >
                  Submit Response
                </button>
              </div>
            )}
          </div>
        );

      case 'Music':
        return (
          <div className="music-step">
            <div className="step-icon">
              <i className="fas fa-music"></i>
            </div>
            <h2>Audio Experience</h2>
            <p className="instructions">Please listen carefully to the audio.</p>
            <div className="audio-visual">
              <div className="sound-waves">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
              <p>Audio is playing...</p>
            </div>
            {timeRemaining && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentStep.duration * 1000 - timeRemaining) / (currentStep.duration * 1000)) * 100}%` }}
                />
                <span className="time-remaining">{Math.ceil(timeRemaining / 1000)}s remaining</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="default-step">
            <h2>{currentStep.name}</h2>
            <p>Please follow the instructions provided by the experiment administrator.</p>
            {timeRemaining && (
              <div className="timer">
                <span>{Math.ceil(timeRemaining / 1000)} seconds remaining</span>
              </div>
            )}
          </div>
        );
    }
  };

  if (!isReady) {
    return (
      <div className="participant-experiment loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading experiment...</p>
      </div>
    );
  }

  return (
    <div className="participant-experiment">
      <div className="experiment-header">
        <div className="participant-info">
          <span className="participant-label">Participant</span>
          <span className="participant-name">{user?.username}</span>
        </div>
        
        <div className="experiment-status">
          <div className={`status-badge ${experimentStatus}`}>
            {experimentStatus || 'waiting'}
          </div>
        </div>
      </div>

      <div className="experiment-content">
        {renderStepContent()}
      </div>

      <div className="experiment-footer">
        <div className="connection-status">
          <div className={`connection-indicator ${connectionStatus}`}>
            <i className={`fas ${connectionStatus === 'connected' ? 'fa-wifi' : 'fa-wifi-slash'}`}></i>
            <span>{connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        <button 
          className="disconnect-button"
          onClick={() => navigate('/devices')}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default ParticipantExperiment;