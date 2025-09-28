# WhatsApp Floating Button & Modal

A floating WhatsApp button that opens a modal within the app for easy customer contact.

## Features

✅ **Floating Button**: Always visible in bottom-right corner  
✅ **Modal Interface**: Opens within the app (no external redirect)  
✅ **Quick Contact**: Direct WhatsApp, phone, and email buttons  
✅ **Message Form**: Custom message with name and phone number  
✅ **Responsive Design**: Works on desktop and mobile  
✅ **Configurable**: Easy to update contact information  
✅ **Animated**: Pulse animation to attract attention  

## Components

### 1. WhatsAppButton.jsx
- Floating button component
- Positioned fixed in bottom-right
- Opens the modal when clicked
- Includes pulse animation

### 2. WhatsAppModal.jsx
- Modal dialog with contact options
- Quick contact buttons (WhatsApp, Phone, Email)
- Message form for custom messages
- Business information display

### 3. contactConfig.js
- Centralized contact configuration
- Easy to update phone numbers, emails, etc.
- Business hours and information

## Usage

The WhatsApp button is automatically added to all pages via `MainLayout.jsx`. No additional setup required.

## Customization

### Update Contact Information
Edit `frontend/src/config/contactConfig.js`:

```javascript
export const CONTACT_CONFIG = {
  whatsapp: {
    primary: {
      number: '244123456', // Your WhatsApp number
      display: '+233 24 412 3456',
      name: 'Your Business Name'
    }
  },
  phone: {
    primary: '+233244123456',
    display: '+233 24 412 3456'
  },
  email: {
    primary: 'info@yourbusiness.com'
  },
  business: {
    name: 'Your Business Name',
    hours: 'Mon-Fri: 8AM-6PM'
  }
};
```

### Styling
Edit `frontend/src/components/common/WhatsAppButton.css` to customize:
- Button colors
- Animation effects
- Modal appearance
- Mobile responsiveness

### Hide/Show Button
To hide the button on specific pages, you can:
1. Add a prop to `WhatsAppButton` component
2. Use conditional rendering in `MainLayout.jsx`
3. Add page-specific logic

## How It Works

1. **User clicks floating button** → Modal opens
2. **Quick contact** → Direct WhatsApp/phone/email
3. **Custom message** → Form with name, phone, message
4. **WhatsApp integration** → Opens WhatsApp Web/App with pre-filled message

## Technical Details

- Uses `wa.me` URLs for WhatsApp integration
- Supports both WhatsApp Web and mobile app
- Phone number formatting for Ghana (+233)
- Form validation for required fields
- Responsive design with mobile optimization

## Browser Support

- ✅ Chrome/Edge (WhatsApp Web)
- ✅ Firefox (WhatsApp Web)
- ✅ Safari (WhatsApp Web)
- ✅ Mobile browsers (WhatsApp App)




