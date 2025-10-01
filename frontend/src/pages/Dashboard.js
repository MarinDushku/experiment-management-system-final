import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="dashboard-layout">
        {/* Welcome section */}
        <div className="welcome-section">
          <div className="welcome-card">
            <h2>Welcome, {user?.username}</h2>
            <span className="role-badge">{user?.role}</span>
            <p className="welcome-text">
              {user?.role === 'user' && 'You have standard user access.'}
              {user?.role === 'researcher' && 'You can create and manage experiments, trials, and steps.'}
              {user?.role === 'admin' && 'You have full administrative access.'}
            </p>
          </div>
          
          {user?.role === 'admin' && (
            <div className="admin-card">
              <div className="card-icon">
                <i className="fas fa-user-shield"></i>
              </div>
              <div className="card-content">
                <h3>Admin Functions</h3>
                <p>Manage users and system settings</p>
                <Link to="/admin" className="action-button admin-button">
                  Go to Admin Panel
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Main actions section */}
        {(user?.role === 'researcher' || user?.role === 'admin') && (
          <div className="actions-section">
            <div className="action-card">
              <div className="card-icon">
                <i className="fas fa-flask"></i>
              </div>
              <div className="card-content">
                <h3>Experiments</h3>
                <p>Create and manage research experiments</p>
                <Link to="/experiments" className="action-button">
                  Go to Experiments
                </Link>
              </div>
            </div>
            
            <div className="action-card">
              <div className="card-icon">
                <i className="fas fa-vial"></i>
              </div>
              <div className="card-content">
                <h3>Trials</h3>
                <p>Create and manage experiment trials</p>
                <Link to="/trials" className="action-button">
                  Go to Trials
                </Link>
              </div>
            </div>
            
            <div className="action-card">
              <div className="card-icon">
                <i className="fas fa-shoe-prints"></i>
              </div>
              <div className="card-content">
                <h3>Steps</h3>
                <p>Create and manage trial steps</p>
                <Link to="/steps" className="action-button">
                  Go to Steps
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Participant section for regular users */}
        {user?.role === 'user' && (
          <div className="participant-section">
            <h2>Experiment Participation</h2>
            <div className="participant-cards">
              <div className="action-card">
                <div className="card-icon">
                  <i className="fas fa-link"></i>
                </div>
                <div className="card-content">
                  <h3>Connect to Experiment</h3>
                  <p>Join an experiment session by connecting to an admin device</p>
                  <Link to="/devices" className="action-button">
                    Connect to Device
                  </Link>
                </div>
              </div>
              
              <div className="action-card">
                <div className="card-icon">
                  <i className="fas fa-brain"></i>
                </div>
                <div className="card-content">
                  <h3>Join EEG Test</h3>
                  <p>Participate in EEG experiments and tasks</p>
                  <Link to="/eeg-test" className="action-button">
                    Start EEG Test
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="participant-info">
              <h3>How to Participate</h3>
              <ol>
                <li><strong>Connect:</strong> Use "Connect to Device" to pair with the admin's computer</li>
                <li><strong>Enter Code:</strong> The admin will provide a 6-digit pairing code</li>
                <li><strong>Participate:</strong> Follow experiment instructions on your device</li>
                <li><strong>Stay Connected:</strong> Keep this device connected during the experiment</li>
              </ol>
              
              <div className="status-info">
                <p><strong>Your Role:</strong> Experiment Participant</p>
                <p><strong>Access Level:</strong> You can participate in experiments but cannot create or manage them</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;