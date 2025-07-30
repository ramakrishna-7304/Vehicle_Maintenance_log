require('dotenv').config();
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { sendEmail, sendLogStatusEmail } = require('../utils/emailService');

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
      console.log(`📧 Sending submission confirmation email to ${req.user.email} for log: ${title}`);
      
      const emailResult = await sendEmail(
        req.user.email,
        `Maintenance Log Submitted - ${title}`,
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Maintenance Log Submitted</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #0056b3; margin-top: 0; text-align: center;">📋 Maintenance Log Submitted</h2>
          </div>
          
          <p>Dear <strong>${req.user.name}</strong>,</p>
          
          <p>Your maintenance log has been successfully submitted and is now pending approval.</p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
            <h3 style="color: #0056b3; margin-top: 0;">Log Details:</h3>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.year})</p>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Mileage:</strong> ${mileage}</p>
            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p><strong>Assigned to:</strong> ${admin.companyName}</p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">What Happens Next?</h3>
            <ul style="margin: 10px 0;">
              <li>${admin.companyName} will review your maintenance request</li>
              <li>You'll receive an email notification when they make a decision</li>
              <li>If approved, you'll get details about cost and completion timeline</li>
            </ul>
          </div>
          
          <p>Thank you for using our vehicle maintenance system!</p>
          
          <p>Best regards,<br>
          <strong>Vehicle Maintenance Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </body>
        </html>`
      );
      
      if (emailResult.success) {
        console.log(`✅ Submission confirmation email sent successfully to ${req.user.email}`);
      } else {
        console.error(`❌ Failed to send submission confirmation email: ${emailResult.error}`);
      }
    } catch (e) {
      console.error('❌ Error sending submission confirmation email:', e.message);
      // Log but don't fail the request
    }

    res.status(201).json(createdLog);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a log
// @route   PUT /api/logs/:id
// @access  Private
const updateLog = async (req, res, next) => {
  try {
    const { title, description, date, mileage, status, rejectionReason, adminPrice, completionDate } = req.body;
    
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle');
    
    if (log && log.vehicle.user.toString() === req.user._id.toString()) {
      // Only allow updates for pending logs (unless it's an admin updating status)
      if (log.status !== 'pending' && req.user.role !== 'admin') {
        res.status(400);
        throw new Error('Cannot update approved or rejected logs');
      }

      // Store old status for email comparison
      const oldStatus = log.status;
      
      // Update fields
      log.title = title || log.title;
      log.description = description || log.description;
      log.date = date || log.date;
      log.mileage = mileage || log.mileage;
      
      // Update status-related fields if provided
      if (status) log.status = status;
      if (rejectionReason) log.rejectionReason = rejectionReason;
      if (adminPrice) log.adminPrice = adminPrice;
      if (completionDate) log.completionDate = completionDate;

      const updatedLog = await log.save();

      // Send email notification if status changed
      if (status && status !== oldStatus) {
        try {
          // Get user details for email
          const user = await User.findById(log.user);
          const admin = await User.findById(log.assignedAdmin);
          
          if (user && user.email) {
            const companyName = admin?.companyName || 'Service Center';
            const additionalData = {};
            
            if (status === 'accepted') {
              if (adminPrice) additionalData.price = adminPrice;
              if (completionDate) additionalData.completionDate = completionDate;
            } else if (status === 'rejected') {
              if (rejectionReason) additionalData.rejectionReason = rejectionReason;
            } else if (status === 'completed') {
              if (completionDate) additionalData.completionDate = completionDate;
            }
            
            console.log(`📧 Sending ${status} email to ${user.email} for log: ${log.title}`);
            
            const emailResult = await sendLogStatusEmail(
              user.email,
              user.name,
              log.title,
              status,
              companyName,
              additionalData
            );
            
            if (emailResult.success) {
              console.log(`✅ ${status} email sent successfully to ${user.email} for log ${log._id}`);
            } else {
              console.error(`❌ Failed to send ${status} email to ${user.email}: ${emailResult.error}`);
            }
          } else {
            console.warn(`⚠️ User not found or no email for log ${log._id}. User: ${log.user}, Email: ${user?.email}`);
          }
        } catch (emailError) {
          console.error('❌ Error sending status change email:', emailError);
          console.error('📧 Email Error Details:', {
            logId: log._id,
            status: status,
            userEmail: log.user,
            error: emailError.message
          });
          // Don't fail the request if email fails
        }
      }

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