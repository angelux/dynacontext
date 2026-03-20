# Retrieval Step 4 — Gap Analysis

**Your workflow has two phases with a gate between them:**

**Phase 1 — Identify gaps (Mode 1 readonly + Mode 3 notes only):**
Read Steps 1, 2, and 3 output. Run the Gap Identification Checklist from your prompt. Write the `## Gaps Identified` section below — a numbered list where each gap states what is missing and why Assembly needs it.

**Phase 2 — Fill gaps (all modes):**
Begins after the gap inventory is written. Each fill references the gap number it addresses. Standard capture workflow: check size → capture with justification.

**The `## Gaps Identified` section is the first content written below this header.** Everything that follows references back to a gap on that list.

**Every entry has:**
- A gap number reference tying it to the inventory
- Real tool output only — no paraphrased, summarized, or reconstructed code
- For partial extractions (`sed -n`): the line range noted in the source command

**Unfilled gaps are flagged, not omitted:** `<!-- Gap not filled: [reason] -->`

**Downstream consumer:** Assembly is the sole consumer of this file. It uses your output to complete the evidence picture left by Steps 1, 2, and 3. Assembly makes better decisions knowing what's missing than believing the picture is complete.

Content appears in append order, not logical order.

---
