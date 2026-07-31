# Contributing to Tally

Thanks for your interest in improving Tally! This is a personal project, but contributions are welcome.

## How to report issues

### Security vulnerabilities

**Do not** open a public GitHub issue for security vulnerabilities. Instead, email details to `kittinatg@gmail.com` with:
- A description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact

Please do not include proof-of-concept exploits in the report. We'll work with you to understand and fix the issue before public disclosure.

### Bugs and feature requests

Feel free to open a GitHub issue describing:
- What happened (for bugs)
- What you expected to happen
- Steps to reproduce
- Your environment (OS, browser, deployment method)

For feature requests, explain the use case and why you think it's important for a personal expense tracker.

## How to submit pull requests

1. **Fork the repo** and create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Follow the code style**:
   - Use TypeScript (strict mode)
   - Format with Prettier (via `eslint`)
   - Run `npm run lint` before submitting
   - Keep components small and focused

3. **Test your changes**:
   - Test locally: `npm run dev`
   - Verify the UI works on mobile (use `resize-window` in the dev browser)
   - For new features, consider adding tests if the repo gains a test suite

4. **Write a clear commit message**:
   ```
   Add feature X
   
   Explain why this change is needed and how it works.
   ```

5. **Submit a PR** with:
   - A clear description of the change
   - Link to any related issues
   - Screenshots if UI changes
   - Notes on testing

## Code style

- **TypeScript**: All code must be TypeScript. Enable strict mode.
- **Components**: Use React 19 with functional components and hooks.
- **Styling**: Tailwind CSS v4. No CSS modules or styled-components.
- **Naming**: camelCase for variables/functions, PascalCase for components/classes.
- **Comments**: Only add comments when the *why* is non-obvious. Code should be self-explanatory.

## Project structure

- `src/app/` — Next.js pages and API routes
- `src/components/` — Reusable React components
- `src/lib/` — Utilities (database, auth, formatting, etc.)
- `src/types/` — TypeScript interfaces
- `.github/` — GitHub workflows and docs

## Running locally

```bash
npm install
cp .env.local.example .env.local  # Fill in secrets
npm run dev
```

See README.md for full setup instructions (database, API keys, etc.).

## Code of conduct

Be respectful and inclusive. This project is welcoming to all contributors regardless of experience level.

## Questions?

Feel free to open a discussion or issue if you have questions about contributing!
