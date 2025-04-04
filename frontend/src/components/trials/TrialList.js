import React, { useState } from 'react';
import './TrialList.css';

const TrialList = ({ trials, onEdit, onDelete, onNewTrial }) => {
  const [expandedTrials, setExpandedTrials] = useState({});
  
  const toggleExpand = (trialId) => {
    setExpandedTrials(prev => ({
      ...prev,
      [trialId]: !prev[trialId]
    }));
  };
  
  return (
    <div className="trial-list">
      <div className="list-header">
        <h2>Experiment Trials</h2>
        <button className="btn-primary" onClick={onNewTrial}>
          Create New Trial
        </button>
      </div>
      
      {trials.length === 0 ? (
        <div className="no-trials">
          No trials found. Create your first trial to get started.
        </div>
      ) : (
        <div className="trials-container">
          {trials.map(trial => (
            <div key={trial._id} className="trial-card">
              <div className="trial-header">
                <h3>{trial.name}</h3>
                <div className="trial-info">
                  <span className="trial-steps-count">
                    {trial.steps.length} steps
                  </span>
                  <button 
                    className={`btn-expand ${expandedTrials[trial._id] ? 'expanded' : ''}`}
                    onClick={() => toggleExpand(trial._id)}
                  >
                    {expandedTrials[trial._id] ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              
              {trial.description && (
                <div className="trial-description">
                  {trial.description}
                </div>
              )}
              
              {expandedTrials[trial._id] && (
                <div className="trial-steps">
                  <h4>Steps Sequence:</h4>
                  <div className="steps-list">
                    {trial.steps
                      .sort((a, b) => a.order - b.order)
                      .map((stepInfo, index) => {
                        const step = stepInfo.step;
                        return (
                          <div key={index} className="trial-step-item">
                            <div className="step-number">{index + 1}</div>
                            <div className="step-details">
                              <div className="step-name">{step.name}</div>
                              <div className="step-type-badge">{step.type}</div>
                              <div className="step-duration">{step.duration}s</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              
              <div className="trial-actions">
                <button 
                  className="btn-edit" 
                  onClick={() => onEdit(trial)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => onDelete(trial._id)}
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

export default TrialList;