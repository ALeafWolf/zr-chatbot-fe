const ALGORITHM = "AES-GCM" as const;
const IV_BYTE_LENGTH = 12;

/** localStorage key for encrypted gate session blob */
export const GATE_SESSION_STORAGE_KEY = "chatbot_gate_session";

async function sha256Utf8(secret: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(secret);
  return crypto.subtle.digest("SHA-256", data);
}

async function importAesGcmKey(secret: string): Promise<CryptoKey> {
  const raw = await sha256Utf8(secret);
  return crypto.subtle.importKey("raw", raw, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function concatIvAndCiphertext(iv: Uint8Array, ciphertext: ArrayBuffer): Uint8Array {
  const out = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ciphertext), iv.byteLength);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptGateSessionBlob(
  sessionSecret: string,
  expiresAtMs: number,
): Promise<string> {
  const key = await importAesGcmKey(sessionSecret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  const plaintext = new TextEncoder().encode(JSON.stringify({ expiresAtMs }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintext,
  );
  return bytesToBase64(concatIvAndCiphertext(iv, ciphertext));
}

/** Returns expiry timestamp ms, or null if invalid/expired decryption or malformed payload */
export async function decryptGateSessionBlob(
  sessionSecret: string,
  blob: string,
): Promise<number | null> {
  try {
    const combined = base64ToBytes(blob);
    if (combined.byteLength < IV_BYTE_LENGTH + 16) return null;

    const iv = combined.slice(0, IV_BYTE_LENGTH);
    const cipher = combined.slice(IV_BYTE_LENGTH);
    const key = await importAesGcmKey(sessionSecret);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      cipher,
    );
    const text = new TextDecoder().decode(decrypted);
    const parsed: unknown = JSON.parse(text);

    if (parsed === null || typeof parsed !== "object") return null;

    const exp = (parsed as { expiresAtMs?: unknown }).expiresAtMs;
    if (typeof exp !== "number" || !Number.isFinite(exp)) return null;

    return exp;
  } catch {
    return null;
  }
}
