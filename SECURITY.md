# Security status

This is a starter, not a security certification or a production acceptance report.

## Known unresolved dependency advisory

As of 3 October 2026 UTC, `npm audit --omit=dev` reports 18 high dependency findings tracing to **braces <=3.0.3**, GHSA-vfj7-8cjw-p6xm (CVE-2026-93687). GitHub lists no patched version. The reported issue is stack exhaustion from deeply nested brace patterns. Dependency findings are not 18 independent vulnerabilities.

Reference: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

Do not use `npm audit fix --force`: its suggested older major framework/tooling versions are not an established compatible repair. Review supported upstream remediation and rerun the full verification gate before promotion. Application code does not intentionally accept user-controlled glob patterns; transitive runtime reachability has not been exhaustively proven. Functional tests do not establish non-exploitability.

## Deployment responsibilities

Generate fresh secrets for each app, keep APP_KEY stable on redeploy, use private database networking and backups, and perform staging authentication/restart and restore acceptance. Local/CI example database passwords are intentionally public and must never be used for hosting.

Do not commit .env files, database dumps, browser storage state, tokens or private logs. Do not post credentials or sensitive exploit details in public issues. Use GitHub private vulnerability reporting if enabled; otherwise request a private reporting channel without disclosing sensitive details.
