import React from 'react';
import { useAuth } from '../contexts/authContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="dashboard-content">
        <div className="welcome-card">
          <h3>Welcome, {user?.username}</h3>
          <p>Role: {user?.role}</p>
          <p>
            {user?.role === 'user' && 'You have standard user access.'}
            {user?.role === 'researcher' && 'You can create and manage experiments, trials, and steps.'}
            {user?.role === 'admin' && 'You have full administrative access.'}
          </p>
        </div>
        
        <div className="dashboard-actions">
          {(user?.role === 'researcher' || user?.role === 'admin') && (
            <div className="action-cards">
              <div className="action-card">
                <h4>Experiments</h4>
                <p>Create and manage research experiments</p>
                <a href="/experiments" className="btn-secondary">Go to Experiments</a>
              </div>
              <div className="action-card">
                <h4>Trials</h4>
                <p>Create and manage experiment trials</p>
                <a href="/trials" className="btn-secondary">Go to Trials</a>
              </div>
              <div className="action-card">
                <h4>Steps</h4>
                <p>Create and manage trial steps</p>
                <a href="/steps" className="btn-secondary">Go to Steps</a>
              </div>
            </div>
          )}
          
          {user?.role === 'admin' && (
            <div className="admin-card">
              <h4>Admin Functions</h4>
              <p>Manage users and system settings</p>
              <a href="/admin" className="btn-secondary">Go to Admin Panel</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;