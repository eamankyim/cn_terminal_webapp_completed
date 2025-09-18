// SendGrid Configuration
// Copy these values to your .env file in the project root

export const sendgridConfig = {
  // Your SendGrid API Key
  apiKey: 'SG.4gKrgfoOQKmNmj9_qNAYqA.Nh81-rdEDPB3LA3mHX7EYRE-8mPBAA2881o8Ljm6QYg',
  
  // Sender email configuration
  fromEmail: 'noreply@sendgrid.net',
  fromName: 'CN Terminal',
  
  // Set to false to send real emails
  devMode: false
};

// Instructions:
// 1. Create a .env file in your project root (same level as package.json)
// 2. Add these lines to the .env file:
/*
REACT_APP_SENDGRID_API_KEY=SG.4gKrgfoOQKmNmj9_qNAYqA.Nh81-rdEDPB3LA3mHX7EYRE-8mPBAA2881o8Ljm6QYg
REACT_APP_FROM_EMAIL=noreply@sendgrid.net
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false
*/
// 3. Restart your development server (npm start)

