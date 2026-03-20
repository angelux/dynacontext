# Retrieval Step 2 — Structural Map

**Contains:** Directory inventories, file size measurements, and configuration file contents for task-relevant areas. This step had unique access to the complete repository file listing — structural information surfaced here may include files and directories that no search pattern in Step 1 matched.

**Content categories:**
- **Directory inventories** — what files exist in task-relevant directories
- **File sizes** — line counts for files Step 3 will need to capture
- **Configuration reads** — contents of build, manifest, and tooling config files

**Does not contain:** Source code content or code excerpts. Source code capture is Step 3's scope.

**Downstream consumers:** Step 3 uses file sizes from this step to decide between full and partial capture. Step 4 uses directory inventories to identify coverage gaps. Assembly uses configuration contents and structural context as part of the complete retrieval package.

Content appears in execution order, not logical order. Each entry is a command, its justification, and its raw output.

---
