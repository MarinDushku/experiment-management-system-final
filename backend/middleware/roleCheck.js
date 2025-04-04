// Role-based access control middleware
const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
      // Get user from the auth middleware
      const { user } = req;
      
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized - No user found' });
      }
      
      // Check if user role is in the allowed roles
      const hasPermission = allowedRoles.includes(user.role);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Access denied. Role '${user.role}' is not authorized for this action.` 
        });
      }
      
      next();
    };
  };
  
  module.exports = roleCheck;