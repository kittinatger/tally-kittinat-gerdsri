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

1. **You enter your username and password** → Tally looks up your account and verifies your password against the stored scrypt hash (a slow, salted hashing algorithm — even if the database leaked, an attacker can't quickly reverse a scrypt hash back into your actual password). This check runs the same way whether the username exists or not, so a login attempt's response timing doesn't reveal which accounts exist.
2. **If correct** → Tally creates a session token containing your account's id (a secure digital proof of who's logged in)
3. **Token is signed** → The session uses HMAC-SHA256 signing (a mathematical lock that makes it impossible to forge a session for any account, yours or someone else's, without knowing the server's secret)
4. **Token expires** → After 30 days (the SESSION_MAX_AGE), you must log in again to get a fresh token
5. **Token is protected** → Stored in an httpOnly cookie (locked away where JavaScript can't access it, protecting against XSS attacks) that only works over HTTPS (encrypted connections)

**In short**: Your login is mathematically locked and automatically expires, so even if someone gets your cookie, they can't fake a login, and it won't work forever.

## Security considerations

### By design (secure)

- **Session authentication**: All API routes are protected by session middleware (your login badge proves you're authorized to use the app). Session tokens are signed with HMAC-SHA256 (mathematically locked so no one can fake a login) and expire after 30 days (old logins stop working automatically).
- **Constant-time password verification**: Password comparisons use constant-time comparison (a special technique that prevents attackers from guessing your password by watching how fast the server responds).
- **httpOnly cookies**: Session cookies are marked `httpOnly` (stored in a private place that JavaScript code can't access, preventing attackers from stealing your login cookie through XSS attacks).
- **Passwords are hashed, never stored in plain text**: account passwords are hashed with scrypt (a slow, salted hashing algorithm designed to resist brute-force guessing) before being saved — the actual password is never stored anywhere, in the database or otherwise.
- **`SESSION_SECRET` is an environment variable only**: never stored in code or the database (if the database gets hacked, this secret isn't there).
- **Account changes require your current password**: changing your username or password from Settings re-verifies your current password server-side first, so a stolen session cookie alone can't be used to lock you out of your own account.

### Multi-user design

Tally supports multiple accounts on a single self-hosted deployment:
- **Anyone can create an account** at `/register` (username + password, no email) — there's no admin approval step
- **Every account's data is isolated**: expenses, categories, and balance are scoped to that account only in the database (every query is filtered by account, not just hidden in the UI), so one account can't see or modify another account's data on the same deployment

**Important**: Only share your Tally URL with people you're comfortable having their own account on your deployment — while their data stays private from other accounts, you (as the deployer) still control the underlying database and infrastructure everyone's data lives on.

### Third-party dependencies

Tally uses:
- **@google/genai** — Google's Gemini API client (for receipt/voice extraction)
- **@vercel/postgres** — Vercel's Postgres client
- **tailwindcss** — CSS utility framework
- **next.js** — Web framework

Security fixes in these dependencies are applied regularly via `npm audit`. Monitor your deployments for security updates.

## Security best practices for deployment

1. **Use HTTPS** — Always deploy with TLS/SSL (encrypted internet connection). Session cookies require the `Secure` flag and won't work over plain HTTP. Your URL should be `https://`, not `http://`.
2. **Rotate `SESSION_SECRET`** — Change it periodically (every 3-6 months is reasonable), especially if you suspect it's been compromised. This immediately invalidates all existing sessions for every account (logs everyone out, but doesn't affect anyone's password). Individual users should change their own password from Settings if they suspect it's been compromised.
3. **Keep dependencies updated** — Run `npm audit` and `npm update` regularly (security fixes in Next.js, React, and other libraries are released frequently).
4. **Environment isolation** — Store secrets in your hosting platform's secure environment variable system (Vercel, Railway, etc.), not in `.env.local` or code (if you commit your password, it's leaked forever).
5. **Access control** — Sharing the app URL alone doesn't expose any data — each person needs their own account, and accounts can't see each other's expenses. Still, only share the URL with people you're comfortable having an account on your deployment, since you control the underlying infrastructure their data lives on.
6. **Backups** — Regularly back up your Postgres database (in case your hosting provider has an outage or you accidentally delete data).

## Acknowledgments

We appreciate security researchers who responsibly report vulnerabilities. Credit will be given unless you request anonymity.
