import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_PREFIX = "dpdp_";
const RAW_KEY_BYTES = 32;
const SCRYPT_KEYLEN = 64;

export function generateApiKey(): { rawKey: string; prefix: string } {
  const rawKey = KEY_PREFIX + randomBytes(RAW_KEY_BYTES).toString("hex");
  return { rawKey, prefix: rawKey.slice(0, 12) };
}

export function hashApiKey(rawKey: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(rawKey, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt };
}

export function verifyApiKey(rawKey: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(rawKey, salt, SCRYPT_KEYLEN);
  const stored = Buffer.from(hash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}
