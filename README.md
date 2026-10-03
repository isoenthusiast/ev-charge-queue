# Ed App Starter

A reusable web application foundation: AdonisJS 7, TypeScript, PostgreSQL, Edge and HTMX. Version 0.1.0.

**Status: reusable starter with a known dependency advisory; review SECURITY.md before production use.** Original runtime passed local/CI tests and Railway Docker/HTTPS smoke checks. See `docs/template-verification.md` for the exact tested scope.

## Beginner walkthrough

Start with [the deployment guide](docs/BEGINNER_DEPLOYMENT.md), [agent prompt](docs/AGENT_DEPLOYMENT_PROMPT.md) and [visual walkthrough](docs/deployment-guide.svg).

## Start a new app

Use **Use this template** in https://github.com/isoenthusiast/ed-app-starter-public to create a new private project. Read RAILWAY_SETUP.md before deploying. Do not copy another app's `.env`, database, Git remote or Railway bindings.

Requirements: Node **24.19.0**, npm **11.9.0**, and PostgreSQL **18.4** (Docker Compose is one option). Browser tests use Playwright **1.56.1**, pinned because its browser distribution was accessible in the verification environment.

```bash
npm ci
npm run starter:init -- --name my-app
docker compose up -d
npm run db:migrate
npm run user:create
npm run dev
```

Open http://localhost:3333. The account command prompts for your email and password. There is no public signup or default account. Docker creates `starter_dev` and `starter_test` with local-only example credentials from `compose.yaml`; use independently generated credentials on any hosted environment. If Docker is unavailable, create those databases on a local PostgreSQL server and configure `.env` accordingly. Compose init scripts run only on a new volume.

`starter:init` generates `.env` only if missing and preserves existing secrets. It updates the app name in package metadata. `APP_KEY` must stay stable across production redeploys. The initialization command does not install dependencies, create databases or provision hosting.

## Verify the foundation

```bash
npx playwright install chromium
npm run starter:verify
```

On Linux, Playwright may also require OS browser libraries (`npx playwright install --with-deps chromium` on a supported machine). The suite compiles the app, migrates the dedicated test database, creates temporary accounts, runs Chromium against the production build, restarts it and verifies the saved session and record. It runs serially on port 3334; do not run two copies concurrently on that port.

`TEST_DATABASE_URL` must target a local database ending in `_test`, with a different name from the development database. The runner never truncates the database; it deletes only its generated users and their notes. It leaves schema, anonymous sessions and rate-limit rows in the dedicated test database. Use a disposable database in CI. Screenshot and browser-session evidence in `artifacts/` is private test output and must not be committed or published.

## Commands

| Command                                                 | Purpose                                                 |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `npm run dev`                                           | Development app and Vite                                |
| `npm run build`                                         | Compile server and web assets into `build/`             |
| `npm start`                                             | Run compiled server; runtime variables must be supplied |
| `npm run db:migrate`                                    | Apply development migrations                            |
| `npm run user:create`                                   | Create an account interactively                         |
| `npm run typecheck` / `npm run lint`                    | Static checks                                           |
| `npm test`                                              | Browser/database tests against an existing build        |
| `npm run starter:verify`                                | Typecheck, lint, build, browser/database/restart checks |
| `npm run starter:smoke -- --base-url https://your-host` | Read-only HTTP checks on a supplied host                |

The deployed smoke command checks health, login rendering and private-route redirect only. It does not claim authenticated remote verification. The full mutation suite intentionally refuses remote databases.

## What is included

- Private session login, administrator account creation and database-backed login throttling.
- PostgreSQL-backed sessions, CSRF protection and escaped server templates.
- A small Notes example demonstrating list/create/complete/delete and ownership enforcement.
- HTMX partial updates, loading/error states and server-side validation.
- Health endpoints, database migrations, production Dockerfile, Railway configuration and CI.
- One backend application, one database, no Redis or separate frontend service.

## What you build next

Replace the Notes example with the first real business workflow, retaining the infrastructure and extending its tests. Authentication is not a complete account-management product: password reset, email verification, SSO, audit trails, roles and tenancy are deliberate future features when required.

Android, mobile token authentication and OpenAPI are not implemented in this web-only release. The accompanying `APP_STARTER_PACK.md` explains the optional Android path. Adding mobile should reuse backend services and include separate contract/client tests.

Read `docs/operations.md` before hosting. `AGENTS.md` tells a coding agent how to work within this template.

## License and security

MIT; see LICENSE and THIRD_PARTY_NOTICES.md. Read SECURITY.md for the known unresolved advisory. Public source includes no hosted credentials or live infrastructure bindings.
