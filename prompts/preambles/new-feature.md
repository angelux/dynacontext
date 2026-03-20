## Task Type Guidance: New Feature

This task involves building something new. The retrieval pipeline adjusts its priorities accordingly.

### Retrieval Priorities (highest first)

1. **Pattern reference files.** Existing files most similar to what needs to be built. Assembly needs complete reference implementations to establish the conventions the new feature should follow. Locate the closest analogues and capture them in full.
2. **Integration points.** Files that will need modification to incorporate the new feature — routes, registrations, navigation, index files, barrel exports, configuration.
3. **Build pipeline configuration.** How will the new files be built, bundled, or served? Capture build config, bundler config, and any file-type-specific processing setup.
4. **Shared utilities and types.** Libraries, helpers, type definitions, and shared components the new feature will likely import from.

### Search Targets

| What to Locate | Why |
|---------------|-----|
| Files implementing the most similar existing feature | Primary convention reference for Assembly |
| Registration and routing files where the new feature hooks in | Integration points that need modification |
| Build and bundler configuration | Determines how new files are processed |
| Shared type definitions, utilities, and components in the feature's area | Dependencies the new feature will import |
| Directory structure of the area where the feature will live | Establishes naming and organization conventions |

### Scope Definition

The area where the new feature will live — and the closest existing analogue — define the retrieval scope. Expansion covers: integration points (routes, config, registrations), shared dependencies the feature will use, and build configuration for the relevant file types. Unrelated feature areas are outside scope.

### Completeness Criteria

Retrieval is complete when: (a) at least one complete reference implementation of a similar feature is captured, (b) all integration points where the new feature hooks into the system are identified and captured, (c) build and config files for the relevant area are captured, and (d) shared utilities and types the feature will depend on are identified.