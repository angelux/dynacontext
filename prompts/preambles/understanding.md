## Task Type Guidance: Understanding

This task is about explaining how something works, not building or fixing. The retrieval output feeds an explanatory document for a human reader.

### Retrieval Priorities (highest first)

1. **Mechanism-revealing files.** Files that show how the thing works — definitions, core logic, primary implementations. Prioritize these over files that merely reference or consume the mechanism.
2. **Connection and wiring.** Configuration files, registration points, import chains, and routing that show how the pieces connect to each other. Understanding a system means understanding its integration.
3. **Entry points and flow.** Where does execution begin? What triggers the mechanism? Trace the path from trigger to outcome.
4. **Boundary files.** Where does this system interact with other systems? Interfaces, API contracts, shared types, event boundaries.

### Search Targets

| What to Locate | Why |
|---------------|-----|
| Files where the concept is defined and implemented | Core mechanism — the primary evidence for explanation |
| Files that configure, register, or wire the concept into the system | Shows how it connects to everything else |
| Entry points and trigger paths | Shows what initiates the mechanism |
| Type definitions, interfaces, and contracts | Shows the system's boundaries and expectations |
| Files that consume or depend on the concept | Shows impact and usage patterns |

### Scope Calibration

The user's question determines scope shape:

| Question Type | Retrieval Shape |
|--------------|----------------|
| "How does X work?" | Depth — trace X from definition through implementation to execution. Capture key files completely. |
| "How is X related to Y?" | Breadth — locate both X and Y, then trace connection points between them. |
| "What does X do?" | Moderate depth — capture X's definition, its entry point, and one level of what it calls. |
| "Why is X done this way?" | Depth + history — capture X's implementation and `git log` to reveal when and how it evolved. |

### Completeness Criteria

Retrieval is complete when: (a) the files that define and implement the concept the user is asking about are captured, (b) the wiring that connects the concept to the rest of the system is traced, (c) the retrieval depth matches the question type (see Scope Calibration above), and (d) enough context is captured for a reader unfamiliar with the codebase to follow the explanation.