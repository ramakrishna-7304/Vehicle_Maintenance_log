const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getAdminLogs,
  acceptLog,
  rejectLog,
  getAdminStats,
  getCompanies,
} = require('../controllers/adminController');

const router = express.Router();

// Admin middleware to check if user is admin
const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied. Admin only.');
  }
};

// Public route to get companies
router.get('/companies', getCompanies);

// Protected admin routes
router.use(protect);
router.use(adminProtect);

router.get('/logs', getAdminLogs);
router.get('/stats', getAdminStats);
router.put('/logs/:id/accept', acceptLog);
router.put('/logs/:id/reject', rejectLog);

module.exports = router; 