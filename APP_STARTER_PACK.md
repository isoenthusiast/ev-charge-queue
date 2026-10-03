# App Starter Pack

Version: 1.1 · Prepared: 3 October 2026

## How to use this file

Attach this file to a coding agent or place it in the project root. Say:

> Read APP_STARTER_PACK.md and use it to set up this project. My app idea is: [describe the app]. Implement and verify the foundation, then report what works and what remains blocked.

This is an executable project brief for an agent, not an installer or a guarantee of production readiness. Its default fits database-backed business applications, portals and APIs. Use the decision rules below for other applications. An agent needs actual terminal, filesystem and deployment access to perform setup; a chat-only agent must provide a concrete handoff and never claim to have run commands.

## 1. Objective and working rules

Reduce repeated infrastructure work, integration failures and AI token consumption. Prefer established framework features, a small dependency set, reproducible commands and a foundation that can be reused.

- Follow the user's current requirements and applicable repository instructions. Treat the stack below as a default, not a mandate overriding those instructions.
- Inspect the existing project before changing it. Preserve working architecture and user changes. Do not rewrite an existing app just to match this file.
- Proceed with reversible setup within the authorized scope. Ask only about missing decisions that materially change the architecture, or actions requiring authorization.
- Never assume that this file alone authorizes paid provisioning, public deployment, changes to existing production systems or destructive database operations. Use the actual task's authorization and platform controls.
- If a credential or external service is unavailable, finish independent local work and deployment configuration. Clearly identify the blocked step.
- Use official documentation matching the installed major version. Verify current compatibility before choosing versions; do not combine examples from different releases.
- Keep implementation simple. One application and one PostgreSQL database are the starting point. Add services only for a demonstrated requirement.

## 2. Project inputs

Infer answers from the task and repository where possible. The user need only supply the app idea. Record defaults and assumptions in the project README.

| Input                                 | Default when unspecified                                                |
| ------------------------------------- | ----------------------------------------------------------------------- |
| App purpose and first useful workflow | Derive from the user's description; ask if absent                       |
| Existing or new project               | Inspect the working directory and Git state                             |
| Client                                | Responsive web application                                              |
| Backend                               | TypeScript with AdonisJS                                                |
| Database                              | PostgreSQL with Lucid                                                   |
| Web interface                         | Edge templates with HTMX                                                |
| Hosting target                        | Railway; prepare configuration, provision/deploy when authorized        |
| Accounts                              | Private application with login; no public registration unless requested |
| Users and permissions                 | Minimal ownership-based access; add roles only when needed              |
| Tenancy                               | Single organization; ask if separate customer organizations are implied |
| Android                               | Add only if requested; Kotlin with Jetpack Compose                      |
| Offline operation                     | Not assumed; clarify when the use case requires it                      |
| Integrations                          | None until needed by a workflow                                         |
| Test environment                      | Separate disposable PostgreSQL database                                 |

For a public informational site, do not add accounts or a database without a reason. If sensitive data, regulated use or special availability requirements are explicitly part of the task, incorporate the actual requirements before deployment.

## 3. Choose the smallest suitable stack

### Default: business web application

Use AdonisJS, TypeScript strict checking, PostgreSQL, Lucid, Edge and HTMX. Use the framework's supported validation, authentication, authorization, logging and testing integrations. Preserve its standard directory conventions.

Use one package manager. Preserve an existing lockfile; for a new project prefer npm unless the chosen official starter requires another manager. Commit the lockfile and use reproducible installs in CI.

Use a stable Node.js release supported by the selected AdonisJS version. Pin the runtime and package-manager versions consistently across development, CI and deployment. Select compatible maintained releases at setup time rather than treating this file as a list of current version numbers.

### Conditional choices

| Situation                                                      | Action                                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Existing working stack                                         | Improve its setup; do not migrate automatically                                                       |
| API-only application or Android-first product                  | AdonisJS API configuration remains the default; omit unused web templates                             |
| Strong requirement for NestJS architecture or its integrations | Evaluate NestJS; explain the concrete benefit and extra integrations before switching                 |
| Rich browser-side interaction or offline web editing dominates | Evaluate React/Vue or an appropriate client framework; do not force HTMX                              |
| Android-only application with no shared server data            | Kotlin/Compose; omit backend and Railway unless needed                                                |
| Static website                                                 | Static tooling; omit the application backend and database                                             |
| Game, embedded device, desktop app or unusual compute workload | Select suitable tooling for that workload; preserve these reproducibility and verification principles |

Do not add a second ORM, custom authentication engine, microservices, Kubernetes, Redis, GraphQL or a separate frontend deployment speculatively. A concrete requirement can justify any of them; document it first.

## 4. Architecture contract

Keep controllers thin. Put reusable business rules in application services using ordinary framework conventions; do not invent a generic framework inside the framework.

- Web routes return Edge pages or HTML fragments for HTMX.
- Mobile/API routes return explicit JSON response objects.
- Both routes call shared business services and enforce equivalent authorization.
- Use Lucid for database access and migrations. Use database constraints and transactions to protect business invariants.
- Clients communicate with the backend over HTTPS. Never put PostgreSQL credentials in a browser or Android application.
- Do not serialize database models indiscriminately into API responses; select intended fields.
- Do not create a duplicate JSON API for every web screen unless there is a real API consumer.

For Android or external clients, define the API contract with OpenAPI using tooling verified compatible with the selected framework version. Include requests, responses, authentication and error shapes. Do not assume AdonisJS includes a built-in OpenAPI generator. Generate a Kotlin client when a tested generator simplifies the project; otherwise use one small typed HTTP client and contract tests.

## 5. Setup sequence — execute, do not merely propose

### A. Inspect and record

1. Read repository guidance, manifests, lockfiles, scripts and deployment configuration. Inspect Git status before editing.
2. Check available Node, package manager, Git, PostgreSQL/Docker and, when requested, Android tooling. Do not install or upgrade unrelated global tools.
3. Identify the current hosting project/environment when provided. Never guess a Railway account, project or service from a familiar name.
4. Record the selected stack and versions, short rationale, assumptions and documentation links in `docs/architecture.md`.

### B. Establish the local foundation

1. Use the selected version's official starter/generator. Follow its supported setup path and retain its structure.
2. Configure TypeScript, formatting, linting and framework-supported tests.
3. Configure PostgreSQL and Lucid. Prefer one `DATABASE_URL` convention, adapting to the framework's supported configuration.
4. Provide a pinned local PostgreSQL container through Compose when Docker is available. Otherwise use an accessible development PostgreSQL instance and document the exact setup. Do not silently substitute SQLite.
5. Create a secret-free `.env.example` and validate required environment variables at startup.
6. Generate local secrets securely. Ignore real `.env` files, credentials and build output. Never print secret values in reports or logs.
7. Implement the minimum required login and access policy using supported framework mechanisms.
8. Implement one small vertical slice from the user's domain: authenticate if needed, validate input, save a record and retrieve/display it.
9. Verify the production build locally. A successful development server alone is insufficient.

### C. Prepare and, when authorized, verify Railway deployment

Read RAILWAY_SETUP.md. New Railway services ignore legacy railway.json; explicitly configure migration, start and health settings through the platform, or plan/apply current Railway IaC. Never assume committing configuration applies it.

1. Start with one application service and one PostgreSQL service. Use Railway's private database connection for service-to-service traffic where supported.
2. Choose one build strategy: Railway's supported builder or a straightforward Dockerfile. Do not maintain competing production build paths without a reason.
3. Set the correct root directory, build command and production start command for the actual generated project. Verify that compiled output, templates and static assets are included.
4. Bind to `0.0.0.0` and Railway's provided port. Configure trusted proxy behavior and secure cookies for the deployment topology.
5. Supply runtime variables through the platform. Keep application encryption/signing keys stable across redeploys; do not generate them during every build.
6. Run migrations once through a supported pre-deploy/release mechanism. Verify that the built artifact contains the required migration tooling. Never run destructive reset or development seed commands in production.
7. Provide a lightweight liveness endpoint and a readiness endpoint that checks database connectivity without exposing internals. Configure deployment health checking appropriately; external uptime monitoring is a separate concern.
8. Keep sessions durable across restarts using a supported persistent store, preferably PostgreSQL when supported. If the selected version cannot support this simply, document the smallest supported alternative rather than inventing a session backend.
9. Store user uploads in durable object storage when uploads are required. Do not rely on an ephemeral application filesystem.
10. Configure available database backups and document retention and restore steps. Test a restore into an isolated environment when access allows. Do not claim restoration is verified until performed.
11. When deployment is authorized and accessible, verify the vertical slice on the deployed application and after a restart/redeploy. If blocked, mark deployment as unverified and give exact remaining steps.

Ship the foundation early, before substantial feature work. Separate staging and production data when those environments are introduced. A code rollback does not automatically undo a database migration; prefer backward-compatible schema changes and document recovery.

## 6. Authentication, validation and web behavior

- Web: framework-supported sessions, secure/HTTP-only cookies in production and CSRF protection for state-changing requests, including HTMX requests.
- Mobile: framework-supported access tokens over HTTPS, with expiry/revocation and logout behavior defined. Never invent JWT/refresh-token machinery merely because the client is mobile.
- Apply server-side validation and authorization on every protected operation. Hiding UI controls is insufficient.
- Test record ownership and tenant boundaries when applicable. Never accept an owner/tenant ID from the client without checking authority.
- Keep template escaping enabled for untrusted content. Return useful validation messages and generic unexpected-error responses.
- Define HTMX handling for validation failures, expired sessions, loading indicators and failed requests. Verify response status codes and swap behavior against the selected HTMX version.
- Rate-limit exposed authentication endpoints using supported tooling. Keep logs free of passwords, tokens and sensitive request bodies.
- Prefer same-origin web hosting. Configure CORS only for actual browser origins that require it; native Android traffic does not require browser CORS allowances.

## 7. Optional Android module

Only create this module when Android development is requested.

- Use Kotlin, Jetpack Compose, ViewModels and coroutines with lifecycle-aware state handling.
- Choose one supported HTTP client, such as Retrofit/OkHttp or Ktor Client; do not include both by default.
- Pin compatible Kotlin, Android Gradle Plugin, Gradle, JDK and Compose tooling. Commit the Gradle wrapper and dependency version catalog.
- Use build-specific API base URLs. Explain emulator/device access to the development server and enforce HTTPS in release builds.
- Handle login expiry, logout, cancellation, timeouts and error states. Use appropriate platform-backed protection for locally stored credentials; never hardcode server secrets.
- Add Room only when local persistence is needed; add WorkManager only for durable background work. Offline sync requires explicit conflict and retry rules.
- Build the debug application and exercise one end-to-end flow if an emulator/device is available. Report separately what was built and what was actually run.
- Keep signing credentials outside the repository. Prepare release signing only when requested.

Android adds another build and release pipeline. Do not create it merely to make the starter look complete.

## 7A. Reusable starter repository — the preferred bootstrap path

This Markdown file defines the procedure. A separate Git template repository holds the actual working application foundation, locked dependencies, scripts and tests. Together they form the starter pack.

**Registered template:** https://github.com/isoenthusiast/ed-app-starter-public (public GitHub template). This sanitized copy preserves the internally verified runtime. Consult docs/template-verification.md, RAILWAY_SETUP.md and SECURITY.md for evidence and limits. Hosted authenticated workflows, backup/restore and Android are not verified.

### Template registry

The owner or the first-build agent fills this in after verification. Placeholders are not destinations or credentials.

```yaml
starter:
  repository_url: null
  release_tag: null # No remote Git release published
  commit_sha: null
  profile: adonis-postgres-htmx
  status: verified_local_only
  local_source: this_directory
  template_version: 0.1.0
  verified_on: 2026-10-03
  evidence_path: docs/template-verification.md
  deployment_target: railway
  android_template: null
```

Pin a reviewed release to its exact commit. Do not silently use a moving main branch or upgrade all dependencies on every new app. A release tag alone can move; retain its commit SHA. If the pinned version is no longer supported or has a relevant unresolved vulnerability, explain and update/reverify the template before reuse.

### Route 1: a verified template is registered

Use this before section 5's generator-based setup for a NEW project:

1. Resolve the registered repository, release and commit. Inspect its README, license, scripts and verification evidence before running it. Verify access and compatibility with the requested app.
2. Instantiate a new independent project from the pinned source. Retain template attribution/provenance, but use the new app's repository and deployment identity. Preserve history only if the owner requests that model.
3. Run the template's documented initialization command with the new app name and profile. It must detect an existing project and avoid overwriting it; rerunning must not rotate existing secrets or recreate remote resources.
4. Generate fresh secrets and configure separate development/test databases. Set actual environment values through appropriate secret mechanisms.
5. Remove or replace template-specific domains, repository remotes, OAuth callbacks, account IDs, project IDs, service IDs and telemetry destinations. No previous app's credentials, users or data may carry over.
6. Run the template's verification command on this fresh instance. An old template verification report is not evidence that the new instance works.
7. Prepare new Railway bindings. Provision/deploy only within the actual task's authorization; run the deployed smoke test when possible.
8. Record the template commit and the new verification results in this app. Continue with the user's first domain workflow, reusing the established infrastructure.

If only infrastructure credentials are missing, leave a verified local instance and exact deployment steps. If the template is inaccessible, report that and use the official starter path when appropriate; do not claim the template was used.

### Route 2: no verified template exists yet

Build the foundation using sections 3–9, then prepare a reusable template from it within the requested scope. Keep the reusable core small:

- Default web stack with a working login and ownership-protected sample record flow.
- PostgreSQL migrations, isolated integration tests and a browser smoke test.
- Environment validation, health endpoints, logging and production build configuration.
- Railway deployment settings, explicit migration step and operations instructions.
- One initialization script and one verification script with documented inputs.
- CI that runs the same verification procedure using disposable PostgreSQL.

Use generic sample data. Keep the business-specific workflow outside the reusable core. Keep Android as a separate optional companion until its build and API integration are independently verified; do not burden every web project with Android dependencies.

Prepare the repository locally if remote repository creation is unavailable or not authorized. Do not invent a repository URL, release or successful Railway deployment. Once publication is authorized, publish it as a private Git template repository by default, unless the user chooses a different audience.

### Required template interface

Implement these scripts or document equivalent commands; script names below are a desired interface, not claims that they already exist:

| Interface                                   | Required behavior                                                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run starter:init -- --name <app-name>` | Validate the name, configure safe app metadata and initialize missing local configuration; never overwrite existing secrets or provision paid services implicitly |
| `npm run starter:verify`                    | Run typecheck, lint, integration tests and production build; exit nonzero on failure and refuse an unsafe test database                                           |
| `npm run starter:smoke -- --base-url <url>` | Exercise health and the authenticated record flow against an explicitly designated test/staging environment; isolate and clean up only its own test records       |
| `docs/template-verification.md`             | Record commit, versions, commands, dates, environment and observed results; identify local-only or deployment gaps                                                |
| `starter-manifest.json`                     | Record template identifier/release, toolchain versions and capability profile without secrets or live infrastructure bindings                                     |

The initialization script must be idempotent, validate inputs and keep generated secrets out of console output. The smoke test must receive test credentials through a safe mechanism, never command-line arguments or committed files. Do not run mutation smoke tests against production without explicit authorization for the test scope.

### When the template earns “proven” status

Require evidence from a clean clone, not just the author's working directory:

1. Install using the committed lockfile and pinned runtime.
2. Initialize a new app against empty, isolated PostgreSQL databases.
3. Pass the verification suite and the critical browser flow.
4. Start the production build and pass its smoke test.
5. Deploy that source to an authorized disposable/staging Railway environment and repeat the smoke test.
6. Restart/redeploy and verify durable records and the intended session behavior.
7. Verify a migration from the previous template schema when releasing an upgrade that changes it.
8. Confirm the template contains no real credentials, user data or active deployment bindings.

Use status `verified_local_only` if deployment remains untested, and `verified_local_and_railway` only after both succeed. Record backup/restore verification separately; it is environment-specific. Evidence must identify the tested commit. A proven template is verified for a stated scope and date, not universally certified for every app.

### Template maintenance

Fix common plumbing in the template, test it, then publish a new pinned release. New apps use that release; existing apps receive reviewed patches or dependency updates, not blind template overwrites. Re-run the verification gate after runtime, framework, database, authentication or deployment changes. Keep a short changelog and upgrade notes. Avoid unrelated template maintenance during a feature task unless it is necessary to unblock the app.

Once a repository is available, the user's normal invocation becomes:

> Read APP_STARTER_PACK.md. Create [app name] from the registered verified template. The first workflow is [workflow]. Verify the foundation and prepare Railway deployment. [State whether deployment is authorized.]

## 8. Jobs, files and integrations — add on demand

When a feature needs background work, choose a maintained queue integration compatible with the installed framework. Define retries, timeouts and idempotency for side effects. Add its worker service and required storage only then. Do not imply every queue package is stable or bundled with AdonisJS.

For file uploads, email, payments or notifications, integrate one provider at a time and prove a small flow. Use test/sandbox modes where available. Distinguish simulated integrations from real delivery. Avoid adding integration scaffolding that no current feature uses.

## 9. Meaningful verification gate

Use the framework's standard test runner and PostgreSQL for database integration tests. Add browser automation, such as Playwright, for the critical web flow when feasible. Keep tests focused on behavior and remaining risks.

Before declaring the foundation complete, verify:

- Reproducible dependency install, type checking, linting, tests and production build.
- Migrations create the schema on an empty disposable database; upgrades are tested when an existing schema changes.
- The test runner cannot accidentally reset or write to production data.
- The vertical slice persists and retrieves data correctly.
- Invalid input fails cleanly; unauthorized users cannot access another user's protected records.
- Web session/CSRF behavior or API token behavior works for the selected client.
- Startup fails clearly for missing required configuration; logs identify failures without secrets.
- The deployed flow and post-restart persistence work, if deployment was performed.
- Android build and API integration work, if Android is in scope and the tools are available.

Mark each result PASS, FAIL, BLOCKED or NOT APPLICABLE. A local pass is not a deployment pass. State limitations instead of fabricating evidence. Stop repeating checks once the relevant gate passes unless the code changes or new evidence requires it.

## 10. Files to leave behind in the app repository

Create only those relevant to the selected profile:

| File                                | Contents                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `README.md`                         | Quick start, assumptions, local commands and links to detailed docs             |
| `.env.example`                      | Variable names, safe examples and required/optional explanations                |
| Runtime pin and dependency lockfile | Exact reproducible toolchain/dependency choices                                 |
| `compose.yaml`                      | Local PostgreSQL service when Docker is used                                    |
| Deployment configuration            | Verified Railway build/start/migration/health settings                          |
| `docs/architecture.md`              | Stack decisions, versions and module boundaries                                 |
| `docs/operations.md`                | Deployment, migrations, backups, restore, rollback and diagnostics              |
| `docs/setup-status.md`              | Verification results, blockers and next concrete action                         |
| API contract                        | OpenAPI document or reproducible generation setup when there is an API consumer |
| CI workflow                         | Reproducible checks using isolated test data, when a CI provider is available   |

Document exact commands for install, dev, build, start, typecheck, lint, test, migrate and test-database setup. Adapt commands to the actual version; never leave guessed commands masquerading as verified ones.

If the repository uses `AGENTS.md`, add a concise project-specific pointer to the architecture and operations documents while preserving existing instructions. Do not copy this entire pack into every file or overwrite other agent guidance.

## 11. Token-saving maintenance discipline

- Treat the chosen stack and repository documentation as settled decisions until a concrete need changes them.
- Before writing custom plumbing, check whether the installed framework provides it.
- Before adding a dependency, state the requirement it solves and whether it adds a runtime service.
- Diagnose failures from the first relevant error, logs, configuration names and installed versions. Change one underlying cause at a time.
- After two attempts without new evidence, stop speculative patching and gather a targeted diagnostic. Do not repeatedly reinstall or swap frameworks.
- Never solve TLS failures by disabling certificate verification or authentication failures by removing access checks.
- Keep progress notes short and actionable. Record decisions and exact recovery steps rather than large transcripts.
- Reuse the verified repository as a future starter only after removing project-specific data, secrets and infrastructure bindings. Validate a fresh clone before calling it reusable.

## 12. Final handoff format

Report briefly:

1. Selected profile and stack, including exact versions.
2. What was created and the first workflow that works.
3. Exact local start command and deployed URL, if actually deployed.
4. Checks passed, failed or blocked, with important limitations.
5. External services provisioned or still needed; no invented cost estimates.
6. The next useful feature to implement.

Do not call the application production-ready solely because it builds or deploys. Describe the tested scope precisely.

## Official references to verify at setup time

These are starting points, not substitutes for documentation matching the selected release.

- AdonisJS: https://docs.adonisjs.com/
- AdonisJS stacks: https://docs.adonisjs.com/stacks-and-starter-kits
- Lucid: https://lucid.adonisjs.com/docs/introduction
- HTMX: https://htmx.org/docs/
- Railway: https://docs.railway.com/
- Railway pre-deploy: https://docs.railway.com/deployments/pre-deploy-command
- Railway backups: https://docs.railway.com/volumes/backups
- Android architecture: https://developer.android.com/topic/architecture/recommendations
- NestJS, if selected: https://docs.nestjs.com/
