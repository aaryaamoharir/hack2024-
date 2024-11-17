const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const emailjs = require('@emailjs/nodejs');

// Initialize emailjs with your user ID
emailjs.init({
  publicKey: "lhfP3lB03VJ6CTZUJ",
  privateKey: "TMWMhgzB-roCv1_hj2PRK"
});

// Add this at the top level, after the requires
const emailQueue = new Set();

router.post('/schedule-email', async (req, res) => {
  try {
    const { email, message, attachment } = req.body;
    
    // Create a unique identifier for this email
    const emailId = `${email}_${Date.now()}`;
    emailQueue.add(emailId);
    console.log('Added to queue:', emailId);
    console.log('Current queue size:', emailQueue.size);
    
    // Schedule email for 9 AM next day
    cron.schedule('* * * * *', async () => {
      try {
        console.log('Processing email:', emailId);
        const templateParams = {
          to_email: email,
          message: message,
          attachment_data: attachment.data,
          attachment_name: attachment.name
        };

        const result = await emailjs.send(
          'service_270q8fl',
          'template_kpkkahu',
          templateParams,
          'lhfP3lB03VJ6CTZUJ'
        );

        // Remove from queue after successful send
        emailQueue.delete(emailId);
        console.log('Email sent and removed from queue:', emailId);
        console.log('Remaining queue size:', emailQueue.size);
      } catch (error) {
        console.error('Error sending scheduled email:', error);
        // Optionally remove from queue even if failed
        emailQueue.delete(emailId);
      }
    });
    
    res.json({ 
      message: 'Email scheduled successfully for 9 AM tomorrow',
      queueId: emailId 
    });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ error: 'Failed to schedule email' });
  }
});

module.exports = router;
