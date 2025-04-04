import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StepForm.css';

const StepForm = ({ step, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Rest',
    duration: 30,
    details: {}
  });
  
  const [audioFile, setAudioFile] = useState(null);
  const [currentAudio, setCurrentAudio] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);
  
  useEffect(() => {
    // If editing an existing step, populate the form
    if (step) {
      setFormData({
        name: step.name || '',
        type: step.type || 'Rest',
        duration: step.duration || 30,
        details: step.details || {}
      });
      
      // If it's a music step with an audio file
      if (step.type === 'Music' && step.details && step.details.audioFile) {
        setCurrentAudio(step.details.audioFile);
      }
    }
    
    // Cleanup audio player on unmount
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [step]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [name]: value
      }
    }));
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setCurrentAudio(fileUrl);
      
      // Reset any playing audio
      if (audioPlayer) {
        audioPlayer.pause();
        setIsPlaying(false);
      }
    }
  };
  
  const toggleAudioPlay = () => {
    if (!currentAudio) return;
    
    if (!audioPlayer) {
      const player = new Audio(currentAudio);
      player.onended = () => setIsPlaying(false);
      setAudioPlayer(player);
      player.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a FormData object for file upload
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('type', formData.type);
    submitData.append('duration', formData.duration);
    
    // Add details based on step type
    if (formData.type === 'Music') {
      // Only append the file if a new one was selected
      if (audioFile) {
        submitData.append('audioFile', audioFile);
      }
    } else if (formData.type === 'Question') {
      const detailsObj = {
        question: formData.details.question || '',
        options: formData.details.options || ''
      };
      submitData.append('details', JSON.stringify(detailsObj));
    } else if (formData.type === 'Rest') {
      const detailsObj = {
        instructions: formData.details.instructions || ''
      };
      submitData.append('details', JSON.stringify(detailsObj));
    }
    
    onSubmit(submitData);
  };
  
  // Render different detail fields based on step type
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'Music':
        return (
          <>
            <div className="form-group">
              <label htmlFor="audioFile">Audio File</label>
              <input
                type="file"
                id="audioFile"
                accept="audio/*"
                onChange={handleFileChange}
                className="file-input"
              />
              {currentAudio && (
                <div className="audio-preview">
                  <button 
                    type="button" 
                    className={`btn-audio ${isPlaying ? 'playing' : ''}`}
                    onClick={toggleAudioPlay}
                  >
                    {isPlaying ? 'Pause' : 'Play'} Preview
                  </button>
                  <span className="file-name">
                    {audioFile ? audioFile.name : currentAudio.split('/').pop()}
                  </span>
                </div>
              )}
            </div>
          </>
        );
      case 'Question':
        return (
          <>
            <div className="form-group">
              <label htmlFor="question">Question</label>
              <textarea
                id="question"
                name="question"
                value={formData.details.question || ''}
                onChange={handleDetailsChange}
                placeholder="Enter the question to display"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="options">Options (comma separated)</label>
              <input
                type="text"
                id="options"
                name="options"
                value={formData.details.options || ''}
                onChange={handleDetailsChange}
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          </>
        );
      case 'Rest':
      default:
        return (
          <div className="form-group">
            <label htmlFor="instructions">Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.details.instructions || ''}
              onChange={handleDetailsChange}
              placeholder="Enter instructions for this rest period"
              rows="3"
            />
          </div>
        );
    }
  };
  
  return (
    <div className="form-container">
      <h3>{step ? 'Edit Step' : 'Create New Step'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Step Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter step name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="type">Step Type*</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="Music">Music</option>
            <option value="Question">Question</option>
            <option value="Rest">Rest</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="duration">Duration (seconds)*</label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="1"
            max="3600"
            required
          />
        </div>
        
        {renderTypeSpecificFields()}
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {step ? 'Update Step' : 'Create Step'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StepForm;