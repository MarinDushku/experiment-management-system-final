import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExperimentForm.css';

const ExperimentForm = ({ experiment, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trials: [],
    status: 'Draft'
  });
  const [availableTrials, setAvailableTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTrials = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/trials', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("Fetched trials:", res.data);
        setAvailableTrials(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load trials. Please try again.');
        setLoading(false);
        console.error("Error fetching trials:", err);
      }
    };
    
    fetchTrials();
  }, []);
  
  useEffect(() => {
    // If editing an existing experiment, populate the form
    if (experiment) {
      console.log("Initializing with experiment:", experiment);
      
      // Handle both single trial and multiple trials format
      let initialTrials = [];
      if (experiment.trials && experiment.trials.length > 0) {
        // New format with multiple ordered trials
        initialTrials = experiment.trials
          .sort((a, b) => a.order - b.order)
          .map((trialInfo) => {
            const trialData = trialInfo.trial && typeof trialInfo.trial === 'object'
              ? trialInfo.trial
              : availableTrials.find(t => t._id === trialInfo.trial);
              
            return {
              id: `trial-instance-${Date.now()}-${Math.random()}`,
              trial: trialInfo.trial && typeof trialInfo.trial === 'object' ? trialInfo.trial._id : trialInfo.trial,
              trialData,
              order: trialInfo.order
            };
          });
      } else if (experiment.trial) {
        // Old format with single trial
        const trialData = experiment.trial && typeof experiment.trial === 'object'
          ? experiment.trial
          : availableTrials.find(t => t._id === experiment.trial);
          
        initialTrials = [{
          id: `trial-instance-${Date.now()}-${Math.random()}`,
          trial: experiment.trial && typeof experiment.trial === 'object' ? experiment.trial._id : experiment.trial,
          trialData,
          order: 0
        }];
      }
      
      setFormData({
        name: experiment.name || '',
        description: experiment.description || '',
        trials: initialTrials,
        status: experiment.status || 'Draft'
      });
    }
  }, [experiment, availableTrials]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add a trial to the selected trials
  const addTrial = (trialToAdd) => {
    // Check if this trial is already in the selected trials
    const trialExists = formData.trials.some(t => 
      t.trial === trialToAdd._id || 
      (typeof t.trial === 'object' && t.trial._id === trialToAdd._id)
    );
    
    if (trialExists) {
      console.log("Trial already exists in selection");
      return;
    }
    
    const uniqueId = `trial-instance-${Date.now()}-${Math.random()}`;
    
    const newTrial = {
      id: uniqueId,
      trial: trialToAdd._id,
      trialData: trialToAdd,
      order: formData.trials.length // Add to the end of the list
    };
    
    setFormData(prev => ({
      ...prev,
      trials: [...prev.trials, newTrial]
    }));
    
    console.log("Added trial:", newTrial);
  };
  
  // Move a trial up in the order
  const moveTrialUp = (index) => {
    if (index === 0) return; // Already at the top
    
    const updatedTrials = [...formData.trials];
    const temp = updatedTrials[index];
    updatedTrials[index] = updatedTrials[index - 1];
    updatedTrials[index - 1] = temp;
    
    // Update order values
    const reorderedTrials = updatedTrials.map((trial, i) => ({
      ...trial,
      order: i
    }));
    
    setFormData(prev => ({
      ...prev,
      trials: reorderedTrials
    }));
  };
  
  // Move a trial down in the order
  const moveTrialDown = (index) => {
    if (index === formData.trials.length - 1) return; // Already at the bottom
    
    const updatedTrials = [...formData.trials];
    const temp = updatedTrials[index];
    updatedTrials[index] = updatedTrials[index + 1];
    updatedTrials[index + 1] = temp;
    
    // Update order values
    const reorderedTrials = updatedTrials.map((trial, i) => ({
      ...trial,
      order: i
    }));
    
    setFormData(prev => ({
      ...prev,
      trials: reorderedTrials
    }));
  };
  
  // Remove a trial from the selection
  const removeTrial = (trialId) => {
    console.log("Removing trial:", trialId);
    const updatedTrials = formData.trials.filter(t => t.id !== trialId);
    
    // Re-order remaining trials
    const reorderedTrials = updatedTrials.map((trial, index) => ({
      ...trial,
      order: index
    }));
    
    setFormData(prev => ({
      ...prev,
      trials: reorderedTrials
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format data for API
    const experimentData = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      trials: formData.trials.map(t => ({
        trial: typeof t.trial === 'object' ? t.trial._id : t.trial,
        order: t.order
      }))
    };
    
    console.log("Submitting experiment data:", experimentData);
    
    try {
      const token = localStorage.getItem('token');
      const url = experiment && experiment._id ? `/api/experiments/${experiment._id}` : '/api/experiments';
      const method = experiment && experiment._id ? 'put' : 'post';
      
      const response = await axios({
        method,
        url,
        data: experimentData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Experiment saved successfully:", response.data);
      onSubmit(response.data);
    } catch (err) {
      console.error("Error saving experiment:", err.response?.data || err.message);
      setError('Failed to save experiment. Please try again.');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading trials...</div>;
  }
  
  return (
    <div className="form-container">
      <h3>{experiment ? 'Edit Experiment' : 'Create New Experiment'}</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Experiment Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter experiment name"
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
            placeholder="Enter experiment description"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label>Trials</label>
          <p className="form-help">Click the + button to add trials to your experiment and order them as needed.</p>
          
          <div className="dnd-container">
            <div className="dnd-column">
              <h4>Available Trials</h4>
              <div className="dnd-list">
                {availableTrials.length === 0 ? (
                  <div className="dnd-empty">No trials available</div>
                ) : (
                  availableTrials.map((trial) => (
                    <div key={trial._id} className="dnd-item">
                      <div className="dnd-item-content">
                        <div className="dnd-item-name">{trial.name || 'Unnamed Trial'}</div>
                        <div className="dnd-item-badge">
                          {trial.steps && trial.steps.length} steps
                        </div>
                      </div>
                      <div className="dnd-item-actions">
                        <button
                          type="button"
                          className="dnd-item-add"
                          onClick={() => addTrial(trial)}
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
              <h4>Selected Trials</h4>
              <div className="dnd-list">
                {formData.trials.length === 0 ? (
                  <div className="dnd-empty">No trials selected</div>
                ) : (
                  formData.trials.map((trialItem, index) => {
                    const trialData = trialItem.trialData || 
                                     availableTrials.find(t => t._id === trialItem.trial) ||
                                     { name: 'Unknown Trial', steps: [] };
                                     
                    return (
                      <div key={trialItem.id} className="dnd-item">
                        <div className="dnd-item-content">
                          <div className="dnd-item-name">
                            {trialData.name || 'Unnamed Trial'}
                          </div>
                          <div className="dnd-item-badge">
                            {trialData.steps && trialData.steps.length} steps
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
                              onClick={() => moveTrialUp(index)}
                            >
                              ↑
                            </button>
                          )}
                          {index < formData.trials.length - 1 && (
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
                              onClick={() => moveTrialDown(index)}
                            >
                              ↓
                            </button>
                          )}
                          <button
                            type="button"
                            className="dnd-item-remove"
                            onClick={() => removeTrial(trialItem.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44336',
                              fontSize: '1.2rem',
                              cursor: 'pointer',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
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
        
        {experiment && (
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {experiment ? 'Update Experiment' : 'Create Experiment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExperimentForm;