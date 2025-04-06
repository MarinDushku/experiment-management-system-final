import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import StepForm from '../components/steps/StepForm';
import './Steps.css'; // Use the new CSS file

const Steps = () => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(null);
  
  useEffect(() => {
    // Check user role
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role);
    console.log('Current user role:', user?.role);
    
    fetchSteps();

    // Cleanup function to stop any playing audio when component unmounts
    return () => {
      if (audioPlaying) {
        audioPlaying.pause();
      }
    };
  }, []);
  
  const fetchSteps = async () => {
    try {
      setLoading(true);
      console.log('Fetching steps...');
      const res = await api.get('/steps');
      console.log('Steps fetched:', res.data);
      
      // Sort steps by type for better organization
      const sortedSteps = [...res.data].sort((a, b) => {
        // First sort by type
        if (a.type < b.type) return -1;
        if (a.type > b.type) return 1;
        // Then by name
        return a.name.localeCompare(b.name);
      });
      
      setSteps(sortedSteps);
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err);
      const errorMessage = err.response?.status === 403 
        ? `Access denied: Your role (${userRole}) doesn't have permission to view steps. You need researcher or admin privileges.` 
        : `Failed to load steps: ${err.message}`;
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  const handleCreateStep = async (formData) => {
    try {
      console.log('Creating step with form data');
      const res = await axios.post('/api/steps', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Don't set Content-Type here, it will be set automatically for FormData
        }
      });
      
      console.log('Step created:', res.data);
      fetchSteps();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error creating step:', err.response?.data || err.message);
      setError('Failed to create step. Please try again.');
    }
  };
  
  const handleUpdateStep = async (formData) => {
    try {
      console.log('Updating step with form data');
      const res = await axios.put(`/api/steps/${editingStep._id}`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Don't set Content-Type here, it will be set automatically for FormData
        }
      });
      
      console.log('Step updated:', res.data);
      fetchSteps();
      setEditingStep(null);
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error updating step:', err.response?.data || err.message);
      setError('Failed to update step. Please try again.');
    }
  };
  
  const handleDeleteStep = async (stepId) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      try {
        console.log('Deleting step:', stepId);
        await api.delete(`/steps/${stepId}`);
        console.log('Step deleted successfully');
        fetchSteps();
      } catch (err) {
        console.error('Error deleting step:', err.response?.data || err.message);
        setError('Failed to delete step. Please try again.');
      }
    }
  };
  
  const openEditForm = (step) => {
    setEditingStep(step);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingStep(null);
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStep(null);
  };

  const toggleAudio = (audioSrc) => {
    // If the same audio is currently playing, pause it
    if (audioPlaying && audioPlaying.src.includes(audioSrc)) {
      audioPlaying.pause();
      setAudioPlaying(null);
      return;
    }
    
    // Stop any currently playing audio
    if (audioPlaying) {
      audioPlaying.pause();
      setAudioPlaying(null);
    }

    // Create and play new audio
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.play()
        .then(() => {
          console.log('Playing audio');
        })
        .catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio. The file may be missing or inaccessible.');
        });
      
      setAudioPlaying(audio);
      
      // Reset when done playing
      audio.onended = () => {
        setAudioPlaying(null);
      };
    }
  };
  
  if (loading) return (
    <div className="page-container">
      <div className="loading">
        <h3>Loading steps...</h3>
        <p>Please wait while we retrieve your experiment steps.</p>
      </div>
    </div>
  );
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Steps Management</h2>
        <button className="btn-primary" onClick={handleAddNew}>
          Add New Step
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isFormOpen ? (
        <StepForm 
          step={editingStep} 
          onSubmit={editingStep ? handleUpdateStep : handleCreateStep} 
          onCancel={closeForm}
        />
      ) : (
        <div className="cards-container">
          {steps.length > 0 ? (
            steps.map(step => (
              <div key={step._id} className="card">
                <div className="card-header">
                  <h3>{step.name}</h3>
                  <span className={`badge ${step.type.toLowerCase()}`}>{step.type}</span>
                </div>
                <div className="card-body">
                  <p><strong>Duration:</strong> {step.duration} seconds</p>
                  {step.type === 'Music' && step.details && step.details.audioFile && (
                    <div className="audio-section">
                      <p><strong>Audio File:</strong> {step.details.audioFile.split('/').pop()}</p>
                      <button 
                        className={`btn-audio ${audioPlaying && audioPlaying.src.includes(step.details.audioFile) ? 'playing' : ''}`}
                        onClick={() => toggleAudio(step.details.audioFile)}
                      >
                        {audioPlaying && audioPlaying.src.includes(step.details.audioFile) 
                          ? 'Pause Audio' 
                          : 'Play Audio'}
                      </button>
                    </div>
                  )}
                  {step.type === 'Question' && step.details && step.details.question && (
                    <>
                      <p><strong>Question:</strong> {step.details.question}</p>
                      {step.details.options && (
                        <p><strong>Options:</strong> {step.details.options}</p>
                      )}
                    </>
                  )}
                  {step.type === 'Rest' && step.details && step.details.instructions && (
                    <p><strong>Instructions:</strong> {step.details.instructions}</p>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => openEditForm(step)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteStep(step._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No steps found. Create one to get started.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Steps;