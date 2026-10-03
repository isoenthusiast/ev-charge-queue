# Architecture

This template is adapted from the official AdonisJS hypermedia starter downloaded on 3 October 2026 (`adonisjs/starter-kits`, observed upstream archive prefix `8fdf4c0`). The upstream scaffold was converted from SQLite/Alpine to PostgreSQL/HTMX. Exact installed package versions are in package-lock.json.

- AdonisJS 7 with its standard controllers, middleware, providers and Edge integration.
- Lucid migrations and PostgreSQL; schema generation disabled to avoid database-dependent generated types during builds. The initial UserSchema is retained; Note uses explicit model columns.
- NotesService owns record operations. Ownership is part of each database query. Toggle uses an atomic SQL update.
- Session authentication; database session store; secure HTTP-only cookies in production; CSRF on all state-changing web routes.
- Login limiter uses PostgreSQL and a hashed normalized account identifier: ten requests per minute. This is account throttling, not perimeter DDoS protection. Add an IP limiter at a trusted edge when exposed publicly, and configure trusted proxy ranges for the actual host topology.
- No browser database access, no public signup, no API/mobile token guard in this release.
- HTMX is bundled locally through Vite. Eval and response script execution are disabled. Its bundled library still contains eval code, so the bundler emits a warning; the app disables that feature at runtime.
- One production application service plus PostgreSQL. Sessions survive restarts when APP_KEY and the database remain stable.

Optional modules belong in separate releases/profiles after their own tests. Do not pre-install Android, email, queues, storage or payment services.

Official references: https://docs.adonisjs.com/ , https://lucid.adonisjs.com/ , https://htmx.org/docs/ , https://docs.railway.com/ .
