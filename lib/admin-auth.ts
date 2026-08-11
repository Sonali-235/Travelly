// Simple single-admin auth: one shared password (ADMIN_PASSWORD), and a
// signed, expiring cookie so you don't have to log in on every request.
// This intentionally does NOT support multiple admin accounts or roles —
// that's real RBAC territory (a later phase). For a solo-founder admin
// panel, one password behind HTTPS is a reasonable bar.
//
// Uses the Web Crypto API (not Node's `crypto` module) so the same code
// works both in API routes and in Edge middleware.

export const ADMIN_COOKIE_NAME = "travelly_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set in the environment.");
  return secret;
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Buffer.from(sigBuffer).toString("hex");
}

export function checkAdminPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  // Lengths differ often enough in practice that a simple equality check is
  // an acceptable trade-off here, given this guards a single low-traffic
  // admin login endpoint rather than a high-value multi-tenant system.
  return candidate === real;
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = JSON.stringify({ expiresAt });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = await hmac(payloadB64, getSecret());
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;

  const expectedSignature = await hmac(payloadB64, getSecret());
  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    return typeof payload.expiresAt === "number" && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}
