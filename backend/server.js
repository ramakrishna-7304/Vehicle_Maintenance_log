const express = require('express');
require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const cron = require('node-cron');
const MaintenanceLog = require('./models/MaintenanceLog');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const { sendEmail, sendCompletionReminderEmail, validateEmailConfig, verifyTransporter } = require('./utils/emailService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const logRoutes = require('./routes/logRoutes');
const adminRoutes = require('./routes/adminRoutes');
const testRoutes = require('./routes/testRoutes');
console.log('MONGO_URI:', process.env.MONGO_URI); // 🔍 Debug check

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Email service verification on startup
const verifyEmailService = async () => {
  console.log('🔧 Verifying email service configuration...');
  
  if (!validateEmailConfig()) {
    console.log('⚠️ Email service not configured - notifications will be disabled');
    return false;
  }
  
  const isVerified = await verifyTransporter();
  if (isVerified) {
    console.log('✅ Email service ready for notifications');
  } else {
    console.log('❌ Email service verification failed - notifications will be disabled');
  }
  return isVerified;
};

// Cron job: every day at 8am
cron.schedule('0 8 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0,0,0,0);
    const nextDay = new Date(tomorrow);
    nextDay.setHours(23,59,59,999);
    // Find logs with nextDueDate tomorrow
    const logs = await MaintenanceLog.find({
      nextDueDate: { $gte: tomorrow, $lte: nextDay }
    }).populate({ path: 'vehicle', populate: { path: 'user' } });
    for (const log of logs) {
      if (log.vehicle && log.vehicle.user && log.vehicle.user.email) {
        await sendEmail(
          log.vehicle.user.email,
          `Service Reminder: ${log.title} for ${log.vehicle.make} ${log.vehicle.model}`,
          `<h3>Upcoming Service Reminder</h3>
            <p><strong>Vehicle:</strong> ${log.vehicle.make} ${log.vehicle.model} (${log.vehicle.year})</p>
            <p><strong>Service:</strong> ${log.title}</p>
            <p><strong>Due Date:</strong> ${log.nextDueDate.toISOString().slice(0,10)}</p>
            <p>Please ensure your vehicle is serviced on time.</p>
          `
        );
      }
    }
    if (logs.length > 0) {
      console.log(`Sent ${logs.length} service reminder emails.`);
    }
  } catch (e) {
    console.error('Cron job error:', e.message);
  }
});

// Cron job: Check for completion reminders every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🕐 Running completion reminder check...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find logs that are accepted and have completion date today
    const completionLogs = await MaintenanceLog.find({
      status: 'accepted',
      completionDate: { 
        $gte: today, 
        $lt: tomorrow 
      },
      // Only send reminder if we haven't sent one recently (optional field)
      completionReminderSent: { $ne: true }
    }).populate('user', 'name email')
      .populate('assignedAdmin', 'name companyName');
    
    console.log(`📧 Found ${completionLogs.length} logs with completion date today`);
    
    for (const log of completionLogs) {
      try {
        if (log.user && log.user.email) {
          const companyName = log.assignedAdmin?.companyName || 'Service Center';
          
          console.log(`📧 Sending completion reminder for log: ${log.title} to ${log.user.email}`);
          
          const emailResult = await sendCompletionReminderEmail(
            log.user.email,
            log.user.name,
            log.title,
            companyName,
            log.completionDate,
            log.adminPrice
          );
          
          if (emailResult.success) {
            // Mark that we've sent the reminder (optional)
            log.completionReminderSent = true;
            await log.save();
            console.log(`✅ Completion reminder sent successfully for log: ${log._id}`);
          } else {
            console.error(`❌ Failed to send completion reminder for log: ${log._id}: ${emailResult.error}`);
          }
        } else {
          console.warn(`⚠️ No user email found for log: ${log._id}`);
        }
      } catch (logError) {
        console.error(`❌ Error processing completion reminder for log ${log._id}:`, logError.message);
      }
    }
    
    if (completionLogs.length > 0) {
      console.log(`📧 Completion reminder check completed. Processed ${completionLogs.length} logs.`);
    }
  } catch (error) {
    console.error('❌ Completion reminder cron job error:', error.message);
  }
});

// Cron job: Check for overdue pickup reminders (every 6 hours)
cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('🕐 Running overdue pickup reminder check...');
    
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Find logs that are accepted, completed, and past completion date by 3+ days
    const overdueLogs = await MaintenanceLog.find({
      status: 'accepted',
      completionDate: { $lt: threeDaysAgo },
      // Only send reminder if we haven't sent one recently
      overdueReminderSent: { $ne: true }
    }).populate('user', 'name email')
      .populate('assignedAdmin', 'name companyName');
    
    console.log(`📧 Found ${overdueLogs.length} overdue pickup logs`);
    
    for (const log of overdueLogs) {
      try {
        if (log.user && log.user.email) {
          const companyName = log.assignedAdmin?.companyName || 'Service Center';
          const daysOverdue = Math.floor((now - log.completionDate) / (1000 * 60 * 60 * 24));
          
          console.log(`📧 Sending overdue pickup reminder for log: ${log.title} to ${log.user.email} (${daysOverdue} days overdue)`);
          
          const subject = `Urgent: Vehicle Pickup Overdue - ${log.title}`;
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Vehicle Pickup Overdue</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #721c24; margin-top: 0; text-align: center;">⚠️ Vehicle Pickup Overdue</h2>
              </div>
              
              <p>Dear <strong>${log.user.name}</strong>,</p>
              
              <p>This is an urgent reminder that your vehicle maintenance was completed by <strong>${companyName}</strong> on <strong>${new Date(log.completionDate).toLocaleDateString()}</strong>, but you haven't picked it up yet.</p>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">⚠️ Important Notice:</h3>
                <p style="margin: 10px 0;"><strong>Days Overdue:</strong> ${daysOverdue} days</p>
                <p style="margin: 10px 0;"><strong>Maintenance Log:</strong> ${log.title}</p>
                ${log.adminPrice ? `<p style="margin: 10px 0;"><strong>Total Cost:</strong> ₹${log.adminPrice}</p>` : ''}
              </div>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                <h3 style="color: #721c24; margin-top: 0;">Immediate Action Required:</h3>
                <ul style="margin: 10px 0;">
                  <li>Please pick up your vehicle as soon as possible</li>
                  <li>Storage charges may apply for extended delays</li>
                  <li>Contact ${companyName} immediately if you need assistance</li>
                  <li>Bring all required documents for pickup</li>
                </ul>
              </div>
              
              <p><strong>Contact Information:</strong><br>
              ${companyName}<br>
              Please call or visit to arrange pickup.</p>
              
              <p>Thank you for your prompt attention to this matter.</p>
              
              <p>Best regards,<br>
              <strong>${companyName}</strong><br>
              Vehicle Maintenance Team</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                This is an automated reminder. Please do not reply to this email.
              </p>
            </body>
            </html>
          `;
          
          const emailResult = await sendEmail(log.user.email, subject, html);
          
          if (emailResult.success) {
            // Mark that we've sent the overdue reminder
            log.overdueReminderSent = true;
            await log.save();
            console.log(`✅ Overdue pickup reminder sent successfully for log: ${log._id}`);
          } else {
            console.error(`❌ Failed to send overdue pickup reminder for log: ${log._id}: ${emailResult.error}`);
          }
        } else {
          console.warn(`⚠️ No user email found for overdue log: ${log._id}`);
        }
      } catch (logError) {
        console.error(`❌ Error processing overdue pickup reminder for log ${log._id}:`, logError.message);
      }
    }
    
    if (overdueLogs.length > 0) {
      console.log(`📧 Overdue pickup reminder check completed. Processed ${overdueLogs.length} logs.`);
    }
  } catch (error) {
    console.error('❌ Overdue pickup reminder cron job error:', error.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await verifyEmailService();
}); 