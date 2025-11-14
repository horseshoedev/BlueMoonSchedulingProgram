# Database Migration Guide

## Overview

This guide covers the migration from in-memory JavaScript arrays to a PostgreSQL database for the Blue Moon Scheduling Program.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Database Schema](#database-schema)
4. [Configuration](#configuration)
5. [Migration Commands](#migration-commands)
6. [Development Workflow](#development-workflow)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v16+ recommended
- **PostgreSQL**: v13+ recommended
- **npm**: v8+ recommended

### Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

---

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

This will install:
- `pg` - PostgreSQL client
- `node-pg-migrate` - Migration tool
- All existing dependencies

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create development database
CREATE DATABASE bluemoon_scheduler_dev;

# Create test database (optional)
CREATE DATABASE bluemoon_scheduler_test;

# Exit psql
\q
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate encryption key
node -e "console.log(crypto.randomBytes(32).toString('base64'))"

# Edit .env and add:
# - Database credentials
# - Encryption key (from above)
# - JWT secret
# - Other configuration
```

**Minimum required .env variables:**
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluemoon_scheduler_dev
DB_USER=postgres
DB_PASSWORD=your_password
ENCRYPTION_KEY=your_generated_key_here
JWT_SECRET=your_jwt_secret_here
```

### 4. Run Migrations

```bash
# Run all migrations
npm run migrate:up

# Seed database with test data
npm run db:seed
```

### 5. Start Server

```bash
npm run dev
```

Your server is now running with PostgreSQL! 🎉

---

## Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | User accounts and preferences |
| `groups` | Group information |
| `group_members` | User-group membership (many-to-many) |
| `invitations` | Group invitations |
| `calendar_integrations` | External calendar connections |
| `meeting_proposals` | Meeting time proposals |
| `proposal_responses` | Responses to meeting proposals |
| `schedule_events` | Scheduled events (NEW) |
| `event_attendees` | Event attendees (many-to-many) |
| `availability_blocks` | User availability data (NEW) |

### Entity Relationships

```
User (1) ──────── (N) GroupMember (N) ──────── (1) Group
  │                                                  │
  ├─ (1:N) ─→ Invitation (from/to)                 │
  ├─ (1:N) ─→ CalendarIntegration                  │
  ├─ (1:N) ─→ MeetingProposal (proposed_by)        │
  ├─ (1:N) ─→ ScheduleEvent (created_by)           │
  └─ (1:N) ─→ AvailabilityBlock                    │

Group ─ (1:N) ──→ MeetingProposal
       └─ (1:N) ──→ ScheduleEvent

MeetingProposal ─ (1:N) ──→ ProposalResponse

ScheduleEvent ─ (N:M) ──→ User (via event_attendees)
```

### Key Features

- **UUID Primary Keys**: All tables use UUIDs for better security and distributed systems support
- **Automatic Timestamps**: `created_at` and `updated_at` columns with triggers
- **Soft Deletes**: `deleted_at` column for users and groups
- **Encrypted Tokens**: OAuth tokens encrypted using AES-256-GCM
- **JSONB Support**: Flexible storage for preferences and recurring patterns
- **Enum Types**: Type-safe status and role fields
- **Indexes**: Optimized for common query patterns

---

## Configuration

### Development Environment

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bluemoon_scheduler_dev
DB_USER=postgres
DB_PASSWORD=your_password
```

### Production Environment

Use `DATABASE_URL` for simplified configuration (common in hosting providers):

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
DB_SSL=true
```

### Connection Pooling

Configured in `server/db/config.js`:

- **Development**: Max 10 connections
- **Production**: Max 20 connections
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds

---

## Migration Commands

### Available Scripts

```bash
# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create a new migration
npm run migrate:create <migration-name>

# Seed database with test data
npm run db:seed

# Full database reset (down, up, seed)
npm run db:reset

# Setup database from scratch (up, seed)
npm run db:setup
```

### Migration Files

Located in `server/migrations/`:

1. `1700000001_create-users-table.js` - Users
2. `1700000002_create-groups-table.js` - Groups
3. `1700000003_create-group-members-table.js` - Group members
4. `1700000004_create-invitations-table.js` - Invitations
5. `1700000005_create-calendar-integrations-table.js` - Calendar integrations
6. `1700000006_create-meeting-proposals-table.js` - Meeting proposals
7. `1700000007_create-proposal-responses-table.js` - Proposal responses
8. `1700000008_create-schedule-events-table.js` - Schedule events
9. `1700000009_create-availability-blocks-table.js` - Availability blocks

---

## Development Workflow

### Daily Development

```bash
# Start dev server
npm run dev

# If migrations added, run:
npm run migrate:up
```

### Test Data

The seed script creates:
- 3 test users (john@example.com, jane@example.com, bob@example.com)
- 2 test groups with memberships
- Password for all test users: `password123`

### Inspecting Database

```bash
# Connect to database
psql bluemoon_scheduler_dev

# List tables
\dt

# Describe table
\d users

# Query data
SELECT * FROM users;

# Exit
\q
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Environment variables configured
- [ ] Encryption key generated and set
- [ ] Database user has appropriate permissions
- [ ] SSL enabled (if required)
- [ ] Backup strategy in place

### Deployment Steps

1. **Set Environment Variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=postgresql://user:pass@host:port/db
   export ENCRYPTION_KEY=your_secure_key_here
   export JWT_SECRET=your_secure_jwt_secret
   ```

2. **Run Migrations**
   ```bash
   npm run migrate:up
   ```

3. **Start Server**
   ```bash
   npm start
   ```

### Hosting Providers

#### Heroku
```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Migrations run automatically with Heroku release phase
# Or manually:
heroku run npm run migrate:up
```

#### Render
- Add PostgreSQL database service
- Set `DATABASE_URL` environment variable
- Add build command: `cd server && npm install && npm run migrate:up`

#### Railway
- Add PostgreSQL plugin
- Set environment variables
- Add start command: `npm run migrate:up && npm start`

---

## Troubleshooting

### Common Issues

#### "Cannot connect to database"

**Check PostgreSQL is running:**
```bash
# macOS/Linux
pg_isready

# Check service status
brew services list  # macOS
systemctl status postgresql  # Linux
```

**Check credentials:**
- Verify `.env` file exists and has correct values
- Test connection: `psql postgresql://user:pass@localhost:5432/dbname`

#### "Migration failed: relation already exists"

**Reset database:**
```bash
npm run db:reset
```

Or manually:
```bash
psql bluemoon_scheduler_dev
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q
npm run migrate:up
```

#### "ENCRYPTION_KEY not set"

Generate a new key:
```bash
node -e "console.log(crypto.randomBytes(32).toString('base64'))"
```

Add to `.env`:
```env
ENCRYPTION_KEY=generated_key_here
```

#### "Pool connection timeout"

- Check if database is accepting connections
- Verify max connections: `SHOW max_connections;` in psql
- Reduce pool size in `server/db/config.js`

---

## Repository Pattern

### Using Repositories

All database operations use repository modules for consistency:

```javascript
const userRepo = require('./repositories/userRepository');

// Create user
const user = await userRepo.createUser({
  email: 'user@example.com',
  password: hashedPassword,
  name: 'User Name',
});

// Find by email
const user = await userRepo.findByEmail('user@example.com');

// Update profile
const updated = await userRepo.updateProfile(userId, {
  name: 'New Name',
  preferences: { theme: 'dark' },
});
```

### Available Repositories

- `userRepository.js` - User operations
- `groupRepository.js` - Group and membership operations
- `invitationRepository.js` - Invitation operations
- `calendarIntegrationRepository.js` - Calendar integration operations
- `meetingProposalRepository.js` - Meeting proposal and response operations
- `scheduleEventRepository.js` - Schedule event operations
- `availabilityRepository.js` - Availability block operations

---

## Next Steps

### Completing the Migration

The following tasks remain to fully migrate from in-memory to database:

1. **Update server/index.js endpoints** to use repositories instead of arrays
2. **Add new API endpoints** for Schedule Events (GET/POST/PUT/DELETE)
3. **Add new API endpoints** for Availability Data (GET/POST/PUT/DELETE)
4. **Test all endpoints** thoroughly
5. **Update frontend** to use new Schedule Events and Availability APIs

### New Features Enabled

With the database migration, you can now:
- ✅ Persist schedule events (previously only mock data)
- ✅ Store user availability patterns
- ✅ Support multiple users concurrently
- ✅ Recover data after server restart
- ✅ Scale horizontally with multiple server instances
- ✅ Implement proper backup and recovery
- ✅ Use database transactions for data integrity

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review migration files in `server/migrations/`
3. Check repository code in `server/repositories/`
4. Review database logs: `tail -f /usr/local/var/log/postgres.log` (macOS)

---

## License

MIT
