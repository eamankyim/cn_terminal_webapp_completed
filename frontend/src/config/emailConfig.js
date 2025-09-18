// Email configuration
export const emailConfig = {
  // SendGrid API Key - Get this from SendGrid dashboard
  sendGridApiKey: process.env.REACT_APP_SENDGRID_API_KEY,
  
  // Sender email configuration
  fromEmail: process.env.REACT_APP_FROM_EMAIL || 'noreply@sendgrid.net',
  fromName: process.env.REACT_APP_FROM_NAME || 'CN Terminal',
  
  // Development mode - set to true to log emails instead of sending
  devMode: process.env.REACT_APP_EMAIL_DEV_MODE === 'true' || !process.env.REACT_APP_SENDGRID_API_KEY,
  
  // Email templates configuration
  templates: {
    invitation: {
      subject: "You're invited to join CN Terminal",
      expiresInDays: 7
    },
    passwordReset: {
      subject: "Reset your CN Terminal password",
      expiresInHours: 24
    },
    welcome: {
      subject: "Welcome to CN Terminal!"
    }
  }
};

// Instructions for setup:
/*
1. Create a SendGrid account at https://sendgrid.com
2. Get your API key from SendGrid dashboard
3. Create a .env file in your project root with:
   REACT_APP_SENDGRID_API_KEY=your_api_key_here
   REACT_APP_FROM_EMAIL=noreply@sendgrid.net
   REACT_APP_FROM_NAME=CN Terminal
   REACT_APP_EMAIL_DEV_MODE=false

4. For development without API key, set:
   REACT_APP_EMAIL_DEV_MODE=true

5. Install SendGrid package:
   npm install @sendgrid/mail
*/
