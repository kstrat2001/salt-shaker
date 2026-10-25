import { createHash } from "node:crypto";

/**
 * Password hashing.
 *
 * This is the scheme the service shipped with: unsalted SHA-256. Every
 * account created so far has a hash in this format, `sha256$<hex>`.
 */

export function hashPassword(password: string): string {
  return `sha256$${createHash("sha256").update(password).digest("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  return hashPassword(password) === stored;
}
