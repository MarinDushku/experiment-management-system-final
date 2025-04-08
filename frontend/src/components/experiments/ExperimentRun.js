import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MusicStep from './steps/MusicStep';
import RestStep from './steps/RestStep';
import QuestionStep from './steps/QuestionStep';
import ExperimentComplete from './steps/ExperimentComplete';
import OpenBCIConnection from './OpenBCIConnection';
import './ExperimentRun.css';

const ExperimentRun = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Current position in the experiment
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // OpenBCI related states
  const [isOpenBCIConnected, setIsOpenBCIConnected] = useState(false);
  const [eegRecordingStarted, setEegRecordingStarted] = useState(false);
  const [experimentStarted, setExperimentStarted] = useState(false);
  
  // New states for experiment naming and timing
  const [experimentName, setExperimentName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const experimentStartTime = useRef(null);
  const [responses, setResponses] = useState([]);
  
  // Enable fullscreen mode when the experiment starts
  useEffect(() => {
    if (experimentStarted) {
      // Add class to body
      document.body.classList.add('experiment-running');
      
      // Enter fullscreen if supported
      const requestFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen()
            .then(() => setIsFullscreen(true))
            .catch(err => console.error('Error attempting to enable fullscreen:', err));
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
          setIsFullscreen(true);
        }
      };

      // Try to enter fullscreen mode
      requestFullscreen();
      
      // Set experiment start time
      experimentStartTime.current = Date.now();
    }
    
    // Clean up when component unmounts
    return () => {
      document.body.classList.remove('experiment-running');
      
      // Exit fullscreen if active
      if (isFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };
  }, [experimentStarted, isFullscreen]);
  
  // Fetch experiment data
  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/experiments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("Fetched experiment:", response.data);
        setExperiment(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching experiment:", err);
        setError('Failed to load experiment data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchExperiment();
  }, [id]);
  
  // Handle OpenBCI connection status change
  const handleOpenBCIConnectionChange = (connected) => {
    setIsOpenBCIConnected(connected);
  };
  
  // Start the experiment name prompt
  const handlePrepareStart = () => {
    setShowNamePrompt(true);
  };
  
  // Cancel experiment start
  const handleCancelStart = () => {
    setShowNamePrompt(false);
  };
  
  // Start experiment (with or without EEG recording)
  const startExperiment = async () => {
    if (!experimentName.trim()) {
      alert("Please enter a name for this experiment run");
      return;
    }
    
    try {
      setLoading(true);
      
      // Check OpenBCI connection status
      if (isOpenBCIConnected) {
        // Try to start EEG recording
        const token = localStorage.getItem('token');
        try {
          const response = await axios.post(
            `/api/openbci/experiment/${id}/start`, 
            { experimentRunName: experimentName }, 
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          if (response.data.success) {
            setEegRecordingStarted(true);
          } else {
            console.warn("Failed to start EEG recording, but continuing experiment.");
          }
        } catch (eegError) {
          console.error("Error starting EEG recording:", eegError);
          // Continue experiment even if EEG recording fails
        }
      }
      
      // Start experiment regardless of EEG connection
      setExperimentStarted(true);
      setShowNamePrompt(false);
      
    } catch (error) {
      console.error("Error starting experiment:", error);
      setError("Error starting experiment");
    } finally {
      setLoading(false);
    }
  };
  
  // Stop EEG recording when experiment is completed
 // Update in ExperimentRun.js - stopExperimentWithEEG function
  const stopExperimentWithEEG = async () => {
    try {
      // Only stop if experiment was started with EEG
      if (experimentStarted && eegRecordingStarted) {
        const token = localStorage.getItem('token');
        await axios.post(
          `/api/openbci/experiment/${id}/stop`, 
          { 
           duration: 5, // Default duration to collect final data
           experimentName: experimentName  // Pass experiment name
          }, 
          {
            headers: {
             Authorization: `Bearer ${token}`
           }
         }
       );
        setEegRecordingStarted(false);
     }
   } catch (error) {
     console.error("Error stopping experiment with EEG:", error);
   }
  };
  
  // Get the current trial and step
  const getCurrentTrial = () => {
    if (!experiment) return null;
    
    if (experiment.trials && experiment.trials.length > 0) {
      const orderedTrials = [...experiment.trials].sort((a, b) => a.order - b.order);
      return orderedTrials[currentTrialIndex];
    } else if (experiment.trial) {
      // For backward compatibility with single trial format
      return { trial: experiment.trial, order: 0 };
    }
    
    return null;
  };
  
  const getCurrentStep = () => {
    const currentTrial = getCurrentTrial();
    if (!currentTrial || !currentTrial.trial || !currentTrial.trial.steps || currentTrial.trial.steps.length === 0) {
      return null;
    }
    
    const orderedSteps = [...currentTrial.trial.steps].sort((a, b) => a.order - b.order);
    return orderedSteps[currentStepIndex];
  };
  
  // Handle question responses
  const handleQuestionResponse = (stepId, response) => {
    const timestamp = Date.now();
    const timeSinceStart = timestamp - experimentStartTime.current;
    
    const responseData = {
      stepId,
      response,
      timestamp,
      timeSinceStart, // milliseconds since experiment started
      experimentName: experimentName,
      experimentId: id,
      trialIndex: currentTrialIndex,
      stepIndex: currentStepIndex
    };
    
    // Add to local state
    setResponses(prev => [...prev, responseData]);
    
    // Save to server
    saveResponse(responseData);
  };
  
  // Save response to server
  const saveResponse = async (responseData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/responses',
        responseData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error("Error saving response:", error);
    }
  };
  
  // Handle moving to the next step
  const moveToNextStep = async () => {
    const currentTrial = getCurrentTrial();
    
    if (!currentTrial) {
      console.error("No current trial found");
      return;
    }
    
    const orderedSteps = [...currentTrial.trial.steps].sort((a, b) => a.order - b.order);
    
    // Check if there are more steps in current trial
    if (currentStepIndex < orderedSteps.length - 1) {
      // Move to next step in current trial
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    } else {
      // Check if there are more trials
      if (experiment.trials && experiment.trials.length > 0) {
        const orderedTrials = [...experiment.trials].sort((a, b) => a.order - b.order);
        
        if (currentTrialIndex < orderedTrials.length - 1) {
          // Move to first step of next trial
          setCurrentTrialIndex(prevIndex => prevIndex + 1);
          setCurrentStepIndex(0);
        } else {
          // End of experiment
          await completeExperiment();
        }
      } else {
        // Single trial format - end of experiment
        await completeExperiment();
      }
    }
  };
  
  // Mark the experiment as completed
  const completeExperiment = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Update experiment status to completed
      await axios.put(`/api/experiments/${id}`, 
        { 
          status: 'Completed',
          responses: responses,
          experimentRunName: experimentName
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Stop EEG recording if it was started
      await stopExperimentWithEEG();
      
      setIsCompleted(true);
      
    } catch (err) {
      console.error("Error completing experiment:", err);
      setError('Failed to mark experiment as completed.');
    }
  };
  
  // Exit the experiment
  const exitExperiment = () => {
    // Exit fullscreen if active
    if (isFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    // Stop EEG recording if it was started
    if (eegRecordingStarted) {
      stopExperimentWithEEG();
    }
    
    window.close(); // Close the window if it was opened as a new window
    // As a fallback, also navigate to the experiments list
    navigate('/experiments');
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="experiment-run">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading experiment...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="experiment-run">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={exitExperiment} className="btn-primary">
            Return to Experiments
          </button>
        </div>
      </div>
    );
  }
  
  // No experiment found
  if (!experiment) {
    return (
      <div className="experiment-run">
        <div className="error-container">
          <h2>Experiment Not Found</h2>
          <p>The requested experiment could not be found.</p>
          <button onClick={exitExperiment} className="btn-primary">
            Return to Experiments
          </button>
        </div>
      </div>
    );
  }
  
  // Experiment completed
  if (isCompleted) {
    return <ExperimentComplete 
      experimentName={experiment.name} 
      experimentRunName={experimentName}
      onExit={exitExperiment} 
    />;
  }
  
  // Experiment name prompt
  if (showNamePrompt) {
    return (
      <div className="experiment-setup-container">
        <div className="name-prompt-modal">
          <h3>Name This Experiment Run</h3>
          <p>Please enter a unique name for this experiment run to identify the data:</p>
          
          <div className="form-group">
            <label htmlFor="experimentName">Experiment Run Name:</label>
            <input
              type="text"
              id="experimentName"
              className="form-control"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder="e.g., Subject01-Session01"
              required
            />
          </div>
          
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={handleCancelStart}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={startExperiment}
              disabled={!experimentName.trim()}
            >
              Start Experiment
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Experiment setup - showing OpenBCI connection and start options
  if (!experimentStarted) {
    return (
      <div className="experiment-setup-container">
        <h2>Prepare to Run: {experiment.name}</h2>
        
        {/* OpenBCI Connection Component */}
        <OpenBCIConnection onConnectionChange={handleOpenBCIConnectionChange} />
        
        <div className="experiment-info-card">
          <h3>Experiment Information</h3>
          <p><strong>Name:</strong> {experiment.name}</p>
          <p><strong>Description:</strong> {experiment.description || 'No description provided'}</p>
          <p><strong>Trials:</strong> {experiment.trials ? experiment.trials.length : 1}</p>
          
          <div className="experiment-actions">
            <button 
              className="btn-primary" 
              onClick={handlePrepareStart} 
              disabled={loading}
            >
              {loading ? 'Starting...' : 'Start Experiment'}
            </button>
            
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/experiments')}
            >
              Back to Experiments
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const currentTrial = getCurrentTrial();
  const currentStep = getCurrentStep();
  
  // No valid trial or step
  if (!currentTrial || !currentStep) {
    return (
      <div className="experiment-run">
        <div className="error-container">
          <h2>Invalid Experiment Configuration</h2>
          <p>This experiment doesn't have valid trials or steps.</p>
          <button onClick={exitExperiment} className="btn-primary">
            Return to Experiments
          </button>
        </div>
      </div>
    );
  }
  
  const totalTrials = experiment.trials ? experiment.trials.length : 1;
  const totalSteps = currentTrial.trial.steps ? currentTrial.trial.steps.length : 0;
  
  // Render the appropriate step component based on step type
  const renderStepComponent = () => {
    const stepData = currentStep.step;
    
    switch (stepData.type) {
      case 'Music':
        return (
          <MusicStep 
            step={stepData} 
            onComplete={moveToNextStep} 
          />
        );
      case 'Rest':
        return (
          <RestStep 
            step={stepData} 
            onComplete={moveToNextStep} 
          />
        );
      case 'Question':
        return (
          <QuestionStep 
            step={stepData} 
            onComplete={moveToNextStep}
            onResponse={(response) => handleQuestionResponse(stepData._id, response)}
          />
        );
      default:
        return (
          <div className="unknown-step">
            <h3>Unknown Step Type: {stepData.type}</h3>
            <button onClick={moveToNextStep} className="btn-primary">
              Next Step
            </button>
          </div>
        );
    }
  };
  
  return (
    <div className="experiment-run">
      <div className="experiment-header">
        <h1>{experiment.name}</h1>
        <h2 className="experiment-run-name">{experimentName}</h2>
        <div className="progress-info">
          <span>Trial {currentTrialIndex + 1} of {totalTrials}</span>
          <span>•</span>
          <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          {eegRecordingStarted ? (
            <>
              <span>•</span>
              <span className="eeg-recording-status">EEG Recording Active</span>
            </>
          ) : isOpenBCIConnected ? (
            <>
              <span>•</span>
              <span className="eeg-connected-status">EEG Connected (Not Recording)</span>
            </>
          ) : (
            <>
              <span>•</span>
              <span className="eeg-disconnected-status">EEG Not Connected</span>
            </>
          )}
        </div>
      </div>
      
      <div className="step-container">
        <div className="step-header">
          <h2>{currentStep.step.name}</h2>
          <div className="step-type">{currentStep.step.type}</div>
        </div>
        
        {renderStepComponent()}
      </div>
      
      <div className="experiment-footer">
        <button 
          className="btn-secondary exit-button"
          onClick={() => {
            if (window.confirm('Are you sure you want to exit? Progress will not be saved.')) {
              exitExperiment();
            }
          }}
        >
          Exit Experiment
        </button>
      </div>
    </div>
  );
};

export default ExperimentRun;