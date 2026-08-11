// SMS service using Clickatell API
const fetch = require('node-fetch');

class SmsService {
  constructor() {
    this.apiKey = process.env.CLICKATELL_API_KEY;
    this.apiUrl = process.env.CLICKATELL_API_URL || 'https://platform.clickatell.com/messages/http/send';
    this.senderId = process.env.CLICKATELL_SENDER_ID || 'CN Terminal';
    this.devMode = process.env.SMS_DEV_MODE === 'true';
    
    if (!this.apiKey && !this.devMode) {
      console.warn('⚠️ Clickatell API key not configured. SMS will not be sent.');
    }
  }

  /**
   * Format phone number for Clickatell (remove spaces, add country code if needed)
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number doesn't start with country code, assume Ghana (+233)
    if (!cleaned.startsWith('233') && cleaned.length === 9) {
      cleaned = '233' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // Remove leading 0 and add country code
      cleaned = '233' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Send SMS message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Response with success status and messageId
   */
  async sendSms(phoneNumber, message) {
    try {
      if (!phoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!formattedPhone) {
        throw new Error('Invalid phone number format');
      }

      // Truncate message if too long (SMS limit is typically 160 characters for single message)
      const maxLength = 160;
      const truncatedMessage = message.length > maxLength 
        ? message.substring(0, maxLength - 3) + '...' 
        : message;

      if (this.devMode) {
        // Development mode - log SMS instead of sending
        console.log('📱 [SMS DEV MODE] SMS would be sent:');
        console.log(`   To: ${formattedPhone}`);
        console.log(`   Message: ${truncatedMessage}`);
        return { 
          success: true, 
          messageId: 'dev-mode-' + Date.now(),
          phoneNumber: formattedPhone,
          message: truncatedMessage
        };
      }

      if (!this.apiKey) {
        throw new Error('Clickatell API key not configured');
      }

      // Clickatell HTTP API format
      const url = `${this.apiUrl}?apiKey=${this.apiKey}&to=${formattedPhone}&content=${encodeURIComponent(truncatedMessage)}`;
      
      const response = await fetch(url, {
        method: 'GET', // Clickatell HTTP API uses GET
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('❌ Clickatell API error:', response.status, responseText);
        throw new Error(`Clickatell API error: ${response.status} - ${responseText}`);
      }

      // Clickatell returns message ID in format: ID: messageId
      const messageId = responseText.includes('ID:') 
        ? responseText.split('ID:')[1].trim() 
        : 'sent-' + Date.now();

      console.log(`✅ SMS sent successfully to ${formattedPhone}. Message ID: ${messageId}`);
      
      return { 
        success: true, 
        messageId,
        phoneNumber: formattedPhone,
        message: truncatedMessage
      };
    } catch (error) {
      console.error('❌ Failed to send SMS:', error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send job status update SMS to customer
   * @param {Object} job - Job object with customer info
   * @param {string} newStatus - New job status
   * @param {string} oldStatus - Old job status (optional)
   * @returns {Promise<Object>} - SMS send result
   */
  async sendJobStatusUpdate(job, newStatus, oldStatus = null) {
    try {
      if (!job || !job.customer) {
        throw new Error('Job and customer information required');
      }

      const customer = job.customer;
      const phoneNumber = customer.phone;
      
      if (!phoneNumber) {
        console.log(`⚠️ Customer ${customer.name} has no phone number. Skipping SMS.`);
        return { success: false, reason: 'No phone number' };
      }

      const statusMessages = {
        'NEW': 'Your job has been created',
        'PREINVOICED': 'Your job is ready for invoicing',
        'INVOICED': 'Your job has been invoiced',
        'VETTED': 'Your job has been vetted and reviewed',
        'ENTRY_COMPLETED': 'Customs entry for your job has been completed',
        'DUTY_PAID': 'Duty payment for your job has been completed',
        'READY_FOR_RELEASE': 'Your job is ready for release',
        'RELEASED': 'Your job has been released from customs',
        'CLEARED': 'Your job has been cleared',
        'DELIVERED': 'Your job has been successfully delivered'
      };

      const statusMessage = statusMessages[newStatus] || `Your job status has been updated to ${newStatus}`;
      const message = `CN Terminal: Job ${job.trackingId} - ${statusMessage}. Thank you for choosing CN Terminal.`;

      return await this.sendSms(phoneNumber, message);
    } catch (error) {
      console.error('❌ Failed to send job status SMS:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send delivery notification SMS
   * @param {Object} job - Job object with customer info
   * @returns {Promise<Object>} - SMS send result
   */
  async sendDeliveryNotification(job) {
    try {
      if (!job || !job.customer) {
        throw new Error('Job and customer information required');
      }

      const customer = job.customer;
      const phoneNumber = customer.phone;
      
      if (!phoneNumber) {
        console.log(`⚠️ Customer ${customer.name} has no phone number. Skipping SMS.`);
        return { success: false, reason: 'No phone number' };
      }

      const message = `CN Terminal: Your shipment ${job.trackingId} has been delivered successfully. Thank you for choosing CN Terminal!`;

      return await this.sendSms(phoneNumber, message);
    } catch (error) {
      console.error('❌ Failed to send delivery SMS:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment reminder SMS
   * @param {Object} invoice - Invoice object with customer info
   * @returns {Promise<Object>} - SMS send result
   */
  async sendPaymentReminder(invoice) {
    try {
      if (!invoice || !invoice.customer) {
        throw new Error('Invoice and customer information required');
      }

      const customer = invoice.customer;
      const phoneNumber = customer.phone;
      
      if (!phoneNumber) {
        console.log(`⚠️ Customer ${customer.name} has no phone number. Skipping SMS.`);
        return { success: false, reason: 'No phone number' };
      }

      const message = `CN Terminal: Reminder - Invoice ${invoice.invoiceNumber} for GHS ${invoice.amount.toFixed(2)} is pending payment. Please make payment to avoid delays.`;

      return await this.sendSms(phoneNumber, message);
    } catch (error) {
      console.error('❌ Failed to send payment reminder SMS:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send custom SMS message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Custom message
   * @returns {Promise<Object>} - SMS send result
   */
  async sendCustomMessage(phoneNumber, message) {
    return await this.sendSms(phoneNumber, message);
  }
}

module.exports = new SmsService();

