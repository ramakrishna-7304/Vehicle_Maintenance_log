const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

// Admin-specific middleware
const adminProtect = async (req, res, next) => {
  try {
    // First check if user is authenticated
    await protect(req, res, () => {});
    
    // Then check if user is admin
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403);
      throw new Error('Access denied. Admin only.');
    }
  } catch (error) {
    next(error);
  }
};

// User-specific middleware (optional, for explicit user-only routes)
const userProtect = async (req, res, next) => {
  try {
    // First check if user is authenticated
    await protect(req, res, () => {});
    
    // Then check if user is not admin (i.e., regular user)
    if (req.user && req.user.role === 'user') {
      next();
    } else {
      res.status(403);
      throw new Error('Access denied. Users only.');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, adminProtect, userProtect }; 