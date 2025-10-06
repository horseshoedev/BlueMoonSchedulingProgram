# Calendar OAuth Integration Setup Guide

This guide explains how to set up Google Calendar and iCal/CalDAV integration for Blue Moon Scheduler.

## Overview

The application supports two types of calendar integrations:
1. **Google Calendar** - OAuth 2.0 flow with automatic token management
2. **iCal/CalDAV** - Basic authentication with various CalDAV providers

## Google Calendar Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (or "Internal" if using Google Workspace)
3. Fill in required fields:
   - App name: "Blue Moon Scheduler"
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (if in testing mode)
6. Save and continue

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3001/api/calendar/google/callback` (development)
   - `https://yourdomain.com/api/calendar/google/callback` (production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### Step 4: Configure Environment Variables

Update `.env` in the root directory:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback
```

Update `server/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback
```

### Step 5: Test the Integration

1. Start both frontend and backend:
   ```bash
   npm run dev:all
   ```

2. Navigate to Settings in the app
3. Click "Connect Google Calendar"
4. Complete the OAuth flow in the popup window
5. Your calendar should now be connected!

## iCal/CalDAV Setup

### Supported Providers

- **Google Calendar** (via CalDAV)
- **Apple iCloud Calendar**
- **Nextcloud/ownCloud**
- Any CalDAV-compatible service

### Connection Steps

1. Navigate to Settings in the app
2. Click "Connect iCal/CalDAV"
3. Enter your CalDAV server details:

#### Google Calendar CalDAV
```
Server URL: https://apidata.googleusercontent.com/caldav/v2/your-email@gmail.com/events/
Username: your-email@gmail.com
Password: App-specific password (create at https://myaccount.google.com/apppasswords)
```

#### Apple iCloud Calendar
```
Server URL: https://caldav.icloud.com/
Username: your-apple-id@icloud.com
Password: App-specific password (create at https://appleid.apple.com)
```

#### Nextcloud
```
Server URL: https://nextcloud.example.com/remote.php/dav/calendars/username/calendar-name/
Username: your-nextcloud-username
Password: your-nextcloud-password or app password
```

4. Click "Connect Calendar"
5. The app will test the connection before saving

## Features

### Google Calendar Integration
- ✅ Read calendar events
- ✅ Create new events
- ✅ Automatic token refresh
- ✅ Sync status tracking
- ✅ Multiple calendar support

### iCal/CalDAV Integration
- ✅ Read calendar events via CalDAV
- ✅ Create new events
- ✅ Basic authentication
- ✅ Connection testing
- ⚠️ Limited event parsing (simplified implementation)

## Security Notes

### Production Deployment

**Important:** Before deploying to production:

1. **Update OAuth Redirect URI:**
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback
   ```

2. **Use HTTPS:**
   - Google OAuth requires HTTPS in production
   - Configure your reverse proxy (nginx, Apache) for SSL

3. **Secure Token Storage:**
   - Current implementation stores tokens in memory
   - For production, use encrypted database storage
   - Consider using services like AWS Secrets Manager or HashiCorp Vault

4. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use secure environment variable management
   - Rotate credentials regularly

5. **CalDAV Credentials:**
   - Stored as base64-encoded basic auth (NOT encrypted)
   - For production: encrypt credentials before storage
   - Use app-specific passwords when available

## API Endpoints

### Google Calendar

- `GET /api/calendar/google/auth-url` - Get OAuth authorization URL
- `GET /api/calendar/google/callback` - Handle OAuth callback
- `GET /api/calendar/google/integration` - Get integration status
- `POST /api/calendar/google/disconnect` - Disconnect calendar
- `GET /api/calendar/google/events` - Fetch calendar events
- `POST /api/calendar/google/sync` - Sync event to Google Calendar

### iCal/CalDAV

- `POST /api/calendar/ical/connect` - Connect to CalDAV server
- `GET /api/calendar/ical/integration` - Get integration status
- `POST /api/calendar/ical/disconnect` - Disconnect calendar
- `GET /api/calendar/ical/events` - Fetch calendar events
- `POST /api/calendar/ical/sync` - Sync event to iCal calendar

### General

- `GET /api/calendar/integrations` - Get all user's integrations

## Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Ensure redirect URI in Google Console matches exactly
- Check for http vs https
- Verify port number (3001)

**Error: "access_denied"**
- User canceled authorization
- Check OAuth consent screen configuration
- Ensure user is added as test user (in testing mode)

**Token Expiry**
- Tokens expire after 1 hour
- Refresh tokens are used automatically
- If refresh fails, user must re-authorize

### iCal/CalDAV Issues

**Connection Failed**
- Verify server URL is correct
- Check username/password
- Ensure CalDAV is enabled on the server
- Test with a CalDAV client (e.g., Thunderbird, macOS Calendar)

**No Events Appearing**
- Check date range in query
- Verify calendar name/path
- Some servers require specific calendar paths

**Authentication Errors**
- Use app-specific passwords when available
- Check 2FA settings on the account
- Verify correct authentication method (Basic Auth)

## Development Notes

### Testing OAuth Flow

1. Use `http://localhost:3001` as base URL
2. Popup window should open for Google authorization
3. Check browser console for errors
4. Monitor backend logs for API issues

### Database Migration

Current implementation uses in-memory storage. To migrate to a database:

1. Create `calendar_integrations` table:
   ```sql
   CREATE TABLE calendar_integrations (
     id VARCHAR(255) PRIMARY KEY,
     user_id VARCHAR(255) NOT NULL,
     provider VARCHAR(50) NOT NULL,
     account_email VARCHAR(255),
     is_connected BOOLEAN DEFAULT true,
     access_token TEXT,
     refresh_token TEXT,
     expires_at TIMESTAMP,
     calendar_id VARCHAR(255),
     calendar_name VARCHAR(255),
     last_sync TIMESTAMP,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. Update server routes to use database queries instead of array operations

3. Implement token encryption/decryption

## Future Enhancements

- [ ] Support for Microsoft Outlook/Office 365 (OAuth)
- [ ] Recurring event support
- [ ] Event conflict detection
- [ ] Selective calendar sync (choose which calendars)
- [ ] Two-way sync (update/delete events)
- [ ] Batch sync operations
- [ ] Webhook support for real-time updates
- [ ] Calendar sharing within groups
- [ ] Event reminders and notifications

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `npm run dev:server`
3. Check browser console for frontend errors
4. Ensure all environment variables are set correctly

## License

This calendar integration follows the same license as Blue Moon Scheduler (MIT).
