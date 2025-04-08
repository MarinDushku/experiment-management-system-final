// AdminPanel.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ExperimentResults from '../components/admin/ExperimentResults';
import './AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const res = await api.get('/users');
        console.log('Users fetched:', res.data);
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error details:', err.response?.data || err.message);
        setError(`Failed to load users: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const changeRole = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role } : user
      ));
    } catch (err) {
      setError('Failed to update user role. Please try again.');
      console.error('Error updating role:', err.response?.data || err.message);
    }
  };
  
  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        
        // Update local state
        setUsers(users.filter(user => user._id !== userId));
      } catch (err) {
        setError('Failed to delete user. Please try again.');
        console.error('Error deleting user:', err.response?.data || err.message);
      }
    }
  };
  
  if (loading) return <div className="loading">Loading users...</div>;
  
  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="user-management">
        <h3>User Management</h3>
        
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>
                      <select 
                        value={user.role}
                        onChange={(e) => changeRole(user._id, e.target.value)}
                        disabled={user.username === 'md'} // Prevent changing admin role
                      >
                        <option value="user">User</option>
                        <option value="researcher">Researcher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteUser(user._id)}
                        disabled={user.username === 'md'} // Prevent deleting admin
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-users">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Experiment Results Component */}
      <ExperimentResults />
    </div>
  );
};

export default AdminPanel;