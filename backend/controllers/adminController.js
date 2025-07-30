const MaintenanceLog = require('../models/MaintenanceLog');
const User = require('../models/User');
const { sendLogStatusEmail } = require('../utils/emailService');

// @desc    Get all logs assigned to admin
// @route   GET /api/admin/logs
// @access  Private/Admin
const getAdminLogs = async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.find({ assignedAdmin: req.user._id })
      .populate('user', 'name email')
      .populate('vehicle', 'make model licensePlate')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a maintenance log
// @route   PUT /api/admin/logs/:id/accept
// @access  Private/Admin
const acceptLog = async (req, res, next) => {
  try {
    const { price, completionDate, adminNotes } = req.body;
    const log = await MaintenanceLog.findById(req.params.id)
      .populate('user', 'name email');

    if (!log) {
      res.status(404);
      throw new Error('Log not found');
    }

    if (log.assignedAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this log');
    }

    log.status = 'accepted';
    log.adminPrice = price;
    log.completionDate = completionDate;
    log.adminNotes = adminNotes;

    await log.save();

    // Send email notification
    console.log('📧 Attempting to send acceptance email...');
    const emailResult = await sendLogStatusEmail(
      log.user.email,
      log.user.name,
      log.title,
      'accepted',
      req.user.companyName,
      {
        price: price,
        completionDate: completionDate
      }
    );

    if (emailResult.success) {
      console.log('✅ Acceptance email sent successfully');
    } else {
      console.log('⚠️ Warning: Acceptance email failed to send, but log was updated');
    }

    res.json({
      ...log.toObject(),
      emailSent: emailResult.success,
      message: emailResult.success 
        ? 'Log accepted and email notification sent' 
        : 'Log accepted but email notification failed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a maintenance log
// @route   PUT /api/admin/logs/:id/reject
// @access  Private/Admin
const rejectLog = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const log = await MaintenanceLog.findById(req.params.id)
      .populate('user', 'name email');

    if (!log) {
      res.status(404);
      throw new Error('Log not found');
    }

    if (log.assignedAdmin.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this log');
    }

    log.status = 'rejected';
    log.adminNotes = adminNotes;

    await log.save();

    // Send email notification
    console.log('📧 Attempting to send rejection email...');
    const emailResult = await sendLogStatusEmail(
      log.user.email,
      log.user.name,
      log.title,
      'rejected',
      req.user.companyName,
      {
        rejectionReason: adminNotes
      }
    );

    if (emailResult.success) {
      console.log('✅ Rejection email sent successfully');
    } else {
      console.log('⚠️ Warning: Rejection email failed to send, but log was updated');
    }

    res.json({
      ...log.toObject(),
      emailSent: emailResult.success,
      message: emailResult.success 
        ? 'Log rejected and email notification sent' 
        : 'Log rejected but email notification failed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.find({ assignedAdmin: req.user._id });

    const totalEarned = logs
      .filter(log => log.status === 'accepted')
      .reduce((sum, log) => sum + (log.adminPrice || 0), 0);

    const pendingVehicles = logs.filter(log => log.status === 'pending').length;
    const acceptedVehicles = logs.filter(log => log.status === 'accepted').length;

    res.json({
      totalEarned,
      pendingVehicles,
      acceptedVehicles,
      totalLogs: logs.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admins (companies)
// @route   GET /api/admin/companies
// @access  Public
const getCompanies = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('_id name companyName')
      .sort({ companyName: 1 });

    res.json(admins);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminLogs,
  acceptLog,
  rejectLog,
  getAdminStats,
  getCompanies,
}; 