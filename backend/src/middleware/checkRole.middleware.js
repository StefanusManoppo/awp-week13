// src/middleware/checkRole.middleware.js
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // req.user sudah diisi oleh middleware verifyJWT
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: You don't have permissions",
      });
    }
    
    next();
  };
};

module.exports = checkRole;