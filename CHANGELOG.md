# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Replaced the edit-balance pencil icon on the Dashboard's "Remaining" card

## [0.4.1] - 2026-07-31

### Changed
- Replaced favicons with new light/dark SVG marks, and swapped the login/register/header logo badge to match
- Replaced the theme toggle, sign-out, chart, and receipt icons with a new icon set
- Consolidated author, tech stack, and icon-licensing credits into `.github/ACKNOWLEDGMENTS.md`
- Updated README screenshots

### Fixed
- Navigating between Dashboard, Activities, and Settings could feel slow with no feedback while data loaded — added streaming loading skeletons so the transition shows instantly, plus a database index to keep the transaction list query fast as history grows
- Corrected the contact email in the security policy, contributing guide, and code of conduct

## [0.4.0] - 2026-07-30

### Added
- "Your account" section in Settings — view your username, change your username (checked for availability before saving), and change your password, both requiring your current password to confirm

## [0.3.0] - 2026-07-30

### Changed
- Reorganized the app into three pages: **Dashboard** (income/expense summary, remaining balance, category breakdown, spending trend), **Activities** (full transaction log, search/filter, CSV export, add transaction), and **Settings** (theme, currency, auto-convert, category management)
- Settings moved from a gear-icon dropdown into its own page for authenticated users (the dropdown is still used for the pre-login theme/currency preview on the login/register pages)
- Category management (add/rename/delete) moved from the old Categories page into Settings
- `/categories` now redirects to the Dashboard

### Added
- Version number, Privacy Policy, and Terms of Service links in the Settings page footer

## [0.2.0] - 2026-07-30

### Added
- Multi-user accounts: public sign-up at `/register` (username + password, no email) so multiple people can use the same deployment with fully isolated data
- One-time admin bootstrap (`ADMIN_USERNAME`/`ADMIN_BOOTSTRAP_PASSWORD`) that migrates a pre-existing single-user deployment's data to a real account instead of losing it

### Changed
- Session cookies now identify which account is logged in, instead of just being a shared pass/fail token
- Replaced the single shared `APP_PASSWORD` with per-account passwords (scrypt-hashed)

### Fixed
- Closed an IDOR gap where expense/category edit and delete endpoints only checked the row's id, not who owned it
- Fixed a migration bug that could delete the settings row (starting balance, currency) before an admin account claimed it
- Fixed a crash/collision in new-account creation caused by a leftover legacy default value on the settings table

### Security
- Passwords are now hashed (scrypt) instead of compared against a single plaintext environment variable
- Login no longer reveals whether a given username exists via response timing

## [0.1.0] - 2026-07-28

### Added
- Core expense tracking with manual entry
- Receipt scanning with Google Gemini vision API
  - Auto-extracts merchant, total, date, category
  - Bulk receipt upload and batch processing
  - Original receipt image storage
- Voice-to-expense with transcription
- Search and filtering by merchant, notes, category, type, tags, date range
- Free-form transaction tagging
- Income and expense transaction types with separate category lists
- Customizable category names and colors
- 6-month spending trend chart
- CSV export of filtered transactions
- Live-updating balance calculator
- Multi-currency support with auto-conversion
  - Currency selection in settings
  - Automatic conversion for scanned/voiced transactions (via Frankfurter API)
- Password-protected single-user design with signed session cookies
- Responsive liquid-glass UI optimized for mobile and desktop
- Pull-to-refresh on mobile
- Postgres backend with Vercel Postgres integration
- Vercel one-click deploy button
- Public release documentation (security policy, contribution guidelines, code of conduct)
- Step-by-step Vercel deployment guide for non-technical users
- Screenshots and issue templates

### Tech Stack
- Next.js 16.2 (App Router) with TypeScript
- React 19 with functional components
- Tailwind CSS v4 for styling
- Vercel Postgres (Neon) for storage
- Google Gemini API for vision and transcription
- Frankfurter API for currency conversion

### Security
- Fixed critical API authentication vulnerability — all API routes now require a valid session token via middleware

---

## How to version going forward

When releasing a new version:

1. Add a new section with the version number and date
2. List changes under: Added, Changed, Deprecated, Removed, Fixed, Security
3. Update the `[Unreleased]` section as you work
4. Tag the commit: `git tag -a v0.2.0 -m "Version 0.2.0"`
5. Push tags: `git push origin --tags`

Example format:
```markdown
## [0.2.0] - 2025-02-01

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Breaking change description
```
