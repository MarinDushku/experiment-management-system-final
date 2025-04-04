import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasRole, isAuthenticated } from './utils/auth';

// Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Experiments from './pages/Experiments';
import Trials from './pages/Trials';
import Steps from './pages/Steps';
import ExperimentRun from './components/experiments/ExperimentRun';

// Route guard component
const ProtectedRoute = ({ element, requiredRoles }) => {
  // Check if the user is authenticated and has the required role
  const isAuthorized = hasRole(requiredRoles);
  
  // If authorized, render the component; otherwise, redirect to login
  return isAuthorized ? element : <Navigate to="/login" />;
};

// Landing page redirector
const LandingRedirect = () => {
  const authenticated = isAuthenticated();
  return authenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

// Define routes configuration
const routes = [
  {
    path: '/',
    element: <LandingRedirect />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute element={<Dashboard />} requiredRoles={['user', 'researcher', 'admin']} />
  },
  {
    path: '/admin',
    element: <ProtectedRoute element={<AdminPanel />} requiredRoles={['admin']} />
  },
  {
    path: '/experiments',
    element: <ProtectedRoute element={<Experiments />} requiredRoles={['researcher', 'admin']} />
  },
  {
    path: '/experiments/:id/run',
    element: <ProtectedRoute element={<ExperimentRun />} requiredRoles={['researcher', 'admin']} />
  },
  {
    path: '/trials',
    element: <ProtectedRoute element={<Trials />} requiredRoles={['researcher', 'admin']} />
  },
  {
    path: '/steps',
    element: <ProtectedRoute element={<Steps />} requiredRoles={['researcher', 'admin']} />
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" />
  }
];

export default routes;