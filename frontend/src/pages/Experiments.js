import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExperimentForm from '../components/experiments/ExperimentForm';
import './Pages.css';

const Experiments = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingExperiment, setEditingExperiment] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  useEffect(() => {
    fetchExperiments();
  }, []);
  
  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/experiments', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setExperiments(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load experiments. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };
  
  const handleCreateExperiment = async (experimentData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/experiments', experimentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      fetchExperiments();
      setIsFormOpen(false);
    } catch (err) {
      setError('Failed to create experiment. Please try again.');
      console.error(err);
    }
  };
  
  const handleUpdateExperiment = async (experimentData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/experiments/${editingExperiment._id}`, experimentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      fetchExperiments();
      setEditingExperiment(null);
      setIsFormOpen(false);
    } catch (err) {
      setError('Failed to update experiment. Please try again.');
      console.error(err);
    }
  };
  
  const handleDeleteExperiment = async (experimentId) => {
    if (window.confirm('Are you sure you want to delete this experiment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/experiments/${experimentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        fetchExperiments();
      } catch (err) {
        setError('Failed to delete experiment. Please try again.');
        console.error(err);
      }
    }
  };
  
  const handleRunExperiment = async (experimentId) => {
    try {
      // First, update the experiment status to Active
      const token = localStorage.getItem('token');
      await axios.post(`/api/experiments/${experimentId}/run`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Then open the experiment runner in a new window
      window.open(`/experiments/${experimentId}/run`, '_blank');
      
      // Refresh the experiment list to show updated status
      fetchExperiments();
    } catch (err) {
      setError('Failed to start experiment. Please try again.');
      console.error(err);
    }
  };
  
  const openEditForm = (experiment) => {
    setEditingExperiment(experiment);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingExperiment(null);
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExperiment(null);
  };
  
  if (loading) return <div className="loading">Loading experiments...</div>;
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Experiments Management</h2>
        <button className="btn-primary" onClick={handleAddNew}>
          Add New Experiment
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isFormOpen ? (
        <ExperimentForm 
          experiment={editingExperiment} 
          onSubmit={editingExperiment ? handleUpdateExperiment : handleCreateExperiment} 
          onCancel={closeForm}
        />
      ) : (
        <div className="cards-container">
          {experiments.length > 0 ? (
            experiments.map(experiment => (
              <div key={experiment._id} className="card">
                <div className="card-header">
                  <h3>{experiment.name}</h3>
                  <span className={`badge ${experiment.status.toLowerCase()}`}>
                    {experiment.status}
                  </span>
                </div>
                <div className="card-body">
                  <p>{experiment.description || 'No description provided'}</p>
                  {experiment.trial ? (
                    <p><strong>Trial:</strong> {experiment.trial.name}</p>
                  ) : experiment.trials && experiment.trials.length > 0 ? (
                    <p><strong>Trials:</strong> {experiment.trials.length} trials configured</p>
                  ) : (
                    <p><strong>Trials:</strong> None assigned</p>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => openEditForm(experiment)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteExperiment(experiment._id)}
                  >
                    Delete
                  </button>
                  {(experiment.trial || (experiment.trials && experiment.trials.length > 0)) && (
                    <button 
                      className="btn-success"
                      onClick={() => handleRunExperiment(experiment._id)}
                      disabled={experiment.status === 'Completed'}
                    >
                      Run
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No experiments found. Create one to get started.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Experiments;