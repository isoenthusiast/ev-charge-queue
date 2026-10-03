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

No EV Railway deployment, hosted login/redeployment checks, real-device Safari/Android test, hardware integration or backup restoration is claimed. The inherited dependency advisory in SECURITY.md remains unresolved. Functional tests do not certify production security. GitHub's run also emitted action-runtime deprecation notices; the job completed successfully.
