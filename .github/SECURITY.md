# Security Policy

## Reporting security vulnerabilities

**Please do not** open a public GitHub issue for security vulnerabilities.

Instead, email your report to **`timelabs.2023@gmail.com`** with:

1. **Description**: What is the vulnerability?
2. **Affected versions**: Which versions of Tally (if deployed) or commit (if self-hosted)?
3. **Steps to reproduce**: How can we verify the issue?
4. **Impact**: What could an attacker do with this vulnerability?

**Please do NOT**:
- Share proof-of-concept exploits or detailed exploitation code
- Disclose the vulnerability publicly before we've had time to fix it
- Test vulnerabilities on instances you don't own

## Response timeline

We will:
- **Acknowledge receipt** within 2 business days
- **Provide a fix** within 2 weeks for critical issues, 1 month for others
- **Coordinate disclosure** once a fix is available or in progress

## Supported versions

Tally is a personal project maintained part-time. Security fixes are applied to:

- **Latest commit on main branch** — always supported
- **Past versions** — fixes applied as backports when practical

## Security considerations

### By design (secure)

- **Session authentication**: All API routes are protected by session middleware. Session tokens are signed with HMAC-SHA256 and expire after 30 days.
- **Constant-time password verification**: Password comparisons use constant-time comparison to prevent timing attacks.
- **httpOnly cookies**: Session cookies are marked `httpOnly`, preventing JavaScript access.
- **No stored secrets**: `APP_PASSWORD` and `SESSION_SECRET` are environment variables only, never stored in code or the database.

### Single-user design

Tally is designed for single-user, self-hosted deployment:
- One password protects the entire app
- All data is shared (no per-user data isolation)
- Each instance is independent

**Do not** expose Tally to untrusted networks without additional authentication (e.g., a reverse proxy with TLS mutual auth or network access control).

### Third-party dependencies

Tally uses:
- **@google/genai** — Google's Gemini API client (for receipt/voice extraction)
- **@vercel/postgres** — Vercel's Postgres client
- **tailwindcss** — CSS utility framework
- **next.js** — Web framework

Security fixes in these dependencies are applied regularly via `npm audit`. Monitor your deployments for security updates.

## Security best practices for deployment

1. **Use HTTPS** — Always deploy with TLS/SSL. Session cookies require the `Secure` flag.
2. **Rotate secrets** — Change `APP_PASSWORD` and `SESSION_SECRET` regularly, especially if you suspect they're compromised.
3. **Keep dependencies updated** — Run `npm audit` and `npm update` regularly.
4. **Environment isolation** — Store secrets in your hosting platform's secure environment variable system (Vercel, Railway, etc.), not in `.env.local` or code.
5. **Access control** — Only share the app URL with trusted people. Consider using a reverse proxy with additional authentication if needed.
6. **Backups** — Regularly back up your Postgres database.

## Acknowledgments

We appreciate security researchers who responsibly report vulnerabilities. Credit will be given unless you request anonymity.
