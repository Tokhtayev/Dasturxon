const GOOGLE_API_KEY_PATTERN = /AIza[0-9A-Za-z_-]{16,}/g;
const BEARER_TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

/** Removes API keys, Bearer tokens, and JWTs before rendering or logging an error string. */
export function redactSensitiveTokens(raw: string): string {
  return raw
    .replace(GOOGLE_API_KEY_PATTERN, '[REDACTED_KEY]')
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [REDACTED]')
    .replace(JWT_PATTERN, '[REDACTED_JWT]');
}

/** Extracts a user-friendly, token-redacted error message without leaking raw secrets. */
export function getReadableErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) {
    return redactSensitiveTokens(err.message);
  }
  if (typeof err === 'string' && err.trim()) {
    return redactSensitiveTokens(err);
  }
  return fallback;
}
