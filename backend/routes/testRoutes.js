const express = require('express');
const { sendTestEmail, validateEmailConfig } = require('../utils/emailService');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Test email functionality
// @route   POST /api/test/email
// @access  Private
router.post('/email', protect, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }

    // Validate email configuration
    if (!validateEmailConfig()) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email configuration is missing. Please check your .env file.' 
      });
    }

    console.log('🧪 Sending test email to:', email);
    
    const result = await sendTestEmail(email);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully!',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('❌ Test email route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router; 