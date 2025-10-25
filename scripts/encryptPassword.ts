import * as crypto from 'crypto';
import * as readline from 'readline';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

function encrypt(text: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha512');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Password Encryption Utility ===\n');

rl.question('Enter password to encrypt: ', (password: string) => {
  rl.question('Enter encryption key (store in ENCRYPTION_KEY env var): ', (encryptionKey: string) => {
    if (!password || !encryptionKey) {
      console.error('\nError: Both password and encryption key are required');
      rl.close();
      process.exit(1);
    }
    
    try {
      const encrypted = encrypt(password, encryptionKey);
      console.log('\n✓ Password encrypted successfully!\n');
      console.log('Add this to config.json:');
      console.log(`"password": "encrypted:${encrypted}"\n`);
      console.log('Set this environment variable locally:');
      console.log(`export ENCRYPTION_KEY="${encryptionKey}"`);
      console.log('\nFor GitHub Actions, add ENCRYPTION_KEY to repository secrets.\n');
    } catch (error) {
      console.error('\nError:', (error as Error).message);
    }
    
    rl.close();
  });
});
