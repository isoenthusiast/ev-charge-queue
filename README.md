# Charge Queue

Mobile-first EV charger scheduling built from `isoenthusiast/ed-app-starter-public` at commit `b5f8a993e18f9a23119f8931779ed8567d7b5c3c`.

One AdonisJS 7 / TypeScript app, PostgreSQL, Edge templates and the existing session/CSRF/HTMX foundation. No new runtime dependencies. The public starter remains unchanged.

## Start locally

Requires Node 24.19.0, npm 11.9.0 and PostgreSQL 18.4.

```bash
npm ci
npm run starter:init -- --name ev-charge-queue
docker compose up -d
npm run db:migrate
npm run user:create
npm run dev
```

Open http://localhost:3333. Create each private account with `npm run user:create`; the command prompts securely. There is no default account, public signup, password reset or email delivery. Sign in, create a location, add existing accounts by email and assign member/admin roles. Add chargers, register your car in the garage, and reserve a half-hour slot.

## Working rules

- Location creators become the first location admin. A user can belong to multiple locations and have a different role at each one. At least one admin must remain.
- Location admins add existing users and chargers, assign bookings for member-owned cars, update charger status, review fault reports and correct sessions with a reason.
- Members register their own cars, view their locations' queues, reserve their cars, release their own bookings, and start/finish their own sessions.
- Each reservation occupies exactly 30 minutes, starting on :00 or :30. Book up to 14 days ahead. All initial locations use **Asia/Kuala_Lumpur**; stored timestamps are UTC.
- PostgreSQL unique indexes prevent simultaneous reservations for the same charger or car and prevent multiple active sessions for a charger/car. A location lock makes status changes and bookings atomic.
- Start charging during the reserved half hour. Finishing early does not reopen that same slot. Releasing a booking makes its slot available again.
- Any location member can report a fault. Pending reports do not change availability. Verification sets the charger faulty, cancels upcoming bookings and stops active sessions. Admins mark repaired equipment available again; cancelled bookings are not restored.
- Admin changes and booking/session actions have an audit trail. Other members see occupied times but not other users' number plates or emails.

This is a **scheduled booking queue**, not a first-come walk-in waitlist. It records sessions; it does not switch physical chargers, measure kWh, enforce charging cutoffs, process payments or connect to OCPP hardware. The queue refreshes on page reload. No push notifications or automatic no-show expiry are included.

## Verification

```bash
npx playwright install --with-deps chromium
npm run starter:verify
```

The gate uses a disposable local `*_test` PostgreSQL database and the production build. It covers template login/CSRF/ownership/HTMX regression, mobile location setup, role restrictions, booking conflicts and concurrent requests, fault verification/repair, manual sessions and process-restart persistence. GitHub Actions provisions PostgreSQL automatically.

Read `docs/ev-verification.md` for observed results and gaps. Generated browser session state and `.env` must never be committed. `docs/ev-requirements.md` records scope. The inherited `docs/template-verification.md` describes the original starter, not this app's test results.

## Screenshots

Actual automated-browser captures: [mobile](docs/previews/ev-queue-mobile.png) · [desktop](docs/previews/ev-queue-desktop.png). These use disposable synthetic data.

## Deployment

Use `RAILWAY_SETUP.md` for Docker, migration, variable and health settings. Deploy this repository into a separate project/database with fresh secrets. No new hosted service has been provisioned for this app. Production readiness requires the checks and unresolved dependency advisory in `SECURITY.md`, plus your own hosted acceptance and backup/restore rehearsal.
