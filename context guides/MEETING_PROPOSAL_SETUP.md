# Meeting Proposal Feature - Setup Guide

## Overview

The meeting proposal feature allows users to propose meeting times for group activities via email. Recipients can respond with:
- ✅ **Yes** - Accept the proposed time
- ❌ **No** - Decline the proposed time
- 🔄 **Propose Alternate Time** - Suggest a different date/time

## Email Configuration

### 1. Set Up Environment Variables

Add the following to `server/.env`:

```env
# SMTP Configuration (Example using Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL="Blue Moon Scheduler" <noreply@bluemoon.com>
BASE_URL=http://localhost:3001
```

### 2. Gmail App Password Setup (If using Gmail)

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → 2-Step Verification → App passwords
4. Generate a new app password for "Mail"
5. Use this password in `SMTP_PASS` environment variable

### 3. Alternative SMTP Providers

You can use any SMTP provider. Common examples:

**Outlook/Office 365:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
```

## How to Use

### For Meeting Organizers:

1. Navigate to **Groups** tab
2. Click on a group to open **Group Details**
3. Click the **Schedule Meeting** button dropdown
4. Select **"Propose Time via Email"**
5. Fill out the proposal form:
   - Meeting title (e.g., "DnD Session Planning")
   - Description (optional)
   - Proposed date and time
   - Add member email addresses
6. Click **"Send Proposal"**

### For Recipients:

Recipients will receive an email with three action buttons:

- **✅ Yes, I can attend** - Directly records acceptance
- **❌ No, I can't attend** - Records decline
- **🔄 Propose Alternate Time** - Opens a form to suggest different date/time

Responses are tracked in real-time and the organizer can see who has responded.

## API Endpoints

### Create Proposal
```
POST /api/meetings/propose
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupId": "1",
  "groupName": "DnD Group",
  "title": "Weekly Session",
  "description": "Optional description",
  "proposedDate": "2025-10-15",
  "proposedTime": "13:00",
  "memberEmails": ["user1@example.com", "user2@example.com"]
}
```

### Yes/No Response (Public - uses token)
```
GET /api/meetings/respond?token={token}&response=yes
GET /api/meetings/respond?token={token}&response=no
```

### Propose Alternate Time
```
POST /api/meetings/propose-alternate
Content-Type: application/json

{
  "token": "response-token",
  "alternateDate": "2025-10-16",
  "alternateTime": "14:00",
  "message": "Optional message"
}
```

### Get Proposals for Group
```
GET /api/meetings/proposals/{groupId}
Authorization: Bearer {token}
```

### Get Responses for Proposal
```
GET /api/meetings/proposals/{proposalId}/responses
Authorization: Bearer {token}
```

## Testing Locally

### 1. Start the Server
```bash
cd server
npm run dev
```

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Create a Test Proposal

1. Log in with test user: `alex.chen@test.com`
2. Go to Groups → Select a group → View Details
3. Click "Schedule Meeting" → "Propose Time via Email"
4. Add your own email address as a recipient
5. Submit the proposal

### 4. Check Your Email

You should receive an email with the proposal and action buttons.

## Production Deployment

Before deploying to production:

1. **Update environment variables** with production SMTP credentials
2. **Set BASE_URL** to your production domain
3. **Use a professional FROM_EMAIL** address
4. **Consider using a transactional email service** (SendGrid, Mailgun, AWS SES) for better deliverability
5. **Implement rate limiting** for email sending to prevent abuse
6. **Add email templates** with your branding
7. **Set up SPF, DKIM, and DMARC** records for your domain

## Troubleshooting

### Emails Not Sending

1. Check server logs for SMTP errors
2. Verify SMTP credentials in `.env`
3. Ensure firewall allows outbound SMTP connections (port 587 or 465)
4. Check spam folder
5. Try with a different SMTP provider

### "Less Secure App" Error (Gmail)

Use an App Password instead of your regular Gmail password.

### Emails Going to Spam

1. Set up SPF/DKIM/DMARC records
2. Use a transactional email service
3. Ensure FROM_EMAIL domain matches your sending domain
4. Add an unsubscribe link (for production)

## Future Enhancements

Possible improvements for this feature:

- **Response dashboard** showing real-time response statistics
- **Email reminders** for non-respondents
- **Calendar integration** to automatically schedule when all accept
- **Multiple time slot proposals** (let recipients vote on preferred times)
- **Email templates** with custom branding
- **Push notifications** for responses
- **Export responses** to CSV

## Security Notes

- Response tokens are cryptographically secure (32 bytes random)
- Tokens are one-time use and expire after response
- Only proposal creator can view responses
- Email endpoints use rate limiting to prevent abuse
- All user input is sanitized before sending emails

## Support

For issues or questions about this feature, check:
- Server logs in console
- Browser console for frontend errors
- SMTP provider documentation
- Email delivery logs from your SMTP provider
