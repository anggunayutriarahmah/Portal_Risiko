import crypto from 'crypto';
import type { Request } from 'express';
import type { UserAccount, UserRole } from '../src/types/pusri.ts';

// Persistent runtime HMAC secret (uses env var in production, deterministic fallback per-instance)
const RUNTIME_FALLBACK_SECRET = crypto
  .createHash('sha256')
  .update(`pusri-erm-sso-iam-secret-${process.cwd()}-v2026`)
  .digest('hex');

function getJwtSecret(): string {
  return (process.env.SSO_JWT_SECRET && process.env.SSO_JWT_SECRET.trim().length >= 16)
    ? process.env.SSO_JWT_SECRET.trim()
    : RUNTIME_FALLBACK_SECRET;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  return Buffer.from(padded, 'base64');
}

/**
 * Cryptographic password hashing with scrypt + 16-byte random salt
 */
export function hashPassword(plainPassword: string): string {
  const clean = plainPassword.trim();
  if (clean.startsWith('scrypt$')) return clean;
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Constant-time password verification supporting both scrypt hashes and legacy migration
 */
export function verifyPassword(plainPassword: string, storedPassword?: string): boolean {
  if (!plainPassword || !storedPassword) return false;
  const candidate = plainPassword.trim();

  if (storedPassword.startsWith('scrypt$')) {
    const parts = storedPassword.split('$');
    if (parts.length !== 3) return false;
    const [, salt, expectedHex] = parts;
    const derived = crypto.scryptSync(candidate, salt, 64);
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derived, expectedBuf);
  }

  // Legacy plaintext comparison in constant time
  const a = Buffer.from(candidate, 'utf-8');
  const b = Buffer.from(storedPassword, 'utf-8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface SessionTokenPayload {
  sub: string;
  username: string;
  badge: string;
  nama: string;
  email: string;
  role: UserRole;
  unitKerja: string;
  kodeUnitKerja: string;
  authMethod: 'PUSRI_IAM_SSO' | 'OIDC_EXTERNAL' | 'LOCAL_IAM';
  iat: number;
  exp: number;
  jti: string;
}

const revokedTokenJtis = new Set<string>();

/**
 * Issue a server-signed HS256 JWT Session Token (8 hours validity)
 */
export function signSessionToken(
  user: UserAccount,
  authMethod: 'PUSRI_IAM_SSO' | 'OIDC_EXTERNAL' | 'LOCAL_IAM' = 'PUSRI_IAM_SSO',
  ttlSeconds = 8 * 60 * 60
): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: SessionTokenPayload = {
    sub: user.id,
    username: user.username,
    badge: user.badge || user.nik || user.username,
    nama: user.nama,
    email: user.email || `${user.username}@pusri.co.id`,
    role: user.role,
    unitKerja: user.unitKerja,
    kodeUnitKerja: user.kodeUnitKerja,
    authMethod,
    iat: nowSec,
    exp: nowSec + ttlSeconds,
    jti: crypto.randomUUID()
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', getJwtSecret()).update(signingInput).digest()
  );

  return `${signingInput}.${signature}`;
}

/**
 * Verify server-signed HS256 JWT Session Token
 */
export function verifySessionToken(token?: string | null): SessionTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const clean = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const parts = clean.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, providedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', getJwtSecret()).update(signingInput).digest()
  );

  const a = Buffer.from(providedSig, 'utf-8');
  const b = Buffer.from(expectedSig, 'utf-8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf-8')) as SessionTokenPayload;
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec) return null;
    if (payload.jti && revokedTokenJtis.has(payload.jti)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function revokeSessionToken(token?: string | null): void {
  const payload = verifySessionToken(token);
  if (payload?.jti) {
    revokedTokenJtis.add(payload.jti);
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const customHeader = req.headers['x-sso-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

// ============================================================================
// PKCE (Proof Key for Code Exchange) Single-Use Authorization Code Store
// ============================================================================
interface SsoAuthCodeEntry {
  code: string;
  userId: string;
  codeChallenge: string;
  state: string;
  expiresAt: number;
}

const ssoAuthCodes = new Map<string, SsoAuthCodeEntry>();

export function createSsoAuthorizationCode(
  userId: string,
  codeChallenge: string,
  state: string
): string {
  // Cleanup expired codes
  const now = Date.now();
  for (const [k, v] of ssoAuthCodes.entries()) {
    if (v.expiresAt < now) ssoAuthCodes.delete(k);
  }

  const code = `pusri_sso_code_${crypto.randomBytes(24).toString('hex')}`;
  ssoAuthCodes.set(code, {
    code,
    userId,
    codeChallenge,
    state,
    expiresAt: now + 60 * 1000 // Strict 60-second single-use TTL
  });
  return code;
}

export function consumeSsoAuthorizationCode(
  code: string,
  codeVerifier: string,
  state?: string
): { valid: boolean; userId?: string; reason?: string } {
  const entry = ssoAuthCodes.get(code);
  if (!entry) {
    return { valid: false, reason: 'Kode otorisasi SSO tidak valid atau sudah digunakan.' };
  }
  // Always delete immediately (single-use guarantee)
  ssoAuthCodes.delete(code);

  if (Date.now() > entry.expiresAt) {
    return { valid: false, reason: 'Kode otorisasi SSO telah kedaluwarsa (melebihi 60 detik).' };
  }

  if (state && entry.state && state !== entry.state) {
    return { valid: false, reason: 'State CSRF SSO tidak cocok.' };
  }

  // Verify PKCE S256: BASE64URL-ENCODE(SHA256(ASCII(code_verifier))) === code_challenge
  if (!codeVerifier || codeVerifier.length < 16) {
    return { valid: false, reason: 'PKCE code_verifier tidak valid.' };
  }
  const computedChallenge = base64UrlEncode(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );

  if (computedChallenge !== entry.codeChallenge) {
    return { valid: false, reason: 'Verifikasi kriptografi PKCE S256 gagal.' };
  }

  return { valid: true, userId: entry.userId };
}

export function sanitizeUserAccount(user: UserAccount): UserAccount {
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    nik: user.nik || user.badge,
    badge: user.badge || user.nik,
    accountStatus: user.accountStatus || 'active',
    authProvider: user.authProvider || 'PUSRI_IAM_SSO'
  };
}
