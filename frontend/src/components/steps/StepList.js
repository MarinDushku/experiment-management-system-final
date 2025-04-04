import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StepList.css';

const StepList = ({ onEdit, onNewStep }) => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        console.log('Fetching steps...');
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/steps', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Steps response:', res.data);
        setSteps(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching steps:', err.response ? err.response.data : err.message);
        setError('Failed to load steps. Please try again.');
        setLoading(false);
      }
    };

    fetchSteps();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/steps/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSteps(steps.filter(step => step._id !== id));
      } catch (err) {
        console.error('Error deleting step:', err.response ? err.response.data : err.message);
        setError('Failed to delete step. Please try again.');
      }
    }
  };

  const renderStepDetails = (step) => {
    switch (step.type) {
      case 'Music':
        return <p>Audio: {step.details?.audioFile || 'No audio file specified'}</p>;
      case 'Question':
        return (
          <>
            <p>Question: {step.details?.question || 'No question specified'}</p>
            <p>Options: {step.details?.options || 'No options specified'}</p>
          </>
        );
      case 'Rest':
      default:
        return <p>Instructions: {step.details?.instructions || 'No instructions specified'}</p>;
    }
  };

  if (loading) return <div className="loading">Loading steps...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="step-list">
      <div className="step-list-header">
        <h2>Experiment Steps</h2>
        <button className="btn-primary" onClick={onNewStep}>Create New Step</button>
      </div>
      
      {steps.length === 0 ? (
        <div className="no-steps">
          No steps found. Create your first step to get started.
        </div>
      ) : (
        <div className="steps-container">
          {steps.map(step => (
            <div key={step._id} className="step-card">
              <div className="step-header">
                <h3>{step.name}</h3>
                <span className={`step-type ${step.type.toLowerCase()}`}>{step.type}</span>
              </div>
              <div className="step-content">
                <p>Duration: {step.duration} seconds</p>
                {renderStepDetails(step)}
              </div>
              <div className="step-actions">
                <button 
                  className="btn-edit" 
                  onClick={() => onEdit(step)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDelete(step._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StepList;