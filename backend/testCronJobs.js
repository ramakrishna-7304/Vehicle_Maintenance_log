require('dotenv').config();
const MaintenanceLog = require('./models/MaintenanceLog');
const User = require('./models/User');
const { sendCompletionReminderEmail } = require('./utils/emailService');
const connectDB = require('./config/db');

const testCompletionReminders = async () => {
  try {
    console.log('🧪 Testing Completion Reminder Cron Job...\n');
    
    // Connect to database
    await connectDB();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('📅 Date Range:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    });
    
    // Find logs that are accepted and have completion date today
    const completionLogs = await MaintenanceLog.find({
      status: 'accepted',
      completionDate: { 
        $gte: today, 
        $lt: tomorrow 
      },
      completionReminderSent: { $ne: true }
    }).populate('user', 'name email')
      .populate('assignedAdmin', 'name companyName');
    
    console.log(`📧 Found ${completionLogs.length} logs with completion date today`);
    
    if (completionLogs.length === 0) {
      console.log('ℹ️ No logs found for completion reminders. You may need to:');
      console.log('1. Create a maintenance log with status "accepted"');
      console.log('2. Set completionDate to today');
      console.log('3. Ensure completionReminderSent is false');
      return;
    }
    
    for (const log of completionLogs) {
      console.log(`\n📋 Processing log: ${log.title}`);
      console.log(`👤 User: ${log.user?.name} (${log.user?.email})`);
      console.log(`🏢 Company: ${log.assignedAdmin?.companyName}`);
      console.log(`📅 Completion Date: ${log.completionDate}`);
      
      if (log.user && log.user.email) {
        const companyName = log.assignedAdmin?.companyName || 'Service Center';
        
        console.log(`📧 Sending completion reminder email...`);
        
        const emailResult = await sendCompletionReminderEmail(
          log.user.email,
          log.user.name,
          log.title,
          companyName,
          log.completionDate,
          log.adminPrice
        );
        
        if (emailResult.success) {
          // Mark that we've sent the reminder
          log.completionReminderSent = true;
          await log.save();
          console.log(`✅ Completion reminder sent successfully!`);
        } else {
          console.error(`❌ Failed to send completion reminder: ${emailResult.error}`);
        }
      } else {
        console.warn(`⚠️ No user email found for log: ${log._id}`);
      }
    }
    
    console.log('\n🎉 Completion reminder test completed!');
    
  } catch (error) {
    console.error('❌ Error testing completion reminders:', error);
  }
};

const testOverdueReminders = async () => {
  try {
    console.log('🧪 Testing Overdue Pickup Reminder Cron Job...\n');
    
    // Connect to database
    await connectDB();
    
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    console.log('📅 Date Range:', {
      now: now.toISOString(),
      threeDaysAgo: threeDaysAgo.toISOString()
    });
    
    // Find logs that are accepted and past completion date by 3+ days
    const overdueLogs = await MaintenanceLog.find({
      status: 'accepted',
      completionDate: { $lt: threeDaysAgo },
      overdueReminderSent: { $ne: true }
    }).populate('user', 'name email')
      .populate('assignedAdmin', 'name companyName');
    
    console.log(`📧 Found ${overdueLogs.length} overdue pickup logs`);
    
    if (overdueLogs.length === 0) {
      console.log('ℹ️ No overdue logs found. You may need to:');
      console.log('1. Create a maintenance log with status "accepted"');
      console.log('2. Set completionDate to more than 3 days ago');
      console.log('3. Ensure overdueReminderSent is false');
      return;
    }
    
    for (const log of overdueLogs) {
      console.log(`\n📋 Processing overdue log: ${log.title}`);
      console.log(`👤 User: ${log.user?.name} (${log.user?.email})`);
      console.log(`🏢 Company: ${log.assignedAdmin?.companyName}`);
      console.log(`📅 Completion Date: ${log.completionDate}`);
      
      const daysOverdue = Math.floor((now - log.completionDate) / (1000 * 60 * 60 * 24));
      console.log(`⏰ Days Overdue: ${daysOverdue}`);
      
      if (log.user && log.user.email) {
        const companyName = log.assignedAdmin?.companyName || 'Service Center';
        
        console.log(`📧 Sending overdue pickup reminder email...`);
        
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
        
        const { sendEmail } = require('./utils/emailService');
        const emailResult = await sendEmail(log.user.email, subject, html);
        
        if (emailResult.success) {
          // Mark that we've sent the overdue reminder
          log.overdueReminderSent = true;
          await log.save();
          console.log(`✅ Overdue pickup reminder sent successfully!`);
        } else {
          console.error(`❌ Failed to send overdue pickup reminder: ${emailResult.error}`);
        }
      } else {
        console.warn(`⚠️ No user email found for log: ${log._id}`);
      }
    }
    
    console.log('\n🎉 Overdue pickup reminder test completed!');
    
  } catch (error) {
    console.error('❌ Error testing overdue reminders:', error);
  }
};

// Run tests based on command line argument
const testType = process.argv[2];

if (testType === 'completion') {
  testCompletionReminders();
} else if (testType === 'overdue') {
  testOverdueReminders();
} else {
  console.log('Usage: node testCronJobs.js [completion|overdue]');
  console.log('  completion - Test completion reminder emails');
  console.log('  overdue    - Test overdue pickup reminder emails');
} 