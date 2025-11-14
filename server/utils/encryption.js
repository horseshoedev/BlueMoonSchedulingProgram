/**
 * Encryption Utility for OAuth Tokens
 * Uses AES-256-GCM encryption
 */

const crypto = require('crypto');

// Get encryption key from environment or generate a warning
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  console.warn('WARNING: ENCRYPTION_KEY not set in environment variables. Using insecure fallback.');
  console.warn('Generate a key with: node -e "console.log(crypto.randomBytes(32).toString(\'base64\'))"');
}

// Ensure key is 32 bytes for AES-256
function getKey() {
  if (!ENCRYPTION_KEY) {
    // Insecure fallback for development only
    return crypto.scryptSync('insecure-fallback-key', 'salt', 32);
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 encoded)');
  }
  return key;
}

/**
 * Encrypt a string value
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encrypted:tag (all base64)
 */
function encrypt(text) {
  if (!text) {
    return null;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    // Return format: iv:encrypted:tag
    return `${iv.toString('base64')}:${encrypted}:${tag.toString('base64')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Encrypted text in format: iv:encrypted:tag
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) {
    return null;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure random token
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} - Hex encoded token
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a secure encryption key (for setup)
 * @returns {string} - Base64 encoded 32-byte key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('base64');
}

module.exports = {
  encrypt,
  decrypt,
  generateToken,
  generateEncryptionKey,
};
