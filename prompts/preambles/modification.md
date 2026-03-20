## Task Type Guidance: Modification

This task involves changing existing functionality. The retrieval pipeline adjusts its priorities accordingly.

### Retrieval Priorities (highest first)

1. **Current implementation — complete files.** Capture the full content of every file in the component or feature being modified. Assembly needs the entire current state to understand what exists before changing it.
2. **Consumers and dependents.** Other code that uses the thing being modified — imports, function calls, references, type consumers. Changes to an interface affect everything that calls it. Commands: `rg -l 'functionName' src/`, `rg -n '^import.*from.*module' src/`.
3. **Test coverage.** Tests for the modified functionality define expected behavior. They either need updating or serve as verification after the change.
4. **Related configuration.** Build config, environment variables, feature flags, or registration files that may need corresponding changes.

### Search Targets

| What to Locate | Why |
|---------------|-----|
| All files in the component/feature being modified | Full current state is the baseline for modification |
| Files that import from or reference the modified component | These may break or need updates when the interface changes |
| Test files covering the modified functionality | Define current expected behavior |
| Config, build, and registration files for the affected area | Modifications may require config-level changes |

### Scope Definition

The component or feature being modified defines the center of the retrieval scope. Expansion covers: all consumers of the modified interface (one level out), tests for the modified area, and configuration that governs the modified component's behavior. Sibling features that share no interface with the modification are outside scope.

### Completeness Criteria

Retrieval is complete when: (a) every file in the modified component is captured in full, (b) all consumers of the modified interface are identified and captured, (c) relevant tests are captured, and (d) configuration files governing the modified area are captured.