# 📧 Email Service Setup Guide

## SendGrid Integration for CN Terminal

This guide will help you set up email functionality for user invitations and notifications.

## 🚀 Quick Setup (Development Mode)

### Option 1: Development Mode (No API Key Needed)
1. The system is already configured to work in development mode
2. Emails will be logged to the console instead of being sent
3. No additional setup required for testing

### Option 2: SendGrid with Subdomain (Recommended)

#### Step 1: Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Verify your email address

#### Step 2: Get API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Give it a name like "CN Terminal App"
5. Set permissions:
   - **Mail Send**: Full Access
   - **Template Engine**: Read Access (optional)
6. Click **Create & View**
7. **Copy the API key** (you won't see it again!)

#### Step 3: Configure Your App
1. Create a `.env` file in your project root:
```env
# SendGrid Configuration
REACT_APP_SENDGRID_API_KEY=your_api_key_here
REACT_APP_FROM_EMAIL=noreply@sendgrid.net
REACT_APP_FROM_NAME=CN Terminal
REACT_APP_EMAIL_DEV_MODE=false
```

2. Restart your development server:
```bash
npm start
```

## 📧 Email Subdomain Options

### Option 1: SendGrid Default (Easiest)
```env
REACT_APP_FROM_EMAIL=noreply@sendgrid.net
```
- ✅ Works immediately
- ✅ No domain setup needed
- ✅ Perfect for development

### Option 2: Vercel Subdomain (Professional)
```env
REACT_APP_FROM_EMAIL=noreply@your-app.vercel.app
```
- ✅ More professional looking
- ✅ Easy to set up
- ✅ Works with Vercel deployments

### Option 3: Custom Domain (Production)
```env
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
```
- ✅ Most professional
- ⚠️ Requires domain verification
- ✅ Best for production

## 🧪 Testing Email Functionality

### Development Mode Testing
1. Set `REACT_APP_EMAIL_DEV_MODE=true` in your `.env`
2. Check browser console for email logs
3. Emails will show as: `📧 Email would be sent: {...}`

### Production Testing
1. Set `REACT_APP_EMAIL_DEV_MODE=false`
2. Add your SendGrid API key
3. Send test invitations from the admin panel
4. Check SendGrid dashboard for delivery status

## 📋 Email Types Implemented

### 1. User Invitations
- Sent when admin invites new users
- Contains invitation link and role information
- Expires in 7 days

### 2. Welcome Emails
- Sent when user accepts invitation
- Contains login information
- Welcomes user to the system

### 3. Password Reset (Ready for Implementation)
- Template is ready
- Can be integrated with login system

## 🔧 Troubleshooting

### Common Issues

#### "Email sending failed"
- Check your API key is correct
- Verify SendGrid account is active
- Check console for detailed error messages

#### "Invalid API key"
- Regenerate API key in SendGrid dashboard
- Update your `.env` file
- Restart development server

#### Emails not being sent
- Check `REACT_APP_EMAIL_DEV_MODE` setting
- Verify SendGrid account limits
- Check spam folder

### SendGrid Dashboard
- Monitor email delivery in **Activity** tab
- Check **Suppressions** for blocked emails
- View **Statistics** for delivery rates

## 📊 SendGrid Free Tier Limits

- **100 emails/day** for free accounts
- **40,000 emails** for first 30 days
- Perfect for development and small teams

## 🚀 Production Considerations

### For Production Deployment:
1. Use a custom domain for sender email
2. Set up domain authentication in SendGrid
3. Configure SPF, DKIM, and DMARC records
4. Monitor delivery rates and reputation
5. Consider upgrading to paid plan for higher limits

### Security Best Practices:
1. Never commit API keys to version control
2. Use environment variables for all sensitive data
3. Rotate API keys regularly
4. Monitor for unusual email activity

## 📞 Support

If you encounter issues:
1. Check SendGrid documentation
2. Review console error messages
3. Test with development mode first
4. Contact SendGrid support for delivery issues

---

**Happy Emailing! 📧✨**
