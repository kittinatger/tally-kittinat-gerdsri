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

## How Sessions Work (Plain Language)

When you log in to Tally:

1. **You enter your password** → Tally checks if it's correct
2. **If correct** → Tally creates a secure "login badge" (called a session cookie)
3. **Badge is locked** → The badge can't be faked or copied — it's tamper-proof
4. **Badge expires** → After 30 days, you have to log in again (for your security)
5. **Badge is encrypted** → The badge only works on HTTPS (encrypted internet connection)

**In short**: Once you log in, your browser gets a secure badge that proves you're logged in. Someone can't fake this badge or steal it because it's locked and encrypted. It automatically expires so old logins can't be used forever.

## Security considerations

### By design (secure)

- **Login badge can't be faked**: Your session badge is mathematically signed so no one can create a fake one
- **Password is checked fairly**: The app checks your password in a special way that can't be tricked by timing tricks
- **Badge is private**: Your login badge is kept in a private place that JavaScript can't access — extra protection against hackers
- **Secrets stay secret**: Your `APP_PASSWORD` and `SESSION_SECRET` are never written to files or databases — they only exist in memory

### Single-user design

Tally is designed for one person (or one household):
- **One password for everything** — Everyone who knows the password can see all data
- **No separate user accounts** — Unlike Gmail where everyone has their own inbox, Tally is all-or-nothing
- **Each person gets their own copy** — If you want to use Tally with someone else, they should deploy their own separate copy

**Keep the password private!** Only share your Tally URL with people you trust completely, because they can see and edit all your expenses.

### Third-party dependencies

Tally uses:
- **@google/genai** — Google's Gemini API client (for receipt/voice extraction)
- **@vercel/postgres** — Vercel's Postgres client
- **tailwindcss** — CSS utility framework
- **next.js** — Web framework

Security fixes in these dependencies are applied regularly via `npm audit`. Monitor your deployments for security updates.

## Security best practices for deployment

1. **Use HTTPS** — Always deploy on an encrypted website (HTTPS, not HTTP). Your app's URL should start with `https://`, not `http://`.
2. **Change your password sometimes** — Every 3-6 months, update your `APP_PASSWORD` and `SESSION_SECRET` in case someone somehow got them.
3. **Keep your app updated** — When Vercel or Tally releases security updates, apply them.
4. **Store secrets safely** — Your password and secret should only live in Vercel's (or your hosting provider's) settings panel, never in text files you share.
5. **Keep the URL private** — Only give your Tally URL to people you trust completely, since anyone with the URL can view and edit all your expenses.
6. **Back up your data** — Regularly download or copy your expense data in case something goes wrong with your database.

## Acknowledgments

We appreciate security researchers who responsibly report vulnerabilities. Credit will be given unless you request anonymity.
