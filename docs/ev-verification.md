# EV app verification

Template source: b5f8a993e18f9a23119f8931779ed8567d7b5c3c. Separate private application: isoenthusiast/ev-charge-queue. No runtime dependencies added.

## Observed results — 4 October 2026 (Malaysia)

- Fresh generated-template baseline passed [Verify starter #1](https://github.com/isoenthusiast/ev-charge-queue/actions/runs/37154876538).
- The EV application passed [Import and verify EV app #1](https://github.com/isoenthusiast/ev-charge-queue/actions/runs/37155332415). That run imported and tested source commit `ecd722e`; its displayed triggering commit `0e38f5a` is the import workflow, not the resulting app source.
- Node 24.19.0 / npm 11.9.0 / PostgreSQL 18.4 / Chromium 141.
- Typecheck, ESLint, production build and all five migrations passed.
- **10 browser tests passed**, including five EV scenarios and five inherited starter regressions.
- **2 restart tests passed**, checking database sessions, notes and EV bookings/membership after production process restart.
- Mobile viewport 390 x 844: no horizontal overflow. Desktop viewport 1280 x 900. Actual browser screenshots are in `previews/`; generated accounts/cars are synthetic.

EV assertions cover membership, multiple chargers, car ownership, half-hour validation, unauthorized admin/session actions, last-admin protection, double bookings, concurrent reservation winner, release/rebooking, pending vs verified fault, cancellation, booking lockout, repair, location isolation, actual session start/finish, invalid manual chronology, valid correction and audit records.

Local clean locked installation, typecheck, lint, production compilation and isolated Edge rendering also passed. Local PostgreSQL startup was blocked by sandbox user-switch restrictions; CI used a real isolated PostgreSQL service instead. No remote/production database was used for tests.

## Reproduce

Use `npm run starter:verify` with the documented isolated local `*_test` database, or run the repository's Verify starter workflow. Each push rechecks the application. The runner creates random disposable accounts and cleans up only records belonging to those test accounts. Never commit browser session-state JSON or .env.

## Limits

Hosted authenticated login/booking/redeployment checks, real-device Safari/Android tests, hardware integration and backup restoration remain unverified. The first private user account has not yet been provisioned. The inherited dependency advisory in SECURITY.md remains unresolved. Functional tests do not certify production security. GitHub's run also emitted action-runtime deprecation notices; the job completed successfully.

## Railway deployment — 4 October 2026 (Malaysia)

- App: https://charge-queue-web-production.up.railway.app/login
- Separate Railway project `ev-charge-queue`, production environment; source `isoenthusiast/ev-charge-queue@main`.
- Deployment `2310119d-52a1-4e5a-8c55-4be7bfa8ceab` reached SUCCESS.
- Docker build and startup passed. All five migrations applied successfully in the pre-deploy phase.
- PostgreSQL 18 image has a persistent 5 GB volume; no database public domain or TCP proxy.
- HTTPS smoke passed: /health/live, /health/ready and /login return 200; /notes and /app redirect unauthenticated requests to /login.
- Fresh APP_KEY and database credentials were configured in Railway, not committed.
- Owner explicitly approved DB_SSL=false for this private database connection at 06:04 MYT. Transport encryption is supplied by Railway's isolated WireGuard private network; PostgreSQL TLS is not enabled on the app connection. This approval does not apply to public database connections.
- Existing dependency risk remains accepted with remediation deferred; see LESSONS_LEARNT.md.
- These are deployed smoke checks, not authenticated acceptance or backup/restore verification.

### First account

From a secure terminal inside the running Railway web service, execute `node ace user:create` and enter the desired email and a password of 12–128 characters at the prompts. No default account or public registration exists. Do not place passwords in Git, logs or chat.
