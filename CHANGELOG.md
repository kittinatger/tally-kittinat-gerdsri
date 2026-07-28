# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

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
