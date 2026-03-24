import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16;

// Prefix stamped on every encrypted blob so we can detect plain-text fallbacks
const ENCRYPTED_PREFIX = "enc:";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be set as a 64-char hex string (32 bytes). " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypts a plaintext string.
 * Returns "enc:" + base64(iv | tag | ciphertext)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return (
    ENCRYPTED_PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64")
  );
}

export function decrypt(stored: string): string {
  // ── Happy path: properly prefixed encrypted blob ──────────────────────────
  if (stored.startsWith(ENCRYPTED_PREFIX)) {
    const key = getKey(); // throws clearly if key missing
    const data = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), "base64");

    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(ciphertext) + decipher.final("utf8");
  }

  if (stored.startsWith("mongodb://") || stored.startsWith("mongodb+srv://")) {
    return stored;
  }

  // ── Last resort: attempt decryption without prefix (old format) ───────────
  try {
    const key = getKey();
    const data = Buffer.from(stored, "base64");

    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(ciphertext) + decipher.final("utf8");
  } catch {
    // Give up and return as-is — maskUri will handle it
    return stored;
  }
}
