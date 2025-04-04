import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TrialForm from '../components/trials/TrialForm';
import './Pages.css';

const Trials = () => {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTrial, setEditingTrial] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  useEffect(() => {
    fetchTrials();
  }, []);
  
  const fetchTrials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/trials', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTrials(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load trials. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };
  
  const handleCreateTrial = async (trialData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/trials', trialData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh trials list
      fetchTrials();
      setIsFormOpen(false);
    } catch (err) {
      setError('Failed to create trial. Please try again.');
      console.error(err);
    }
  };
  
  const handleUpdateTrial = async (trialData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/trials/${editingTrial._id}`, trialData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh trials list
      fetchTrials();
      setEditingTrial(null);
      setIsFormOpen(false);
    } catch (err) {
      setError('Failed to update trial. Please try again.');
      console.error(err);
    }
  };
  
  const handleDeleteTrial = async (trialId) => {
    if (window.confirm('Are you sure you want to delete this trial?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/trials/${trialId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Refresh trials list
        fetchTrials();
      } catch (err) {
        setError('Failed to delete trial. Please try again.');
        console.error(err);
      }
    }
  };
  
  const openEditForm = (trial) => {
    setEditingTrial(trial);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingTrial(null);
    setIsFormOpen(true);
  };
  
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTrial(null);
  };
  
  if (loading) return <div className="loading">Loading trials...</div>;
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Trials Management</h2>
        <button className="btn-primary" onClick={handleAddNew}>
          Add New Trial
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {isFormOpen ? (
        <TrialForm 
          trial={editingTrial} 
          onSubmit={editingTrial ? handleUpdateTrial : handleCreateTrial} 
          onCancel={closeForm}
        />
      ) : (
        <div className="cards-container">
          {trials.length > 0 ? (
            trials.map(trial => (
              <div key={trial._id} className="card">
                <div className="card-header">
                  <h3>{trial.name}</h3>
                </div>
                <div className="card-body">
                  <p>{trial.description || 'No description provided'}</p>
                  <p><strong>Steps:</strong> {trial.steps.length}</p>
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => openEditForm(trial)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteTrial(trial._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No trials found. Create one to get started.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Trials;