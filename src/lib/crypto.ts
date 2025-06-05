import crypto from 'crypto';

// Constants for encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 32 bytes (256 bits) for AES-256

/**
 * Get encryption key from environment variable or generate a warning
 * In production, this should be set in environment variables
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn(
      'WARNING: ENCRYPTION_KEY environment variable not set! ' +
      'Using fallback key. This is NOT secure for production.'
    );
    // Fallback key for development only - NOT for production use
    return crypto
      .createHash('sha256')
      .update('monetizeg-dev-key-not-for-production')
      .digest();
  }
  
  // If key is provided but wrong length, hash it to get proper length
  if (Buffer.from(key).length !== KEY_LENGTH) {
    return crypto.createHash('sha256').update(key).digest();
  }
  
  return Buffer.from(key);
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns a base64 string containing: IV + encrypted data + auth tag
 */
export function encrypt(text: string): string {
  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag
    const result = Buffer.concat([iv, encrypted, authTag]);
    
    // Return as base64 string
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts a string that was encrypted using encrypt()
 * Expects a base64 string containing: IV + encrypted data + auth tag
 */
export function decrypt(encryptedText: string): string {
  try {
    // Convert base64 string to buffer
    const buffer = Buffer.from(encryptedText, 'base64');
    
    // Ensure the buffer is long enough
    if (buffer.length < IV_LENGTH + TAG_LENGTH) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Extract IV from the beginning of the buffer
    const iv = buffer.subarray(0, IV_LENGTH);
    
    // Extract auth tag from the end of the buffer
    const authTag = buffer.subarray(buffer.length - TAG_LENGTH);
    
    // Extract encrypted data (everything between IV and auth tag)
    const encrypted = buffer.subarray(IV_LENGTH, buffer.length - TAG_LENGTH);
    
    // Get encryption key
    const key = getEncryptionKey();
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Set auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Return as utf8 string
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Checks if a string appears to be encrypted with our format
 */
export function isEncrypted(text: string): boolean {
  try {
    // Check if it's a base64 string of sufficient length
    const buffer = Buffer.from(text, 'base64');
    return buffer.length >= IV_LENGTH + TAG_LENGTH;
  } catch {
    return false;
  }
}
