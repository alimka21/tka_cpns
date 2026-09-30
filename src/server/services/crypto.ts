// Enkripsi rahasia milik user (Gemini API key) at-rest dengan AES-256-GCM.
// Kunci enkripsi diturunkan dari env ENCRYPTION_SECRET (bukan disimpan di DB).
// Format: v1.<iv>.<tag>.<ciphertext> (base64url). Jangan pernah log plaintext.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const SALT = "web-tes-premium:user-secrets:v1";
let cachedKey: { secret: string; key: Buffer } | null = null;

function encryptionKey(secret = process.env.ENCRYPTION_SECRET) {
  if (!secret || secret.length < 16) throw new Error("ENCRYPTION_SECRET belum diatur (minimal 16 karakter).");
  if (cachedKey?.secret !== secret) cachedKey = { secret, key: scryptSync(secret, SALT, 32) };
  return cachedKey.key;
}

export function encryptSecret(plain: string, secret?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

/** Melempar error bila format rusak atau kunci/secret tidak cocok (tag GCM gagal). */
export function decryptSecret(payload: string, secret?: string): string {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Format data terenkripsi tidak dikenal.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

/** Tampilan tersamar, mis. "AIza…ab12". */
export function maskSecret(plain: string) {
  return plain.length <= 8 ? "••••" : `${plain.slice(0, 4)}…${plain.slice(-4)}`;
}
