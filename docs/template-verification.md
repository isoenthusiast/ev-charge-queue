# Template verification — v0.1.0

Local verification: 3 October 2026. Railway/CI verification completed 4 October 2026 (Malaysia). Status: **verified_local_ci_railway_smoke**. See ../RAILWAY_SETUP.md.

Runtime application source is unchanged from the internally verified template. Public packaging changes remove deployment identifiers, logs and obsolete configuration, and add license/security documentation. Prior evidence is summarized below; it is not a claim that this public repository has itself been deployed.

## Observed results

| Check | Result |
| --- | --- |
| Clean extraction without node_modules, build, generated indexes or .env | PASS |
| npm ci from committed lockfile | PASS |
| Fresh initialization and repeat without secret rotation | PASS |
| Unsafe remote/non-test database target refusal | PASS |
| TypeScript check and ESLint | PASS |
| Production server and Vite asset build | PASS |
| Build with no .env or database secrets | PASS |
| All four migrations against empty PostgreSQL 18.4 | PASS |
| Anonymous private-route redirect and missing public signup | PASS |
| CSRF request rejection | PASS |
| Invalid credentials rejected | PASS |
| Login and HTMX create without full navigation | PASS |
| Server-side invalid title rejection | PASS |
| Other user's record hidden; toggle/delete denied | PASS |
| Own record toggle/delete | PASS |
| Script-like note title rendered as text, not executed | PASS |
| Secure HTTP-only production session cookie | PASS |
| Sign out | PASS |
| Login rate limit | PASS |
| Session and record retained across production process restart | PASS |
| Mobile viewport overflow check and rendered screenshot inspection | PASS |
| Production-only dependency install and migration entrypoint | PASS |
| Production-only HTTP health/login/protected-route smoke | PASS |
| Railway Docker runtime, migrations and read-only HTTPS smoke | PASS |
| Hosted authenticated workflow and session persistence across redeploy | NOT RUN |
| Docker image build and execution on Railway | PASS |
| Local Docker Compose execution | NOT RUN |
| Hosted backup/restore drill | NOT RUN — deployment-specific |
| GitHub Actions execution | PASS — original private template |
| Android / API tokens / OpenAPI | NOT INCLUDED — web-only profile |

Browser suite: five workflow tests plus one restart test, all passing on a fresh copy. Local host: Linux x64, Node 24.19.0, npm 11.9.0; actual PostgreSQL 18.4 binaries in an isolated localhost cluster; Chromium 141 via Playwright 1.56.1. No SQLite substitution or mocked database.

The complete gate was executed using `npm run starter:verify`. Private raw verification logs are not distributed. Production-only installation used `npm ci --omit=dev`, then the compiled migration command and read-only HTTP smoke check. The production-only check exercised the same application behavior; the subsequent session-controller change only replaces named-route lookup with equivalent literal redirect destinations.

Known scope: no password recovery, email verification, roles/tenancy, API/mobile client, file storage, scheduled jobs or external integrations. The login limiter is account-based; perimeter abuse protection and trusted proxy ranges require deployment-specific configuration. The HTMX dependency produces a bundler eval warning; this app explicitly disables HTMX eval and response scripts.

## Exact package versions

- `@adonisjs/core`: 7.5.2
- `@adonisjs/lucid`: 22.4.2
- `@adonisjs/auth`: 10.1.0
- `@adonisjs/session`: 8.1.0
- `@adonisjs/limiter`: 3.0.1
- `htmx.org`: 2.0.11
- `pg`: 8.23.1
- `typescript`: 6.0.3
- `@playwright/test`: 1.56.1

## Dependency audit

The production dependency audit returned 18 high findings tracing to the braces <=3.0.3 stack-exhaustion advisory. The suggested automatic fix includes a major assembler version change and was not blindly applied. Review reachability and a supported dependency fix before production promotion. Functional test success is not a security certification.
