import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './websocketContext';
import { useAuth } from './authContext';
import { useDevice } from './deviceContext';

const ExperimentSyncContext = createContext();

export const useExperimentSync = () => {
  const context = useContext(ExperimentSyncContext);
  if (!context) {
    throw new Error('useExperimentSync must be used within an ExperimentSyncProvider');
  }
  return context;
};

export const ExperimentSyncProvider = ({ children }) => {
  const { user } = useAuth();
  const { emit, on, off, isNamespaceConnected } = useWebSocket();
  const { isPaired, pairedDevice } = useDevice();
  
  // Experiment state
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [experimentStatus, setExperimentStatus] = useState('idle'); // idle, running, paused, completed
  const [currentStep, setCurrentStep] = useState(null);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [trialIndex, setTrialIndex] = useState(0);
  
  // Synchronization state
  const [syncStatus, setSyncStatus] = useState('disconnected'); // disconnected, connected, synced
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [participantDevices, setParticipantDevices] = useState([]);
  
  // Admin-specific state
  const [isControlling, setIsControlling] = useState(false);
  const [participantStatus, setParticipantStatus] = useState({});
  
  // Participant-specific state
  const [receivedInstructions, setReceivedInstructions] = useState(null);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);

  useEffect(() => {
    if (!isNamespaceConnected('experiment')) {
      setSyncStatus('disconnected');
      return;
    }

    setSyncStatus('connected');

    // Set up experiment event listeners
    const cleanup = [
      on('experiment', 'device-connected', handleDeviceConnected),
      on('experiment', 'experiment-start', handleExperimentStart),
      on('experiment', 'experiment-stop', handleExperimentStop),
      on('experiment', 'experiment-pause', handleExperimentPause),
      on('experiment', 'step-change', handleStepChange),
      on('experiment', 'step-complete', handleStepComplete),
      on('experiment', 'eeg-recording-start', handleEEGRecordingStart),
      on('experiment', 'eeg-recording-stop', handleEEGRecordingStop),
      on('experiment', 'time-sync', handleTimeSync)
    ];

    // Request time sync
    emit('experiment', 'time-sync');

    return () => {
      cleanup.forEach(cleanupFn => cleanupFn());
    };
  }, [isNamespaceConnected('experiment'), on, off, emit]);

  const handleDeviceConnected = useCallback((data) => {
    console.log('Device connected to experiment:', data);
    
    if (user?.role === 'admin') {
      setParticipantDevices(prev => {
        const updated = prev.filter(device => device.socketId !== data.socketId);
        return [...updated, data];
      });
    }
  }, [user]);

  const handleExperimentStart = useCallback((data) => {
    console.log('Experiment started:', data);
    
    setCurrentExperiment(prev => ({
      ...prev,
      id: data.experimentId
    }));
    setExperimentStatus('running');
    setCurrentStep(data.currentStep);
    setLastSyncTime(data.timestamp);
    setSyncStatus('synced');
    
    if (user?.role === 'participant') {
      setWaitingForAdmin(false);
    }
  }, [user]);

  const handleExperimentStop = useCallback((data) => {
    console.log('Experiment stopped:', data);
    
    setExperimentStatus('completed');
    setLastSyncTime(data.timestamp);
    
    if (user?.role === 'participant') {
      setWaitingForAdmin(true);
    }
  }, [user]);

  const handleExperimentPause = useCallback((data) => {
    console.log('Experiment paused:', data);
    
    setExperimentStatus('paused');
    setLastSyncTime(data.timestamp);
  }, []);

  const handleStepChange = useCallback((data) => {
    console.log('Step changed:', data);
    
    setCurrentStep(data.currentStep);
    setStepIndex(data.stepIndex);
    setTrialIndex(data.trialIndex);
    setLastSyncTime(data.timestamp);
    
    if (user?.role === 'participant') {
      setReceivedInstructions(data.currentStep);
      setWaitingForAdmin(false);
    }
  }, [user]);

  const handleStepComplete = useCallback((data) => {
    console.log('Step completed by participant:', data);
    
    if (user?.role === 'admin') {
      setParticipantStatus(prev => ({
        ...prev,
        [data.participantId]: {
          ...prev[data.participantId],
          lastStepCompleted: data.stepIndex,
          lastCompletedAt: data.timestamp
        }
      }));
    }
  }, [user]);

  const handleEEGRecordingStart = useCallback((data) => {
    console.log('EEG recording started:', data);
    setLastSyncTime(data.timestamp);
  }, []);

  const handleEEGRecordingStop = useCallback((data) => {
    console.log('EEG recording stopped:', data);
    setLastSyncTime(data.timestamp);
  }, []);

  const handleTimeSync = useCallback((data) => {
    console.log('Time sync received:', data);
    setLastSyncTime(data.serverTime);
    setSyncStatus('synced');
  }, []);

  // Admin functions
  const startExperiment = useCallback((experimentData) => {
    if (!isNamespaceConnected('experiment') || user?.role !== 'admin') {
      console.warn('Cannot start experiment: not connected or not admin');
      return false;
    }

    setCurrentExperiment(experimentData);
    setIsControlling(true);

    emit('experiment', 'device-connected', {
      experimentId: experimentData.id,
      role: 'admin'
    });

    emit('experiment', 'experiment-start', {
      experimentId: experimentData.id,
      currentStep: experimentData.firstStep,
      timestamp: Date.now()
    });

    console.log('Started experiment:', experimentData.id);
    return true;
  }, [emit, isNamespaceConnected, user]);

  const stopExperiment = useCallback(() => {
    if (!currentExperiment || !isNamespaceConnected('experiment')) {
      return false;
    }

    emit('experiment', 'experiment-stop', {
      experimentId: currentExperiment.id,
      timestamp: Date.now()
    });

    setIsControlling(false);
    console.log('Stopped experiment:', currentExperiment.id);
    return true;
  }, [emit, isNamespaceConnected, currentExperiment]);

  const pauseExperiment = useCallback(() => {
    if (!currentExperiment || !isNamespaceConnected('experiment')) {
      return false;
    }

    emit('experiment', 'experiment-pause', {
      experimentId: currentExperiment.id,
      timestamp: Date.now()
    });

    console.log('Paused experiment:', currentExperiment.id);
    return true;
  }, [emit, isNamespaceConnected, currentExperiment]);

  const advanceStep = useCallback((newStep, newStepIndex, newTrialIndex) => {
    if (!currentExperiment || !isNamespaceConnected('experiment')) {
      return false;
    }

    emit('experiment', 'step-change', {
      experimentId: currentExperiment.id,
      currentStep: newStep,
      stepIndex: newStepIndex,
      trialIndex: newTrialIndex,
      timestamp: Date.now()
    });

    // Update local state for admin
    setCurrentStep(newStep);
    setStepIndex(newStepIndex);
    setTrialIndex(newTrialIndex);

    console.log(`Advanced to step ${newStepIndex} of trial ${newTrialIndex}`);
    return true;
  }, [emit, isNamespaceConnected, currentExperiment]);

  // Participant functions
  const joinAsParticipant = useCallback((experimentId) => {
    if (!isNamespaceConnected('experiment') || user?.role === 'admin') {
      return false;
    }

    emit('experiment', 'join-as-participant', { experimentId });
    
    emit('experiment', 'device-connected', {
      experimentId: experimentId,
      role: 'participant'
    });

    setWaitingForAdmin(true);
    console.log('Joined experiment as participant:', experimentId);
    return true;
  }, [emit, isNamespaceConnected, user]);

  const completeStep = useCallback(() => {
    if (!currentExperiment || !isNamespaceConnected('experiment') || user?.role !== 'participant') {
      return false;
    }

    emit('experiment', 'step-complete', {
      experimentId: currentExperiment.id,
      stepIndex: stepIndex,
      trialIndex: trialIndex,
      timestamp: Date.now()
    });

    setWaitingForAdmin(true);
    console.log(`Completed step ${stepIndex} of trial ${trialIndex}`);
    return true;
  }, [emit, isNamespaceConnected, currentExperiment, stepIndex, trialIndex, user]);

  // Utility functions
  const requestTimeSync = useCallback(() => {
    if (isNamespaceConnected('experiment')) {
      emit('experiment', 'time-sync');
    }
  }, [emit, isNamespaceConnected]);

  const getTimeSinceLastSync = useCallback(() => {
    return lastSyncTime ? Date.now() - lastSyncTime : null;
  }, [lastSyncTime]);

  const isExperimentActive = useCallback(() => {
    return experimentStatus === 'running' || experimentStatus === 'paused';
  }, [experimentStatus]);

  const value = {
    // Experiment state
    currentExperiment,
    experimentStatus,
    currentStep,
    currentTrial,
    stepIndex,
    trialIndex,
    
    // Synchronization state
    syncStatus,
    lastSyncTime,
    participantDevices,
    
    // Admin state
    isControlling,
    participantStatus,
    
    // Participant state
    receivedInstructions,
    waitingForAdmin,
    
    // Admin functions
    startExperiment,
    stopExperiment,
    pauseExperiment,
    advanceStep,
    
    // Participant functions
    joinAsParticipant,
    completeStep,
    
    // Utility functions
    requestTimeSync,
    getTimeSinceLastSync,
    isExperimentActive,
    
    // Helper properties
    isAdmin: user?.role === 'admin',
    isParticipant: user?.role !== 'admin',
    isSynced: syncStatus === 'synced',
    canControl: user?.role === 'admin' && isPaired
  };

  return (
    <ExperimentSyncContext.Provider value={value}>
      {children}
    </ExperimentSyncContext.Provider>
  );
};