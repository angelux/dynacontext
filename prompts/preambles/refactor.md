## Task Type Guidance: Refactor / Removal

This task involves removing, replacing, or restructuring a pattern across the codebase. The retrieval pipeline adjusts its priorities accordingly.

### Retrieval Priorities (highest first)

1. **Exhaustive location of the target pattern.** Every occurrence of the pattern must be found. Search across all file types — source code, comments, config files, build scripts, HTML attributes, SCSS/CSS, documentation, test fixtures. Breadth is more important than depth for this task type.
2. **Full file content for complex cases.** When the target pattern is interleaved with other logic in a file, capture the complete file — Assembly needs full context to determine what to keep versus what to remove.
3. **Replacement pattern references.** If the task specifies what replaces the old pattern, capture examples of the replacement pattern already in use elsewhere in the codebase.
4. **Git history for the target pattern.** When the pattern was introduced, which files have been renamed or restructured since. Commands: `git log --all -p -S 'pattern' -- '*.js'`, `git log --oneline --diff-filter=R -- path/`.

### Search Targets

| What to Locate | Why |
|---------------|-----|
| All files containing the target pattern, across all file types | Every occurrence must be found — a missed occurrence means an incomplete refactor |
| Files where the target pattern interacts with other logic | These need full capture for Assembly to understand dependencies |
| Files already using the replacement pattern (if applicable) | Convention reference for the new pattern |
| Config and build files referencing the target pattern | These may need updating alongside source code |
| Test files referencing the target pattern | Tests that assert the old behavior need updating |

### Search Strategy

Start broad, then narrow. The initial search should cover the entire project across all file types:
- `rg -l 'target-pattern'` (all file types, no type filter)
- `rg -l -i 'target-pattern'` (case-insensitive variant)
- `rg -l -e 'variant1' -e 'variant2' -e 'variant3'` (naming variants: camelCase, kebab-case, snake_case, abbreviated forms)

Then narrow by examining match context to distinguish meaningful occurrences from incidental string matches.

### Scope Definition

The target pattern defines the retrieval scope, not a directory or feature area. Every location where the pattern appears — regardless of which part of the codebase it's in — is in scope. This is the only task type where retrieval intentionally spans the full repository rather than focusing on a localized area.

### Completeness Criteria

Retrieval is complete when: (a) a project-wide search for the target pattern and its variants has been executed across all file types, (b) every file containing meaningful occurrences is captured with sufficient context, (c) replacement pattern examples are captured if applicable, and (d) a verification pass confirms no occurrences were missed: `rg -c 'target-pattern'` compared against captured file list.