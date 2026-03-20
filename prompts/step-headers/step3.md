# Retrieval Step 3 — Content Capture

**Your capture rhythm:** Check size (Mode 1, readonly) → Capture (Mode 2, writeonly with justification) → Write before starting the next read. The step file is your external memory. Each capture is written here before proceeding to the next.

**Every entry has:**
- A justification in the notes parameter stating why Assembly needs this content
- Real tool output only — no paraphrased, summarized, or reconstructed code
- For partial extractions (`sed -n`): the line range noted in the source command

**Your deliverables in this file:**
1. Primary Reference Files — task-relevant file contents with per-capture justification
2. Representative Template — one complete example file the task needs to modify, extend, or replicate
3. Conventions — import patterns, registration patterns, naming conventions (often via `rg`, not full file reads)
4. Dependencies — import/usage edges showing how the task area connects to the system

**Does not contain:** Search results or structural information already present in Steps 1 and 2. Those files are delivered to Assembly alongside this one.

**Downstream consumers:** Step 4 reads this file to identify gaps in coverage. Assembly uses it as the primary source of code evidence for the context package. Both depend on accurate file paths, justified captures, and real tool output.

Content appears in append order, not logical order.

---
