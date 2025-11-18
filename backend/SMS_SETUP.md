# SMS Service Setup (Clickatell)

This document explains how to set up and use the SMS service with Clickatell.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Clickatell SMS Configuration
CLICKATELL_API_KEY=your_clickatell_api_key_here
CLICKATELL_API_URL=https://platform.clickatell.com/messages/http/send
CLICKATELL_SENDER_ID=CN Terminal

# SMS Development Mode (set to 'true' to log SMS instead of sending)
SMS_DEV_MODE=false
```

## Getting Your Clickatell API Key

1. Sign up for a Clickatell account at https://www.clickatell.com/
2. Navigate to your dashboard
3. Go to **API** section
4. Copy your **API Key**
5. Add it to your `.env` file as `CLICKATELL_API_KEY`

## Features

The SMS service automatically sends SMS notifications to customers for:

- **Job Status Updates**: When job status changes to:
  - `ENTRY_COMPLETED`
  - `DUTY_PAID`
  - `RELEASED`
  - `CLEARED`
  - `DELIVERED`

## Enabling SMS Notifications

SMS notifications are controlled by the `SMS_NOTIFICATIONS` configuration in the database:

1. Go to **Settings** → **System Preferences**
2. Enable **SMS Notifications**
3. SMS will be sent automatically when enabled

## Phone Number Format

The service automatically formats phone numbers:
- Removes spaces and special characters
- Adds Ghana country code (+233) if missing
- Handles numbers starting with 0

**Examples:**
- `020 123 4567` → `233201234567`
- `0249876543` → `233249876543`
- `233201234567` → `233201234567` (already formatted)

## Development Mode

Set `SMS_DEV_MODE=true` in your `.env` file to:
- Log SMS messages to console instead of sending
- Test SMS functionality without using credits
- See formatted phone numbers and message content

## Usage Examples

### Send Job Status Update
```javascript
const smsService = require('./services/smsService');

await smsService.sendJobStatusUpdate(job, 'DELIVERED', 'CLEARED');
```

### Send Delivery Notification
```javascript
await smsService.sendDeliveryNotification(job);
```

### Send Payment Reminder
```javascript
await smsService.sendPaymentReminder(invoice);
```

### Send Custom Message
```javascript
await smsService.sendCustomMessage('233201234567', 'Your custom message here');
```

## Error Handling

The SMS service:
- Logs errors but doesn't fail the main operation
- Returns success/failure status
- Handles missing phone numbers gracefully
- Truncates messages longer than 160 characters

## Message Templates

### Job Status Update
```
CN Terminal: Job {trackingId} - {status message}. Thank you for choosing CN Terminal.
```

### Delivery Notification
```
CN Terminal: Your shipment {trackingId} has been delivered successfully. Thank you for choosing CN Terminal!
```

### Payment Reminder
```
CN Terminal: Reminder - Invoice {invoiceNumber} for GHS {amount} is pending payment. Please make payment to avoid delays.
```

## Testing

1. Set `SMS_DEV_MODE=true` in `.env`
2. Update a job status to `DELIVERED`
3. Check console logs for SMS details
4. Verify phone number formatting
5. Set `SMS_DEV_MODE=false` to send real SMS

## Troubleshooting

### SMS Not Sending
- Check `CLICKATELL_API_KEY` is set correctly
- Verify `SMS_NOTIFICATIONS` is enabled in settings
- Ensure customer has a valid phone number
- Check Clickatell account has credits
- Review console logs for error messages

### Invalid Phone Number
- Ensure phone number is in the customer record
- Check phone number format (should be 9-10 digits for Ghana)
- Verify country code is correct

### API Errors
- Verify API key is valid
- Check Clickatell account status
- Review Clickatell API documentation for changes
- Check network connectivity

