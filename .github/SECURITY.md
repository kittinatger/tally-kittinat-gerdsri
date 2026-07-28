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

## How Sessions Work

When you log in to Tally:

1. **You enter your password** → Tally verifies it using constant-time comparison (a special technique that checks your password fairly, without leaking timing information to attackers)
2. **If correct** → Tally creates a session token (a secure digital proof that you're logged in)
3. **Token is signed** → The session uses HMAC-SHA256 signing (a mathematical lock that makes it impossible to fake a login without knowing the secret)
4. **Token expires** → After 30 days (the SESSION_MAX_AGE), you must log in again to get a fresh token
5. **Token is protected** → Stored in an httpOnly cookie (locked away where JavaScript can't access it, protecting against XSS attacks) that only works over HTTPS (encrypted connections)

**In short**: Your login is mathematically locked and automatically expires, so even if someone gets your cookie, they can't fake a login, and it won't work forever.

## Security considerations

### By design (secure)

- **Session authentication**: All API routes are protected by session middleware (your login badge proves you're authorized to use the app). Session tokens are signed with HMAC-SHA256 (mathematically locked so no one can fake a login) and expire after 30 days (old logins stop working automatically).
- **Constant-time password verification**: Password comparisons use constant-time comparison (a special technique that prevents attackers from guessing your password by watching how fast the server responds).
- **httpOnly cookies**: Session cookies are marked `httpOnly` (stored in a private place that JavaScript code can't access, preventing attackers from stealing your login cookie through XSS attacks).
- **No stored secrets**: `APP_PASSWORD` and `SESSION_SECRET` are environment variables only, never stored in code or the database (if the database gets hacked, your password isn't there).

### Single-user design

Tally is designed for single-user, self-hosted deployment (one instance per person):
- **One password protects the entire app** (everyone who knows the password can see all data — unlike multi-user apps where each person has their own account)
- **All data is shared** (no per-user data isolation — there's no privacy between people who know the password)
- **Each instance is independent** (if you want to use Tally with someone else, they should deploy their own separate copy so your data stays private)

**Important**: Only share your Tally URL with people you trust completely, because they can see and edit all your expenses.

### Third-party dependencies

Tally uses:
- **@google/genai** — Google's Gemini API client (for receipt/voice extraction)
- **@vercel/postgres** — Vercel's Postgres client
- **tailwindcss** — CSS utility framework
- **next.js** — Web framework

Security fixes in these dependencies are applied regularly via `npm audit`. Monitor your deployments for security updates.

## Security best practices for deployment

1. **Use HTTPS** — Always deploy with TLS/SSL (encrypted internet connection). Session cookies require the `Secure` flag and won't work over plain HTTP. Your URL should be `https://`, not `http://`.
2. **Rotate secrets** — Change `APP_PASSWORD` and `SESSION_SECRET` regularly (every 3-6 months is reasonable), especially if you suspect they've been compromised. Changing `SESSION_SECRET` immediately invalidates all existing sessions (logs everyone out).
3. **Keep dependencies updated** — Run `npm audit` and `npm update` regularly (security fixes in Next.js, React, and other libraries are released frequently).
4. **Environment isolation** — Store secrets in your hosting platform's secure environment variable system (Vercel, Railway, etc.), not in `.env.local` or code (if you commit your password, it's leaked forever).
5. **Access control** — Only share the app URL with trusted people (anyone with the URL can view and edit all expenses). Consider using a reverse proxy with additional authentication if needed.
6. **Backups** — Regularly back up your Postgres database (in case your hosting provider has an outage or you accidentally delete data).

## Acknowledgments

We appreciate security researchers who responsibly report vulnerabilities. Credit will be given unless you request anonymity.
