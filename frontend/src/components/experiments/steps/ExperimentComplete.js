import React from 'react';

const ExperimentComplete = ({ experimentName, onExit }) => {
  return (
    <div className="experiment-run">
      <div className="completion-container">
        <h2>Experiment Completed</h2>
        <p>Thank you for completing the experiment: <strong>{experimentName}</strong></p>
        <button onClick={onExit} className="btn-primary">
          Return to Experiments
        </button>
      </div>
    </div>
  );
};

export default ExperimentComplete;