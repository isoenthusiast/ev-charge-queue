# Lessons learnt

## LL-001: Inherited dependency vulnerability and deferred remediation

| Decision field | Record |
| --- | --- |
| Status | **Risk accepted; remediation deferred. Issue remains open.** |
| Accepted by | Edward Wee, project owner |
| Decision date | 4 October 2026 (Asia/Kuala_Lumpur) |
| Scope | This EV charging app and its inherited braces dependency advisory |
| Remediation deadline | Not set by the owner; to be agreed later |

### Problem

The starter inherited a high-severity advisory affecting `braces <=3.0.3`: [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Deeply nested brace patterns can exhaust the JavaScript call stack and, if the error is uncaught, terminate the Node.js process. If attacker-controlled input reaches this path, the app could become unavailable.

The recorded production dependency audit reported 18 high findings tracing to this one underlying advisory through dependent packages, not 18 independent vulnerabilities. The advisory listed no patched version when checked on 4 October 2026 (Malaysia). See [SECURITY.md](../SECURITY.md).

### Root cause

- Technical: the upstream library uses recursive pattern-processing walkers without adequate nesting-depth guards.
- Dependency inheritance: the EV app reused the starter dependency graph, including this transitive library; no new runtime dependency was needed to inherit the risk.
- Assurance gap: functional and restart tests passed, but those tests do not establish security of the dependency graph. The app does not intentionally accept user-controlled glob patterns; runtime reachability from user input has not been exhaustively assessed. No claim of exploitability or non-exploitability in this app has been established.
- Communication lesson: saying only that an advisory is documented does not explain the impact or disposition. Test success, risk acceptance and remediation must be reported separately.

### Owner decision

Edward explicitly acknowledged the issue and accepted the threat for it to be addressed later. Remediation is deferred at his direction; it is not a blocker to continuing development solely on account of this known issue. This records acceptance of the known residual risk and uncertainty, not a fix, a false-positive determination or security certification. It does not accept unrelated vulnerabilities or establish that other deployment checks have passed.

No dependency changes, audit suppression or security-control changes were made as part of this decision. The warning in SECURITY.md remains valid. No automatic monitoring or scheduled remediation has been set up.

### Fix / way forward (deferred)

1. When remediation resumes, rerun the dependency audit and identify every dependency path to `braces`, separating build-time use from deployed runtime use.
2. Trace whether external input can reach vulnerable pattern processing. Record evidence and uncertainty; do not assume that an indirect dependency is harmless.
3. Evaluate a supported upstream patch or compatible parent-package upgrade. If unavailable, assess removing or replacing the affected path, or a reviewed mitigation with regression tests. Avoid blindly applying `npm audit fix --force`, whose recorded proposal involved incompatible or unverified major tooling changes.
4. Verify the chosen treatment with a fresh audit, focused security checks in an isolated test environment, and the full application verification suite.
5. Update this entry and SECURITY.md with versions, evidence and residual risk. Mark the issue resolved only when the treatment is verified; a reachability-based acceptance must remain labelled as acceptance. Feed a reusable fix back to the starter separately.

Suggested review points are a compatible upstream fix, new evidence that the vulnerable path is reachable, dependency changes or broader deployment exposure. These are recommendations, not an agreed deadline or a scheduled task.

### Lesson for future projects

A tested template reduces integration work but also propagates its dependencies and known risks. Carry an explicit problem, root cause, treatment plan and owner decision into each derived app. Keep functional verification separate from security closure.

## LL-002: Explicit approval for private database transport

**Date:** 4 October 2026 (Malaysia). **Status:** Approved configuration applied; deployment verified.

**Problem:** Automatic approval review rejected DB_SSL=false as a potential reduction in database transport security. The first attempted deployment started before required variables were accepted and failed environment validation.

**Root cause:** PostgreSQL TLS and Railway's encrypted private network are separate layers. The deployment configuration had not yet received explicit approval for relying on the private network. Connecting the source before confirming successful variable configuration also allowed an incomplete deployment to start.

**Fix / way forward:** Edward explicitly approved DB_SSL=false solely for this private Railway connection at 06:04 MYT. PostgreSQL has no public endpoint; the app uses the private DATABASE_URL reference. Railway documents encrypted WireGuard traffic within the project environment. Web traffic remains HTTPS. Required variables were applied and the new deployment passed migrations, startup and HTTPS smoke checks. Provision variables and verify success before connecting a source in future deployments.

This approval is specific to this deployment. If the database moves outside the private network or becomes publicly connected, reassess transport and configure certificate-verified PostgreSQL TLS. Do not copy this exception blindly.

Reference: https://docs.railway.com/networking/private-networking/how-it-works

## LL-003: A week of plumbing — standardize the foundation so the agent can develop the product

**Date:** 4 October 2026 (Asia/Kuala_Lumpur). **Status:** Standard-stack direction adopted; repeatable setup remains an improvement to complete and verify.

### Pain / problem

Edward's assessment of the week-long development effort was that too much time went into plumbing before he could use the application. Attention repeatedly moved from product behavior to repository access, environment configuration, database connectivity, migrations, deployment settings, authentication and first-account provisioning.

The final handoff also depended on approval prompts that did not complete on mobile, requiring another attempt on desktop. A running deployment was still not a usable handoff until the account existed and login worked.

The cost was delayed product feedback, repeated troubleshooting, additional agent turns and owner intervention. Progress was difficult to judge because "built", "deployed" and "ready to use" represented different milestones. The week-long duration is the owner's retrospective assessment; no measured breakdown of time or token expenditure is available.

### Root cause

The central process failure was treating the application foundation as something to assemble and troubleshoot during product delivery, rather than a versioned, reusable capability with a proven setup path.

- **Too many integration decisions remained open.** Framework, database, authentication, build and hosting conventions needed to work together. Individually valid components did not establish a working end-to-end system.
- **Deployment configuration was not fully repeatable.** Repository configuration, platform settings and the configuration actually used by a deployment could differ. A successful setting change or local build did not prove the next deployed release used it.
- **Operational access was discovered too late.** Connector capabilities, approval flows and the available account-provisioning mechanism affected whether the agent could finish the handoff, even when application code was ready.
- **The definition of done stopped short of first use.** Health checks proved the service was running; they did not prove the owner could sign in and complete a useful workflow.

These findings explain the integration and handoff friction observed here. They do not imply that every hour of the week had the same cause, or that a framework alone can remove hosting and access constraints.

### Fix / way forward

Adopt a small set of standard framework stacks, with one default for this class of application. Use the existing **TypeScript / AdonisJS / Lucid / PostgreSQL / Edge / HTMX** stack, with one application service and PostgreSQL on Railway. Preserve the documented stack unless a concrete product requirement justifies an exception.

1. **Start from a verified, versioned template.** Pin a reviewed commit, runtime and dependency lockfile. Include supported authentication, validation, migrations, logging, health checks and reproducible build/test commands. Reuse the implementation, not just a list of preferred technologies.
2. **Make deployment and first use part of the starter.** Document and verify required variables, platform settings, migration order, first-account creation and removal of setup credentials. Establish connector access and workable approval paths early.
3. **Prove one small workflow before substantial feature work.** From a fresh project, build, deploy, sign in, save and retrieve a record, and verify persistence after restart. Report each stage separately and record anything blocked.
4. **Give the agent a settled development contract.** Keep architecture, commands and troubleshooting guidance in the starter and AGENTS.md. Use framework features first; focus application work on domain rules, screens and acceptance tests. After two retries without new evidence, collect a targeted diagnostic instead of repeating speculative changes.
5. **Feed reusable fixes back into the template.** Remove project identities and secrets, verify from a fresh clone, then publish a reviewed template revision. Carry known dependency risks and verification limits forward explicitly.

### Success criterion and lesson

A new application should reach a deployed, authenticated first workflow through the documented starter path without rediscovering the same plumbing. Record time to that milestone and the manual interventions required on the next project; use those observations to improve the template.

**Standardize and verify the foundation once, maintain it deliberately, and let the agent spend its effort on the application's behavior.** This entry records the agreed direction, not a claim that all starter automation or hosted acceptance checks are already complete.

Related guidance: [App Starter Pack](../APP_STARTER_PACK.md), [architecture](architecture.md) and [operations](operations.md).
