// Email service using SendGrid
import sgMail from '@sendgrid/mail';
import { emailConfig } from '../config/emailConfig';

class EmailService {
  constructor() {
    // Initialize SendGrid with API key
    this.apiKey = emailConfig.sendGridApiKey;
    this.fromEmail = emailConfig.fromEmail;
    this.fromName = emailConfig.fromName;
    this.devMode = emailConfig.devMode;
    
    if (this.apiKey && !this.devMode) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  // Send user invitation email
  async sendInvitationEmail(inviteData) {
    try {
      const { email, role, invitedBy, inviteLink } = inviteData;
      
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `You're invited to join CN Terminal`,
        html: this.getInvitationEmailTemplate(inviteData),
        text: this.getInvitationEmailText(inviteData)
      };

      if (this.devMode) {
        // Development mode - log email instead of sending
        console.log('📧 Email would be sent:', msg);
        return { success: true, messageId: 'dev-mode-' + Date.now() };
      }

      const response = await sgMail.send(msg);
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetLink) {
    try {
      const msg = {
        to: userEmail,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Reset your CN Terminal password',
        html: this.getPasswordResetEmailTemplate(resetLink),
        text: this.getPasswordResetEmailText(resetLink)
      };

      if (this.devMode) {
        console.log('📧 Password reset email would be sent:', msg);
        return { success: true, messageId: 'dev-mode-' + Date.now() };
      }

      const response = await sgMail.send(msg);
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Password reset email failed:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email
  async sendWelcomeEmail(userData) {
    try {
      const { email, name, role } = userData;
      
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Welcome to CN Terminal!',
        html: this.getWelcomeEmailTemplate(userData),
        text: this.getWelcomeEmailText(userData)
      };

      if (this.devMode) {
        console.log('📧 Welcome email would be sent:', msg);
        return { success: true, messageId: 'dev-mode-' + Date.now() };
      }

      const response = await sgMail.send(msg);
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Welcome email failed:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // HTML email template for invitations
  getInvitationEmailTemplate(inviteData) {
    const { email, role, invitedBy, inviteLink, expiresAt } = inviteData;
    const roleLabel = this.getRoleLabel(role);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to CN Terminal</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #1890ff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CN Terminal</h1>
            <p>Clearing & Forwarding Management System</p>
          </div>
          
          <div class="content">
            <h2>You're Invited!</h2>
            <p>Hello,</p>
            <p>You have been invited by <strong>${invitedBy}</strong> to join CN Terminal as a <strong>${roleLabel}</strong>.</p>
            
            <p>CN Terminal is our comprehensive clearing and forwarding management system that will help you manage shipments, clients, and operations efficiently.</p>
            
            <div style="text-align: center;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>
            
            <p><strong>Important:</strong> This invitation will expire on ${expiresAt}. Please accept it before then.</p>
            
            <p>If you have any questions, please contact your administrator.</p>
            
            <p>Best regards,<br>CN Terminal Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}. If you didn't expect this invitation, please ignore this email.</p>
            <p>&copy; 2024 CN Terminal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text version of invitation email
  getInvitationEmailText(inviteData) {
    const { email, role, invitedBy, inviteLink, expiresAt } = inviteData;
    const roleLabel = this.getRoleLabel(role);
    
    return `
You're Invited to CN Terminal!

Hello,

You have been invited by ${invitedBy} to join CN Terminal as a ${roleLabel}.

CN Terminal is our comprehensive clearing and forwarding management system that will help you manage shipments, clients, and operations efficiently.

To accept your invitation, click the link below:
${inviteLink}

Important: This invitation will expire on ${expiresAt}. Please accept it before then.

If you have any questions, please contact your administrator.

Best regards,
CN Terminal Team

---
This email was sent to ${email}. If you didn't expect this invitation, please ignore this email.
© 2024 CN Terminal. All rights reserved.
    `;
  }

  // HTML template for password reset
  getPasswordResetEmailTemplate(resetLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #1890ff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CN Terminal</h1>
            <p>Password Reset Request</p>
          </div>
          
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your CN Terminal account.</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>Best regards,<br>CN Terminal Team</p>
          </div>
          
          <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste this link into your browser:</p>
            <p>${resetLink}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text version of password reset email
  getPasswordResetEmailText(resetLink) {
    return `
Reset Your Password - CN Terminal

Hello,

We received a request to reset your password for your CN Terminal account.

To reset your password, click the link below:
${resetLink}

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

This link will expire in 24 hours for security reasons.

Best regards,
CN Terminal Team

---
If you're having trouble clicking the link, copy and paste it into your browser:
${resetLink}
    `;
  }

  // HTML template for welcome email
  getWelcomeEmailTemplate(userData) {
    const { name, role } = userData;
    const roleLabel = this.getRoleLabel(role);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CN Terminal</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #52c41a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background: #1890ff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CN Terminal!</h1>
            <p>Your account is ready</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Welcome to CN Terminal! Your account has been successfully created with the role of <strong>${roleLabel}</strong>.</p>
            
            <p>You can now access the system and start managing your clearing and forwarding operations.</p>
            
            <div style="text-align: center;">
              <a href="${window.location.origin}/login" class="button">Login to CN Terminal</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>CN Terminal Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 CN Terminal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text version of welcome email
  getWelcomeEmailText(userData) {
    const { name, role } = userData;
    const roleLabel = this.getRoleLabel(role);
    
    return `
Welcome to CN Terminal!

Hello ${name}!

Welcome to CN Terminal! Your account has been successfully created with the role of ${roleLabel}.

You can now access the system and start managing your clearing and forwarding operations.

Login to CN Terminal: ${window.location.origin}/login

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
CN Terminal Team

---
© 2024 CN Terminal. All rights reserved.
    `;
  }

  // Helper function to get role labels
  getRoleLabel(role) {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'staff1': return 'Staff Level 1';
      case 'staff2': return 'Staff Level 2';
      case 'finance': return 'Finance Officer';
      case 'driver': return 'Driver';
      default: return role;
    }
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
export default emailService;
