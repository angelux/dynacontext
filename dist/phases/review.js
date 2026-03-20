import i from "fs";
import h from "path";
import { AgentSession as d } from "../services/agent.js";
import { resolveProvider as m } from "../services/provider.js";
function C(n) {
  const e = String(++n.assembly.saveCount).padStart(2, "0");
  let p = n.intake.summary;
  const l = n.assembly.content.match(/^# (.+)$/m);
  l && (p = l[1]);
  const u = p.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").substring(0, 50), a = n.config.output.filenamePrefix, o = `${a}_${e}-${u}.md`, s = h.join(process.cwd(), o);
  i.writeFileSync(s, n.assembly.content);
  const t = `${a}_${e}-stats.md`, r = h.join(process.cwd(), t), c = g(n.stats);
  return i.writeFileSync(r, c), { filename: o, statsFilename: t };
}
function v(n) {
  if (n.stepFiles?.cleanup !== !1) {
    for (let p = 1; p <= 4; p++) {
      const l = `retrieval-step${p}.md`;
      i.existsSync(l) && i.unlinkSync(l);
    }
    const e = "retrieval-patterns.md";
    i.existsSync(e) && i.unlinkSync(e);
  }
}
async function x(n, e, p = {}) {
  const u = `retrieval-expand-${n.retrieval.expandedSteps.length + 1}.md`, a = m(n.config.agent), o = new d({
    endpoint: a.endpoint,
    model: a.model,
    apiKey: a.apiKey,
    format: a.format,
    stepFile: u,
    warningThreshold: n.config.agent.warningThreshold,
    onTurnWarning: (t) => {
      p.onTurnWarning && p.onTurnWarning(t);
    },
    onToolCall: (t, r) => {
      r === "running" && (n.retrieval._expandCmdCount = (n.retrieval._expandCmdCount || 0) + 1), p.onToolCall && p.onToolCall(t, r);
    }
  }), s = `You are a retrieval agent gathering additional codebase context.

## Original Task
${n.intake.summary}

## What Has Already Been Retrieved
Steps 1-4 have already gathered pattern results, structural mapping, content captures, and gap analysis.

## What To Gather Now
${e}

Run targeted shell commands to gather the requested information.
Write all results to ${u}.
`;
  n.retrieval._expandCmdCount = 0, i.writeFileSync(u, ""), await o.chat(s), o.usageLog && o.usageLog.length > 0 && n.stats.retrieval.push(...o.usageLog), i.existsSync(u) && (n.retrieval.expandedSteps.push(i.readFileSync(u, "utf8")), i.unlinkSync(u)), p.onStepComplete && p.onStepComplete("EXPAND", n.retrieval._expandCmdCount);
}
function g(n) {
  const e = [];
  e.push("# Token Usage Report"), e.push("");
  let p = 0, l = 0, u = 0;
  if (e.push("## Intake"), n.intake.length === 0)
    e.push("No API calls recorded."), e.push("");
  else {
    e.push("| Call # | Model | Input Tokens | Output Tokens | Cached Tokens |"), e.push("|--------|-------|--------------|---------------|---------------|");
    let a = 0, o = 0, s = 0;
    n.intake.forEach((t, r) => {
      e.push(`| ${r + 1} | ${t.model} | ${t.inputTokens} | ${t.outputTokens} | ${t.cachedTokens} |`), a += t.inputTokens, o += t.outputTokens, s += t.cachedTokens;
    }), e.push(`| **Totals** | | **${a}** | **${o}** | **${s}** |`), e.push(""), p += a, l += o, u += s;
  }
  if (e.push("## Retrieval"), n.retrieval.length === 0)
    e.push("No API calls recorded."), e.push("");
  else {
    e.push("| Call # | Model | Input Tokens | Output Tokens | Cached Tokens |"), e.push("|--------|-------|--------------|---------------|---------------|");
    let a = 0, o = 0, s = 0;
    n.retrieval.forEach((t, r) => {
      e.push(`| ${r + 1} | ${t.model} | ${t.inputTokens} | ${t.outputTokens} | ${t.cachedTokens} |`), a += t.inputTokens, o += t.outputTokens, s += t.cachedTokens;
    }), e.push(`| **Totals** | | **${a}** | **${o}** | **${s}** |`), e.push(""), p += a, l += o, u += s;
  }
  if (e.push("## Assembly"), n.assembly.length === 0)
    e.push("No API calls recorded."), e.push("");
  else {
    e.push("| Call # | Model | Input Tokens | Output Tokens | Cached Tokens |"), e.push("|--------|-------|--------------|---------------|---------------|");
    let a = 0, o = 0, s = 0;
    n.assembly.forEach((t, r) => {
      e.push(`| ${r + 1} | ${t.model} | ${t.inputTokens} | ${t.outputTokens} | ${t.cachedTokens} |`), a += t.inputTokens, o += t.outputTokens, s += t.cachedTokens;
    }), e.push(`| **Totals** | | **${a}** | **${o}** | **${s}** |`), e.push(""), p += a, l += o, u += s;
  }
  return e.push("## Totals"), e.push("| Input Tokens | Output Tokens | Cached Tokens |"), e.push("|--------------|---------------|---------------|"), e.push(`| ${p} | ${l} | ${u} |`), e.push(""), e.join(`
`);
}
export {
  v as cleanupStepFiles,
  g as formatStats,
  x as runRetrievalExpansion,
  C as saveAssemblyOutput
};
