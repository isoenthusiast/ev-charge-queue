# Railway setup and verification

## Reuse this template

Repository: https://github.com/isoenthusiast/ed-app-starter-public

Use GitHub **Use this template** to create a separate private repository. Read APP_STARTER_PACK.md, initialize a fresh app name and secrets, and provision a separate Railway project and database. Never reuse this verification database or its credentials.

## Required deployment settings

New Railway services do not read the deprecated railway.json file. Apply the following through Railway service settings or a supported connector, then inspect the effective settings. Current Railway IaC (.railway/railway.ts) is an optional alternative requiring CLI plan/apply; merely committing that file does not apply it.

| Setting | Value |
| --- | --- |
| Build | Dockerfile at repository root |
| Pre-deploy | node ace migration:run --force |
| Start | node bin/server.js |
| Healthcheck | /health/ready |
| Healthcheck timeout | 120 seconds |
| Restart | ON_FAILURE, maximum 3 retries |
| Container port | 3333; public domain target must match |

Add PostgreSQL with a persistent volume and use its private DATABASE_URL reference. The observed Railway template uses ghcr.io/railwayapp-templates/postgres-ssl:18 with its volume at /var/lib/postgresql/data. Confirm the actual database version and volume settings for each new app.

Set NODE_ENV=production, HOST=0.0.0.0, PORT=3333, LOG_LEVEL=info, SESSION_DRIVER=database, APP_URL=https://your-domain, a fresh stable cryptographically generated APP_KEY, and DATABASE_URL=${{Postgres.DATABASE_URL}}. Keep secret values only in Railway. Configure TLS based on the selected connection; never disable certificate verification as a workaround.

After settings change, trigger a **new deployment using the current service configuration**. Replaying an earlier deployment may retain its old configuration. Verify migration execution and call the endpoints, even if Railway says Online. A missing sessions relation means migrations were not applied to the target database.

Create the first private account with node ace user:create in a secure runtime terminal. No default credentials or public registration are included. Run the read-only smoke command from README, then perform authenticated staging acceptance before real users.

## Verification scope

The original runtime passed a Railway Docker build, migrations and read-only HTTPS checks on 3 October 2026 UTC. Private infrastructure identifiers and logs are deliberately excluded. This public copy is not connected to a live service. Provision and verify your own deployment.

Hosted authenticated operations and session survival across Railway redeployment, backup restoration and local Docker Compose execution were not tested. Local/CI production-build authenticated and restart tests passed. Android/API token support is not included.

See SECURITY.md for the unresolved dependency advisory and docs/template-verification.md for the exact test scope.

Platform reference: https://docs.railway.com/infrastructure-as-code#migrating-from-config-as-code
