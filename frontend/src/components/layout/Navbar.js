import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const guestLinks = (
    <ul>
      <li>
        <Link to="/login">Login</Link>
      </li>
      <li>
        <Link to="/register">Register</Link>
      </li>
    </ul>
  );
  
  const researcherLinks = (
    <ul>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li>
        <Link to="/experiments">Experiments</Link>
      </li>
      <li>
        <Link to="/trials">Trials</Link>
      </li>
      <li>
        <Link to="/steps">Steps</Link>
      </li>
      <li>
        <a href="#!" onClick={handleLogout}>Logout</a>
      </li>
    </ul>
  );
  
  const adminLinks = (
    <ul>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li>
        <Link to="/admin">Admin Panel</Link>
      </li>
      <li>
        <Link to="/experiments">Experiments</Link>
      </li>
      <li>
        <Link to="/trials">Trials</Link>
      </li>
      <li>
        <Link to="/steps">Steps</Link>
      </li>
      <li>
        <a href="#!" onClick={handleLogout}>Logout</a>
      </li>
    </ul>
  );
  
  const userLinks = (
    <ul>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li>
        <a href="#!" onClick={handleLogout}>Logout</a>
      </li>
    </ul>
  );

  // Determine which links to show based on authentication and role
  let navLinks;
  if (!isAuthenticated) {
    navLinks = guestLinks;
  } else if (user && user.role === 'admin') {
    navLinks = adminLinks;
  } else if (user && user.role === 'researcher') {
    navLinks = researcherLinks;
  } else {
    navLinks = userLinks;
  }
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1>
          <Link to={isAuthenticated ? '/dashboard' : '/'}>
            Research Experiment Management
          </Link>
        </h1>
        
        <div className="nav-links">
          {navLinks}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;