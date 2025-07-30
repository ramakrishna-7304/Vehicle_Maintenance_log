const express = require('express');
const { adminProtect } = require('../middleware/authMiddleware');
const {
  getAdminLogs,
  acceptLog,
  rejectLog,
  getAdminStats,
  getCompanies,
} = require('../controllers/adminController');

const router = express.Router();

// Public route to get companies (for user registration dropdown)
router.get('/companies', getCompanies);

// Admin-only routes
router.get('/logs', adminProtect, getAdminLogs);
router.get('/stats', adminProtect, getAdminStats);
router.put('/logs/:id/accept', adminProtect, acceptLog);
router.put('/logs/:id/reject', adminProtect, rejectLog);

module.exports = router; 