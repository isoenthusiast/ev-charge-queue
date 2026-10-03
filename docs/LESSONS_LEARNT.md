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
