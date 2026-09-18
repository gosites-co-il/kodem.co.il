import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY_VERSION = 1;

function resolveKey(): Buffer {
  const raw = process.env['CONNECTION_CREDENTIALS_KEY'];
  if (!raw || raw.length < 16) {
    // Dev fallback — never use in production without setting the env var.
    return scryptSync('kodem-dev-connection-credentials', 'kodem-salt', 32);
  }
  return scryptSync(raw, 'kodem-connection-salt', 32);
}

/**
 * Encrypts connection secrets for storage. Ciphertext is opaque; never expose
 * decrypted payloads through API responses.
 */
export class ConnectionCredentialsStore {
  encrypt(payload: Record<string, string>): {
    ciphertext: string;
    keyVersion: number;
  } {
    const key = resolveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, key, iv);
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    const packed = Buffer.concat([iv, tag, encrypted]).toString('base64');
    return { ciphertext: packed, keyVersion: KEY_VERSION };
  }

  decrypt(ciphertext: string): Record<string, string> {
    const key = resolveKey();
    const buf = Buffer.from(ciphertext, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plaintext) as Record<string, string>;
  }
}
