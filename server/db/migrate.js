/**
 * Migration helper script
 * Sets up DATABASE_URL from config and runs migrations
 */

require('dotenv').config();
const config = require('./config');

// Build DATABASE_URL from config if not already set
if (!process.env.DATABASE_URL && config.host) {
  const { host, port, database, user, password } = config;
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

// Run the migration command passed as argument
const { exec } = require('child_process');
const command = process.argv.slice(2).join(' ');

if (!command) {
  console.error('Usage: node db/migrate.js <migration-command>');
  console.error('Example: node db/migrate.js up');
  process.exit(1);
}

exec(`npx node-pg-migrate ${command}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
  }
  console.log(stdout);
});
