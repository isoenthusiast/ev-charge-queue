# Operations

## Railway deployment

Docker/HTTPS smoke verified; see ../RAILWAY_SETUP.md for the current platform settings and evidence.

1. Create a new private source repository from this template. Connect the intended Railway account/project only after confirming its identity. Add an app service and PostgreSQL service.
2. Use the supplied Dockerfile. Do not rely on railway.json: new Railway services ignore this deprecated format. Explicitly set the pre-deploy, start, healthcheck and restart settings listed in RAILWAY_SETUP.md. Set `NODE_ENV=production`, `HOST=0.0.0.0`, `LOG_LEVEL=info`, `SESSION_DRIVER=database`, `APP_URL` to the final HTTPS URL, and a fresh stable 32-byte base64 `APP_KEY` generated with a cryptographic random generator.
3. Set `DATABASE_URL` to the database service's private-network reference. Set `DB_SSL` according to that connection's TLS requirements. This configuration never disables certificate verification. Public TLS with a private CA requires configuring the correct trust chain.
4. Railway supplies PORT. The pre-deploy command is `node ace migration:run --force` in the compiled runtime. Do not run migrations in every web process or during image build.
5. Health checking uses `/health/ready`; `/health/live` checks only the process. These are deployment probes, not continuous external uptime monitoring.
6. Create the first account through a secure terminal inside the deployed runtime: `node ace user:create`. For noninteractive setup, the command accepts BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD through the environment. Remove these after use. Never put them in command arguments, Git or logs.
7. Run `npm run starter:smoke -- --base-url https://your-host` from the source directory. Then manually verify login, record changes, cross-user denial and persistence after redeploy on an authorized staging environment before claiming hosted authenticated workflow verification.
8. Enable platform backups, choose retention, and perform an isolated restore rehearsal. Record date, result and recovery duration. None of this is implied by a successful deployment.

Docker runtime is non-root and contains production dependencies. The Docker image was built and executed successfully on Railway. Local Docker Compose execution remains unverified.

## Secrets, proxies and logging

Keep APP_KEY stable. Rotating it invalidates encrypted data/cookies and sessions as applicable. Supply secrets through the host, not build arguments. Never ship `.env` or test browser storageState. The app uses secure cookies in production. Configure Adonis trusted proxy ranges to match the actual trusted network before depending on client IPs or forwarded protocol/host values; do not trust arbitrary public forwarding headers.

Request IDs are enabled. Do not add request-body or credential logging. Set LOG_LEVEL appropriately. Unexpected errors produce generic pages in production; inspect server logs for diagnostics.

## Database lifecycle

Production migration: from the compiled runtime, `node ace migration:run --force`.

Use additive/backward-compatible schema changes when old and new app versions may overlap. Code rollback does not roll back schema. Never run migration reset/fresh or seeds against production. Back up before destructive changes and plan a tested forward recovery or restoration.

The template has no uploads. Add object storage for durable files; the application filesystem is ephemeral on deployment.

Session/rate-limit tables need housekeeping over time. Schedule bounded deletion of expired rows using the installed framework's supported cleanup commands or a reviewed maintenance job. Do not add a scheduler service merely for the initial demonstration. Table expiry units differ: sessions use timestamps; rate_limits uses the limiter's epoch representation—verify before writing cleanup SQL.

## Troubleshooting

- Startup validation error: compare variable names with .env.example; do not print values.
- Database refused: confirm service availability, URL host/port and TLS requirements.
- Missing relation: check pre-deploy migration results and database target.
- Missing assets: build with Vite and deploy the complete compiled output.
- Login/CSRF failures: check HTTPS cookies, stable APP_KEY, persistent session table and page token; never disable protection as a fix.
- Browser tests: install the pinned Chromium build and Linux libraries. Use a free port 3334 and a dedicated local *_test database.
- Two unproductive retries: gather the first relevant error and versions; avoid speculative dependency upgrades.
