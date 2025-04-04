// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Get current user from localStorage
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage', error);
    return null;
  }
};

// Check if user has specific role
export const hasRole = (requiredRoles) => {
  if (!isAuthenticated()) {
    return false;
  }
  
  const user = getCurrentUser();
  if (!user) return false;
  
  // For an array of roles, check if user has any of the required roles
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(user.role);
  }
  
  // For a single role, check if user has that role
  return user.role === requiredRoles;
};

// Clear auth data from localStorage
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};