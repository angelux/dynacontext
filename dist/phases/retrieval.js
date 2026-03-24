import l from "fs";
import { spawn as O } from "child_process";
import { captureTool as w, AgentSession as M } from "../services/agent.js";
import { callLLM as R } from "../services/llm.js";
import { composeRetrievalStepPrompts as I, loadPrompt as _, loadStepHeader as F } from "../services/prompts.js";
import { resolveProvider as P } from "../services/provider.js";
function A(e, { cwd: t = process.cwd(), timeout: o = 3e4 } = {}) {
  return new Promise((n) => {
    let a = !1;
    const r = O(e, { shell: !0, cwd: t, stdio: ["ignore", "pipe", "pipe"] });
    let c = "", u = "";
    const d = setTimeout(() => {
      a || (a = !0, r.kill(), n(`[TIMEOUT after ${o}ms]`));
    }, o);
    r.stdout.on("data", (p) => {
      c += p;
    }), r.stderr.on("data", (p) => {
      u += p;
    }), r.on("error", (p) => {
      a || (a = !0, clearTimeout(d), n(`[ERROR - Spawn Failed]
${p.message}`));
    }), r.on("close", (p) => {
      if (a) return;
      a = !0, clearTimeout(d);
      let i = (c + u).replace(/[^\x20-\x7E\x09\x0A\x0D]/g, "").trim();
      n(p !== 0 ? `[ERROR - Exit Code ${p}]
${i}` : i || "[Success - No Output]");
    });
  });
}
async function x(e, { defaultFile: t, onCommand: o } = {}) {
  for (const n of e) {
    if (!n || !n.command) continue;
    o && o(n.command, "running");
    const a = await A(n.command), r = n.file || t;
    if (r) {
      const c = [
        ":::command+note",
        `source: ${n.command}`,
        "---",
        a,
        "---",
        n.notes || "No justification provided.",
        ":::",
        ""
      ].join(`
`);
      l.appendFileSync(r, c);
    }
    o && (a.includes("[ERROR") || a.includes("[TIMEOUT") ? o(n.command, "error") : o(n.command, "done"));
  }
}
function L(e) {
  const t = e.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/), o = t ? t[1].trim() : e.trim();
  try {
    return JSON.parse(o);
  } catch (n) {
    const a = N(o);
    if (a !== o)
      try {
        return JSON.parse(a);
      } catch {
      }
    throw new Error(`Failed to parse LLM JSON output: ${n.message}
Content preview: ${o.substring(0, 200)}`);
  }
}
function N(e) {
  let t = "", o = !1, n = !1;
  for (let a = 0; a < e.length; a++) {
    const r = e[a];
    if (!o) {
      t += r, r === '"' && (o = !0);
      continue;
    }
    if (n) {
      r === '"' || r === "\\" || r === "/" || r === "b" || r === "f" || r === "n" || r === "r" || r === "t" || r === "u" ? t += r : t += `\\${r}`, n = !1;
      continue;
    }
    if (r === "\\") {
      t += r, n = !0;
      continue;
    }
    t += r, r === '"' && (o = !1);
  }
  return t;
}
async function E({
  session: e,
  stepIndex: t,
  stepLabel: o,
  stepTitle: n,
  stepPrompt: a,
  priorStepIndices: r,
  tools: c,
  stepFile: u,
  skipFileInit: d = !1,
  priorContext: p,
  callbacks: i = {}
}) {
  i.onStepStart && i.onStepStart(o, n), e.retrieval._cmdCount = 0;
  let v = !1, f = 0;
  for (; !v && f < 2; ) {
    if (!d) {
      const m = F(t + 1);
      l.writeFileSync(u, m);
    }
    let S = "";
    if (r.length > 0) {
      const m = ["---", "## Previous Step Output", ""];
      for (const y of r)
        m.push(`### Step ${y + 1} Output`, "", e.retrieval.steps[y] || "", "");
      S = m.join(`
`);
    }
    const T = p ? p() : "";
    let C = "";
    if (!d) {
      const m = l.existsSync(u) ? l.readFileSync(u, "utf8") : "";
      C = [
        "---",
        "## Current Step File State",
        "",
        `Your step file (${u}) has been initialized. Its current contents:`,
        "",
        m,
        "",
        "---",
        "",
        "Continue from here. Your first write should append to this file using the capture tool."
      ].join(`
`);
    }
    const h = [
      a,
      S,
      T || C
    ].filter(Boolean).join(`
`), g = P(e.config.agent), s = new M({
      endpoint: g.endpoint,
      model: g.model,
      apiKey: g.apiKey,
      format: g.format,
      stepFile: u,
      tools: c,
      warningThreshold: e.config.agent.warningThreshold,
      commandTimeout: e.config.agent.commandTimeout,
      onTurnWarning: (m) => {
        i.onTurnWarning && i.onTurnWarning(m);
      },
      onToolCall: (m, y) => {
        y === "running" && (e.retrieval._cmdCount = (e.retrieval._cmdCount || 0) + 1), i.onToolCall && i.onToolCall(m, y);
      }
    });
    try {
      await s.chat(h), s.usageLog && s.usageLog.length > 0 && e.stats.retrieval.push(...s.usageLog), l.existsSync(u) ? e.retrieval.steps[t] = l.readFileSync(u, "utf8") : e.retrieval.steps[t] = "", i.onStepComplete && i.onStepComplete(o, e.retrieval._cmdCount), v = !0;
    } catch (m) {
      if (f++, f >= 2)
        throw m;
    } finally {
      await s.end();
    }
  }
}
async function H(e, t = {}) {
  t.onHeader && t.onHeader();
  const o = I({
    taskSummary: e.intake.summary,
    taskType: e.intake.taskType,
    config: e.config
  }), n = e.config.retrieval.refinement || {}, r = n.endpoint && n.apiKey ? P(n) : P(e.config.agent), c = n.step1b?.model || r.model, u = n.step2?.model || r.model, d = e.retrieval.failedStep ?? 0;
  let p = null;
  try {
    if (d <= 0) {
      p = 0, t.onStepStart && t.onStepStart("0", "Pattern Execution"), e.retrieval._cmdCount = 0, l.writeFileSync("retrieval-patterns.md", `# Retrieval Patterns - Exploration Log

`);
      const i = e.intake.searchPatterns || [];
      if (i.length === 0 && e.intake.assessment === "READY" && console.warn("[retrieval] Warning: READY assessment but no search patterns found"), i.length > 0) {
        const v = i.map((f) => ({ command: f.command, notes: f.notes }));
        await x(v, {
          defaultFile: "retrieval-patterns.md",
          onCommand: (f, S) => {
            S === "running" && (e.retrieval._cmdCount = (e.retrieval._cmdCount || 0) + 1), t.onToolCall && t.onToolCall(f, S);
          }
        });
      }
      t.onStepComplete && t.onStepComplete("0", e.retrieval._cmdCount || 0);
    }
    if (d <= 1 && (p = 1, await E({
      session: e,
      stepIndex: 0,
      stepLabel: "1a",
      stepTitle: "Pattern Exploration",
      stepPrompt: o[0],
      priorStepIndices: [],
      tools: [w],
      stepFile: "retrieval-patterns.md",
      skipFileInit: !0,
      priorContext: () => [
        "---",
        "## Current Exploration File State",
        "",
        "Your exploration file (retrieval-patterns.md) has been seeded with initial pattern results. Its current contents:",
        "",
        l.existsSync("retrieval-patterns.md") ? l.readFileSync("retrieval-patterns.md", "utf8") : "",
        "",
        "---",
        "",
        "Review the initial findings above and explore further using capture. Follow threads, try variants, expand coverage. When you have thoroughly explored the task-relevant patterns, signal completion."
      ].join(`
`),
      callbacks: t
    }), e.retrieval.patterns = l.existsSync("retrieval-patterns.md") ? l.readFileSync("retrieval-patterns.md", "utf8") : ""), d <= 2) {
      p = 2, t.onStepStart && t.onStepStart("1b", "Pattern Refinement"), e.retrieval._cmdCount = 0;
      const i = e.retrieval.patterns || (l.existsSync("retrieval-patterns.md") ? l.readFileSync("retrieval-patterns.md", "utf8") : ""), v = _("retrieval-refinement-1b.md").replace(/{{TASK_SUMMARY}}/g, e.intake.summary).replace(/{{EXPLORATION_CONTENT}}/g, i), { content: f, usage: S } = await R({
        messages: [{ role: "user", content: "Analyze the exploration results and produce refined search commands." }],
        systemPrompt: v,
        endpoint: r.endpoint,
        model: c,
        apiKey: r.apiKey,
        format: r.format,
        cache: !1
      });
      e.stats.retrieval.push(S);
      const C = L(f).captures || [], h = F(1);
      l.writeFileSync("retrieval-step1.md", h), await x(C, {
        defaultFile: "retrieval-step1.md",
        onCommand: (g, s) => {
          s === "running" && (e.retrieval._cmdCount = (e.retrieval._cmdCount || 0) + 1), t.onToolCall && t.onToolCall(g, s);
        }
      }), e.retrieval.steps[0] = l.readFileSync("retrieval-step1.md", "utf8"), t.onStepComplete && t.onStepComplete("1b", e.retrieval._cmdCount || 0);
    }
    if (d <= 3) {
      p = 3, t.onStepStart && t.onStepStart("2", "Structural Selection"), e.retrieval._cmdCount = 0;
      const i = await A("rg --files | sort"), v = e.retrieval.steps[0] || (l.existsSync("retrieval-step1.md") ? l.readFileSync("retrieval-step1.md", "utf8") : ""), f = _("retrieval-refinement-2.md").replace(/{{TASK_SUMMARY}}/g, e.intake.summary).replace(/{{FILE_LISTING}}/g, i).replace(/{{STEP1_CONTENT}}/g, v), { content: S, usage: T } = await R({
        messages: [{ role: "user", content: "Analyze the file landscape and search results, then produce structural commands." }],
        systemPrompt: f,
        endpoint: r.endpoint,
        model: u,
        apiKey: r.apiKey,
        format: r.format,
        cache: !1
      });
      e.stats.retrieval.push(T);
      const h = L(S).captures || [], g = F(2);
      l.writeFileSync("retrieval-step2.md", g), await x(h, {
        defaultFile: "retrieval-step2.md",
        onCommand: (s, m) => {
          m === "running" && (e.retrieval._cmdCount = (e.retrieval._cmdCount || 0) + 1), t.onToolCall && t.onToolCall(s, m);
        }
      }), e.retrieval.steps[1] = l.readFileSync("retrieval-step2.md", "utf8"), t.onStepComplete && t.onStepComplete("2", e.retrieval._cmdCount || 0);
    }
    d <= 4 && (p = 4, await E({
      session: e,
      stepIndex: 2,
      stepLabel: "3",
      stepTitle: "Content Capture",
      stepPrompt: o[2],
      priorStepIndices: [0, 1],
      tools: [w],
      stepFile: "retrieval-step3.md",
      callbacks: t
    })), d <= 5 && (p = 5, await E({
      session: e,
      stepIndex: 3,
      stepLabel: "4",
      stepTitle: "Gap Analysis",
      stepPrompt: o[3],
      priorStepIndices: [0, 1, 2],
      tools: [w],
      stepFile: "retrieval-step4.md",
      callbacks: t
    }));
  } catch (i) {
    throw p !== null && (e.retrieval.failedStep = p), i;
  }
  return e.retrieval.failedStep = null, t.onFooter && t.onFooter(), "ASSEMBLY";
}
export {
  H as runRetrieval
};
