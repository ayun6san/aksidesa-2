import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate secure token
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Generate session token
export function generateSessionToken(): string {
  return generateToken(32);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate username (alphanumeric, underscore, min 3 chars)
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  return usernameRegex.test(username);
}

// Validate phone number (Indonesian format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

// Validate password strength (min 6 chars)
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

// Get client IP from request
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}

// Get user agent from request
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

// Check if account is locked
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

// Calculate lockout time (exponential backoff)
export function calculateLockoutTime(attempts: number): Date {
  const baseMinutes = 5;
  const multiplier = Math.min(attempts - 3, 5); // Max 5x multiplier
  const lockoutMinutes = baseMinutes * Math.pow(2, multiplier);
  return new Date(Date.now() + lockoutMinutes * 60 * 1000);
}
