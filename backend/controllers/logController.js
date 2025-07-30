require('dotenv').config();
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// @desc    Get all logs for a vehicle
// @route   GET /api/logs?vehicleId=<vehicleId>
// @access  Private
const getLogs = async (req, res, next) => {
  const { vehicleId } = req.query;
  try {
    // First, verify the user owns the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Vehicle not found or not owned by user');
    }

    const logs = await MaintenanceLog.find({ vehicle: vehicleId }).populate('assignedAdmin', 'name companyName');
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single log
// @route   GET /api/logs/:id
// @access  Private
const getLogById = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle').populate('assignedAdmin', 'name companyName');

    if (log && log.vehicle.user.toString() === req.user._id.toString()) {
      res.json(log);
    } else {
      res.status(404);
      throw new Error('Log not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a log
// @route   POST /api/logs
// @access  Private
const createLog = async (req, res, next) => {
  const { vehicleId, title, description, date, mileage, assignedAdminId } = req.body;

  try {
    const vehicle = await Vehicle.findById(vehicleId).populate('user');
    if (!vehicle || vehicle.user._id.toString() !== req.user._id.toString()) {
      res.status(400);
      throw new Error('Vehicle not found or not owned by user');
    }

    // Verify admin exists
    const admin = await User.findById(assignedAdminId);
    if (!admin || admin.role !== 'admin') {
      res.status(400);
      throw new Error('Invalid admin selected');
    }

    const log = new MaintenanceLog({
      vehicle: vehicleId,
      user: req.user._id,
      title,
      description,
      date,
      mileage,
      cost: 0, // Will be set by admin
      assignedAdmin: assignedAdminId,
      status: 'pending',
    });

    const createdLog = await log.save();

    // Send email to user about new log submission
    try {
      await sendEmail({
        to: req.user.email,
        subject: `Maintenance Log Submitted for ${vehicle.make} ${vehicle.model}`,
        html: `<h3>Maintenance Log Submitted</h3>
          <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.year})</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Mileage:</strong> ${mileage}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Assigned to:</strong> ${admin.companyName}</p>
          <p>Your maintenance request has been submitted and is pending approval.</p>
        `,
      });
    } catch (e) {
      // Log but don't fail the request
      console.error('Failed to send log email:', e.message);
    }

    res.status(201).json(createdLog);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a log (only for pending logs)
// @route   PUT /api/logs/:id
// @access  Private
const updateLog = async (req, res, next) => {
    const { title, description, date, mileage } = req.body;
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle');

    if (log && log.vehicle.user.toString() === req.user._id.toString()) {
      // Only allow updates for pending logs
      if (log.status !== 'pending') {
        res.status(400);
        throw new Error('Cannot update approved or rejected logs');
      }

      log.title = title || log.title;
      log.description = description || log.description;
      log.date = date || log.date;
      log.mileage = mileage || log.mileage;

      const updatedLog = await log.save();
      res.json(updatedLog);
    } else {
      res.status(404);
      throw new Error('Log not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a log
// @route   DELETE /api/logs/:id
// @access  Private
const deleteLog = async (req, res, next) => {
  try {
    console.log('Delete log request for ID:', req.params.id);
    console.log('User ID:', req.user._id);

    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle');
    
    if (!log) {
      console.log('Log not found');
      res.status(404);
      throw new Error('Log not found');
    }

    console.log('Log found:', {
      logId: log._id,
      vehicleUserId: log.vehicle?.user,
      requestUserId: req.user._id,
      status: log.status
    });

    if (log.vehicle.user.toString() !== req.user._id.toString()) {
      console.log('User not authorized to delete this log');
      res.status(403);
      throw new Error('Not authorized to delete this log');
    }

    // Only allow deletion for pending logs
    if (log.status !== 'pending') {
      console.log('Cannot delete non-pending log, status:', log.status);
      res.status(400);
      throw new Error('Cannot delete approved or rejected logs');
    }

    const result = await MaintenanceLog.deleteOne({ _id: req.params.id });
    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error('Log not found or already deleted');
    }

    res.json({ message: 'Log removed successfully' });
  } catch (error) {
    console.error('Error in deleteLog:', error);
    next(error);
  }
};

module.exports = { getLogs, getLogById, createLog, updateLog, deleteLog }; 