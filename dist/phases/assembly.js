import u from "fs";
import f from "path";
import { callLLM as m } from "../services/llm.js";
import { composeAssemblyPrompt as h } from "../services/prompts.js";
import { AgentSession as v } from "../services/agent.js";
import { resolveProvider as p } from "../services/provider.js";
function b(e) {
  const n = /\[ASSEMBLY_RETRIEVAL_REQUEST\]([\s\S]*?)\[\/ASSEMBLY_RETRIEVAL_REQUEST\]/, a = e.match(n);
  if (!a) return null;
  const t = a[1], r = { directReads: [], targetedSearch: null }, o = t.match(/## Direct Reads\n([\s\S]*?)(?=##|$)/);
  if (o) {
    const s = o[1].split(`
`);
    for (const l of s) {
      const c = l.trim();
      if (c.startsWith("- ")) {
        const d = c.substring(2).split("|").map((y) => y.trim());
        d.length >= 1 && r.directReads.push({
          path: d[0],
          reason: d[1] || "No reason provided"
        });
      }
    }
  }
  const i = t.match(/## Targeted Search\n([\s\S]*?)(?=##|$)/);
  return i && (r.targetedSearch = i[1].trim()), r;
}
function R(e, n) {
  const a = [];
  for (const t of e) {
    const r = f.resolve(n, t.path);
    if (!r.startsWith(f.resolve(n))) {
      a.push(`<!-- Skipped ${t.path}: Path outside project directory -->`);
      continue;
    }
    if (!u.existsSync(r)) {
      a.push(`<!-- File not found: ${t.path} -->`);
      continue;
    }
    try {
      const o = u.readFileSync(r, "utf-8"), i = o.split(`
`).length;
      let s = `### ${t.path}

`;
      i > 500 && (s += `<!-- Note: Large file (${i} lines). Assembly requested this file specifically. -->

`), a.push(`${s}\`\`\`
${o}
\`\`\``);
    } catch (o) {
      a.push(`<!-- Error reading ${t.path}: ${o.message} -->`);
    }
  }
  return a.join(`

`);
}
async function S(e, n, a = {}) {
  const t = n.retrieval.expandedSteps.length + 1, r = p(n.config.agent), o = new v({
    endpoint: r.endpoint,
    model: r.model,
    apiKey: r.apiKey,
    format: r.format,
    cwd: n.cwd,
    stepFile: `retrieval-expand-${t}.md`,
    warningThreshold: n.config.agent.warningThreshold,
    onTurnWarning: (c) => {
      a.onTurnWarning && a.onTurnWarning(c);
    },
    onToolCall: (c, d) => {
      d === "running" && (n.retrieval._assemblyExpandCmdCount = (n.retrieval._assemblyExpandCmdCount || 0) + 1), a.onToolCall && a.onToolCall(c, d);
    }
  }), i = `You are a retrieval agent gathering additional codebase context for assembly.

## Original Task
${n.intake.summary}

## What Has Already Been Retrieved
Steps 1-4 have already gathered pattern results, structural mapping, content captures, and gap analysis.

## What To Gather Now
${e}

Use ripgrep (rg) for searching when possible. Run targeted shell commands to gather the requested information.
Write all results to retrieval-expand-${t}.md.
`;
  n.retrieval._assemblyExpandCmdCount = 0, await o.chat(i), o.usageLog && o.usageLog.length > 0 && n.stats.retrieval.push(...o.usageLog);
  const s = `retrieval-expand-${t}.md`;
  let l = "";
  return u.existsSync(s) && (l = u.readFileSync(s, "utf-8"), u.unlinkSync(s)), a.onStepComplete && a.onStepComplete("EXPAND", n.retrieval._assemblyExpandCmdCount), `### Targeted Search Results

${l || "<!-- No results returned -->"}`;
}
function g(e) {
  const n = e.intake.messages.map((t) => `**${t.role.toUpperCase()}**: ${t.content}`).join(`

`);
  let a = `## Structured Task Summary

${e.intake.summary}

## Full Intake Conversation

${n}

## Retrieval Results

${e.retrieval.steps.join(`

`)}

`;
  return e.retrieval.expandedSteps.length > 0 && (a += `## Additional Retrieval Results

${e.retrieval.expandedSteps.join(`

`)}

`), e.intake.biasing && (a += `## User Biasing Guidance

The following additional guidance comes directly from the user and should be seen as a complementary lens to influence your output.

${e.intake.biasing}

`), e.assembly.revisionFeedback && (a += `## Revision Request

Previous version is below. The user has requested these changes:

${e.assembly.revisionFeedback}

## Previous Context Package

${e.assembly.content}
`), a;
}
async function E(e) {
  const n = h(e.config), a = g(e), t = p(e.config.assembly), r = await m({
    messages: [{ role: "user", content: a }],
    systemPrompt: n,
    endpoint: t.endpoint,
    model: t.model,
    apiKey: t.apiKey,
    format: t.format,
    cache: !1
  });
  e.stats.assembly.push(r.usage);
  const o = b(r.content);
  return { content: r.content, retrievalRequest: o };
}
async function A(e) {
  const n = h(e.config), a = g(e) + `

## Revision Request

Your retrieval request was denied by the user. Proceed with the complete output using only the context available.

`, t = p(e.config.assembly), r = await m({
    messages: [{ role: "user", content: a }],
    systemPrompt: n,
    endpoint: t.endpoint,
    model: t.model,
    apiKey: t.apiKey,
    format: t.format,
    cache: !1
  });
  return e.stats.assembly.push(r.usage), r.content;
}
async function L(e, n, a = {}) {
  const t = [];
  if (n.directReads.length > 0) {
    const l = R(n.directReads, e.cwd);
    l && t.push(l);
  }
  if (n.targetedSearch) {
    const l = await S(n.targetedSearch, e, a);
    t.push(l);
  }
  e.assembly.retrievalRequested = !0, t.length > 0 && e.retrieval.expandedSteps.push(t.join(`

---

`));
  const r = g(e) + `

## Revision Request

Additional context has been provided in response to your retrieval request. Proceed directly to producing the complete output using all available information.

`, o = h(e.config), i = p(e.config.assembly), s = await m({
    messages: [{ role: "user", content: r }],
    systemPrompt: o,
    endpoint: i.endpoint,
    model: i.model,
    apiKey: i.apiKey,
    format: i.format,
    cache: !1
  });
  return e.stats.assembly.push(s.usage), s.content;
}
export {
  g as buildUserContent,
  E as callAssemblyLLM,
  R as executeDirectReads,
  L as executeRetrievalAndReassemble,
  S as executeTargetedSearch,
  b as parseRetrievalRequest,
  A as reassembleWithDenial
};
