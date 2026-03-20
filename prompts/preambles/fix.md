## Task Type Guidance: Fix / Regression

This task involves fixing something that's broken or regressed. The retrieval pipeline adjusts its priorities accordingly.

### Retrieval Priorities (highest first)

1. **Referenced diffs.** If a PR, commit, or branch is referenced, the complete diff is the primary evidence. The diff defines the problem. Commands: `git show <commit>`, `git diff <ref1>..<ref2>`, `git log -p --follow -1 -- <file>`.
2. **Full content of modified files.** Every file touched by the referenced diff is captured completely — Assembly needs full file context to understand what broke, not just the changed lines.
3. **One level of call context.** What calls the broken code? What does the broken code depend on? Trace imports and invocations one level outward from the changed files.
4. **Recent git history beyond the referenced change.** Check for subsequent commits to affected files that may have compounded the issue: `git log --oneline -10 -- <file>`.

### Search Targets

| What to Locate | Why |
|---------------|-----|
| Files listed in the referenced diff | These are the primary evidence — every one must be found and fully captured |
| Files that import from or call into modified files | Breakage may propagate through call chains |
| Test files covering the modified area | Tests define expected behavior and may reveal the regression trigger |
| Configuration files referenced in the diff | Build or environment config changes can cause regressions without code changes |

### Scope Definition

The referenced change (diff, PR, commit) defines the center of the retrieval scope. Expansion beyond the changed files extends one level: direct callers and direct dependencies. Broader exploration is warranted only when the referenced change touches shared utilities or configuration that affects multiple areas.

### Completeness Criteria

Retrieval is complete when: (a) the full diff is captured, (b) every file modified in the diff is captured in full, (c) direct callers and dependencies of modified code are identified and captured, and (d) recent git history for affected files is recorded.