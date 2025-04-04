import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TrialForm.css';

const TrialForm = ({ trial, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    steps: []
  });
  const [availableSteps, setAvailableSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch available steps on component mount
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/steps', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("Fetched steps:", res.data);
        setAvailableSteps(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load steps. Please try again.');
        setLoading(false);
        console.error("Error fetching steps:", err);
      }
    };
    
    fetchSteps();
  }, []);
  
  // Initialize form data if editing an existing trial
  useEffect(() => {
    if (trial) {
      console.log("Initializing with trial:", trial);
      const mappedSteps = trial.steps 
        ? trial.steps
            .sort((a, b) => a.order - b.order)
            .map((stepInfo) => {
              const stepData = stepInfo.step && typeof stepInfo.step === 'object'
                ? stepInfo.step
                : availableSteps.find(s => s._id === stepInfo.step);
              
              return {
                id: `instance-${Date.now()}-${Math.random()}`,
                step: stepInfo.step && typeof stepInfo.step === 'object' ? stepInfo.step._id : stepInfo.step,
                stepData,
                order: stepInfo.order
              };
            })
        : [];
      
      setFormData({
        name: trial.name || '',
        description: trial.description || '',
        steps: mappedSteps
      });
    }
  }, [trial, availableSteps]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add a step to the selected steps
  const addStep = (stepToAdd) => {
    const uniqueId = `instance-${Date.now()}-${Math.random()}`;
    
    const newStep = {
      id: uniqueId,
      step: stepToAdd._id,
      stepData: stepToAdd,
      order: formData.steps.length // Add to the end of the list
    };
    
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    
    console.log("Added step:", newStep);
  };
  
  // Move a step up in the order
  const moveStepUp = (index) => {
    if (index === 0) return; // Already at the top
    
    const updatedSteps = [...formData.steps];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index - 1];
    updatedSteps[index - 1] = temp;
    
    // Update order values
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      order: i
    }));
    
    setFormData(prev => ({
      ...prev,
      steps: reorderedSteps
    }));
  };
  
  // Move a step down in the order
  const moveStepDown = (index) => {
    if (index === formData.steps.length - 1) return; // Already at the bottom
    
    const updatedSteps = [...formData.steps];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[index + 1];
    updatedSteps[index + 1] = temp;
    
    // Update order values
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      order: i
    }));
    
    setFormData(prev => ({
      ...prev,
      steps: reorderedSteps
    }));
  };
  
  const removeStep = (stepId) => {
    console.log("Removing step:", stepId);
    const updatedSteps = formData.steps.filter(s => s.id !== stepId);
    
    // Re-order remaining steps
    const reorderedSteps = updatedSteps.map((step, index) => ({
      ...step,
      order: index
    }));
    
    setFormData(prev => ({
      ...prev,
      steps: reorderedSteps
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format data for API
    const trialData = {
      name: formData.name,
      description: formData.description,
      steps: formData.steps.map(s => ({
        step: typeof s.step === 'object' ? s.step._id : s.step,
        order: s.order
      }))
    };
    
    console.log("Submitting trial data:", trialData);
    
    try {
      const token = localStorage.getItem('token');
      const url = trial && trial._id ? `/api/trials/${trial._id}` : '/api/trials';
      const method = trial && trial._id ? 'put' : 'post';
      
      const response = await axios({
        method,
        url,
        data: trialData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Trial saved successfully:", response.data);
      onSubmit(response.data);
    } catch (err) {
      console.error("Error saving trial:", err.response?.data || err.message);
      setError('Failed to save trial. Please try again.');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading steps...</div>;
  }
  
  return (
    <div className="form-container">
      <h3>{trial ? 'Edit Trial' : 'Create New Trial'}</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Trial Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter trial name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter trial description"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label>Steps</label>
          <p className="form-help">Click the + button to add steps to your trial.</p>
          
          <div className="dnd-container">
            <div className="dnd-column">
              <h4>Available Steps</h4>
              <div className="dnd-list">
                {availableSteps.length === 0 ? (
                  <div className="dnd-empty">No steps available</div>
                ) : (
                  availableSteps.map((step) => (
                    <div key={step._id} className="dnd-item">
                      <div className="dnd-item-content">
                        <div className="dnd-item-name">{step.name || 'Unnamed Step'}</div>
                        <div className="dnd-item-badge">{step.type}</div>
                      </div>
                      <div className="dnd-item-actions">
                        <div className="dnd-item-duration">{step.duration}s</div>
                        <button
                          type="button"
                          className="dnd-item-add"
                          onClick={() => addStep(step)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4CAF50',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '0 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="dnd-column">
              <h4>Selected Steps</h4>
              <div className="dnd-list">
                {formData.steps.length === 0 ? (
                  <div className="dnd-empty">No steps selected</div>
                ) : (
                  formData.steps.map((stepItem, index) => {
                    const stepData = stepItem.stepData || 
                                    availableSteps.find(s => s._id === stepItem.step) ||
                                    { name: 'Unknown Step', type: 'Unknown' };
                                    
                    return (
                      <div key={stepItem.id} className="dnd-item">
                        <div className="dnd-item-content">
                          <div className="dnd-item-name">
                            {stepData.name || 'Unnamed Step'}
                          </div>
                          <div className="dnd-item-badge">
                            {stepData.type}
                          </div>
                        </div>
                        <div className="dnd-item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                          <div className="dnd-item-order">#{index + 1}</div>
                          {index > 0 && (
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2196F3',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '1.2rem'
                              }}
                              onClick={() => moveStepUp(index)}
                            >
                              ↑
                            </button>
                          )}
                          {index < formData.steps.length - 1 && (
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2196F3',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '1.2rem'
                              }}
                              onClick={() => moveStepDown(index)}
                            >
                              ↓
                            </button>
                          )}
                          <button
                            type="button"
                            className="dnd-item-remove"
                            onClick={() => removeStep(stepItem.id)}
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {trial ? 'Update Trial' : 'Create Trial'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrialForm;