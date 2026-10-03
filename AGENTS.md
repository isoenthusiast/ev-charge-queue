# Agent instructions

Read README.md, docs/architecture.md and docs/operations.md first. Use APP_STARTER_PACK.md as the setup brief, respecting the user's current request and host rules.

- Preserve the pinned AdonisJS/PostgreSQL/Edge/HTMX stack unless a concrete requirement justifies a change.
- Prefer supported framework features; one ORM and one backend service.
- Read package-lock.json and documentation for installed versions; don't copy v5/v6 examples into this v7 app.
- Keep shared business logic in app/services and enforce ownership server-side.
- No hardcoded accounts, real secrets, remote database test targets or silent schema resets.
- Verify with npm run starter:verify after meaningful changes. It needs a local isolated *_test PostgreSQL database and Chromium.
- npm test expects an existing build. A development-server pass is not a production-build pass.
- Check docs/template-verification.md before claiming capabilities. Read RAILWAY_SETUP.md for Railway Docker/HTTPS verification. Hosted authenticated workflows, backup/restore and Android remain unverified. New Railway services do not read legacy railway.json; apply and inspect service settings explicitly.
- Document dependency or operational changes. Keep deployment identities out of the reusable template.

For this app, also read docs/ev-requirements.md and docs/ev-verification.md. ChargingService owns permissions, booking concurrency and fault/session transitions. Do not replace PostgreSQL constraints with UI-only checks. Preserve the Notes route as a template regression fixture; /app is the actual product.
