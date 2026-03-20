import a from "fs";
import { spawn as M } from "child_process";
import { captureTool as w, AgentSession as O } from "../services/agent.js";
import { callLLM as _ } from "../services/llm.js";
import { composeRetrievalStepPrompts as I, loadPrompt as R, loadStepHeader as F } from "../services/prompts.js";
import { resolveProvider as P } from "../services/provider.js";
function A(e, { cwd: t = process.cwd(), timeout: o = 3e4 } = {}) {
  return new Promise((n) => {
    const p = M(e, { shell: !0, cwd: t });
    let r = "", s = "";
    const f = setTimeout(() => {
      p.kill(), n(`[TIMEOUT after ${o}ms]`);
    }, o);
    p.stdout.on("data", (l) => {
      r += l;
    }), p.stderr.on("data", (l) => {
      s += l;
    }), p.on("close", (l) => {
      clearTimeout(f);
      let d = (r + s).replace(/[^\x20-\x7E\x09\x0A\x0D]/g, "").trim();
      n(l !== 0 ? `[ERROR - Exit Code ${l}]
${d}` : d || "[Success - No Output]");
    });
  });
}
async function x(e, { defaultFile: t, onCommand: o } = {}) {
  for (const n of e) {
    if (!n || !n.command) continue;
    o && o(n.command, "running");
    const p = await A(n.command), r = n.file || t;
    if (r) {
      const s = [
        ":::command+note",
        `source: ${n.command}`,
        "---",
        p,
        "---",
        n.notes || "No justification provided.",
        ":::",
        ""
      ].join(`
`);
      a.appendFileSync(r, s);
    }
    o && (p.includes("[ERROR") || p.includes("[TIMEOUT") ? o(n.command, "error") : o(n.command, "done"));
  }
}
function L(e) {
  const t = e.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/), o = t ? t[1].trim() : e.trim();
  try {
    return JSON.parse(o);
  } catch (n) {
    const p = N(o);
    if (p !== o)
      try {
        return JSON.parse(p);
      } catch {
      }
    throw new Error(`Failed to parse LLM JSON output: ${n.message}
Content preview: ${o.substring(0, 200)}`);
  }
}
function N(e) {
  let t = "", o = !1, n = !1;
  for (let p = 0; p < e.length; p++) {
    const r = e[p];
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
  stepPrompt: p,
  priorStepIndices: r,
  tools: s,
  stepFile: f,
  skipFileInit: l = !1,
  priorContext: d,
  callbacks: i = {}
}) {
  i.onStepStart && i.onStepStart(o, n), e.retrieval._cmdCount = 0;
  let v = !1, u = 0;
  for (; !v && u < 2; ) {
    if (!l) {
      const m = F(t + 1);
      a.writeFileSync(f, m);
    }
    let S = "";
    if (r.length > 0) {
      const m = ["---", "## Previous Step Output", ""];
      for (const y of r)
        m.push(`### Step ${y + 1} Output`, "", e.retrieval.steps[y] || "", "");
      S = m.join(`
`);
    }
    const T = d ? d() : "";
    let C = "";
    if (!l) {
      const m = a.existsSync(f) ? a.readFileSync(f, "utf8") : "";
      C = [
        "---",
        "## Current Step File State",
        "",
        `Your step file (${f}) has been initialized. Its current contents:`,
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
      p,
      S,
      T || C
    ].filter(Boolean).join(`
`), g = P(e.config.agent), c = new O({
      endpoint: g.endpoint,
      model: g.model,
      apiKey: g.apiKey,
      format: g.format,
      stepFile: f,
      tools: s,
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
      await c.chat(h), c.usageLog && c.usageLog.length > 0 && e.stats.retrieval.push(...c.usageLog), a.existsSync(f) ? e.retrieval.steps[t] = a.readFileSync(f, "utf8") : e.retrieval.steps[t] = "", i.onStepComplete && i.onStepComplete(o, e.retrieval._cmdCount), v = !0;
    } catch (m) {
      if (u++, u >= 2)
        throw m;
    } finally {
      await c.end();
    }
  }
}
async function H(e, t = {}) {
  t.onHeader && t.onHeader();
  const o = I({
    taskSummary: e.intake.summary,
    taskType: e.intake.taskType,
    config: e.config
  }), n = e.config.retrieval.refinement || {}, r = n.endpoint && n.apiKey ? P(n) : P(e.config.agent), s = n.step1b?.model || r.model, f = n.step2?.model || r.model, l = e.retrieval.failedStep ?? 0;
  let d = null;
  try {
    if (l <= 0) {
      d = 0, t.onStepStart && t.onStepStart("0", "Pattern Execution"), e.retrieval._cmdCount = 0, a.writeFileSync("retrieval-patterns.md", `# Retrieval Patterns - Exploration Log

`);
      const i = e.intake.searchPatterns || [];
      if (i.length === 0 && e.intake.assessment === "READY" && console.warn("[retrieval] Warning: READY assessment but no search patterns found"), i.length > 0) {
        const v = i.map((u) => ({ command: u.command, notes: u.notes }));
        await x(v, {
          defaultFile: "retrieval-patterns.md",
          onCommand: (u, S) => {
            S === "running" && (e.retrieval._cmdCount = (e.retrieval._cmdCount || 0) + 1), t.onToolCall && t.onToolCall(u, S);
          }
        });
      }
      t.onStepComplete && t.onStepComplete("0", e.retrieval._cmdCount || 0);
    }
    if (l <= 1 && (d = 1, await E({
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
        a.existsSync("retrieval-patterns.md") ? a.readFileSync("retrieval-patterns.md", "utf8") : "",
        "",
        "---",
        "",
        "Review the initial findings above and explore further using capture. Follow threads, try variants, expand coverage. When you have thoroughly explored the task-relevant patterns, signal completion."
      ].join(`
`),
      callbacks: t
    }), e.retrieval.patterns = a.existsSync("retrieval-patterns.md") ? a.readFileSync("retrieval-patterns.md", "utf8") : ""), l <= 2) {
      d = 2, t.onStepStart && t.onStepStart("1b", "Pattern Refinement"), e.retrieval._cmdCount = 0;
      const i = e.retrieval.patterns || (a.existsSync("retrieval-patterns.md") ? a.readFileSync("retrieval-patterns.md", "utf8") : ""), v = R("retrieval-refinement-1b.md").replace(/{{TASK_SUMMARY}}/g, e.intake.summary).replace(/{{EXPLORATION_CONTENT}}/g, i), { content: u, usage: S } = await _({
        messages: [{ role: "user", content: "Analyze the exploration results and produce refined search commands." }],
        systemPrompt: v,
        endpoint: r.endpoint,
        model: s,
        apiKey: r.apiKey,
        format: r.format,
        cache: !1
      });
      e.stats.retrieval.push(S);
      const C = L(u).captures || [], h = F(1);
      a.writeFileSync("retrieval-step1.md", h), await x(C, {
        defaultFile: "retrieval-step1.md",
        onCommand: (g, c) => {
          c === "running" && (e.retrieval._cmdCount = (e.retrieval._cmdCount || 0) + 1), t.onToolCall && t.onToolCall(g, c);
        }
      }), e.retrieval.steps[0] = a.readFileSync("retrieval-step1.md", "utf8"), t.onStepComplete && t.onStepComplete("1b", e.retrieval._cmdCount || 0);
    }
    if (l <= 3) {
      d = 3, t.onStepStart && t.onStepStart("2", "Structural Selection"), e.retrieval._cmdCount = 0;
      const i = await A("rg --files | sort"), v = e.retrieval.steps[0] || (a.existsSync("retrieval-step1.md") ? a.readFileSync("retrieval-step1.md", "utf8") : ""), u = R("retrieval-refinement-2.md").replace(/{{TASK_SUMMARY}}/g, e.intake.summary).replace(/{{FILE_LISTING}}/g, i).replace(/{{STEP1_CONTENT}}/g, v), { content: S, usage: T } = await _({
        messages: [{ role: "user", content: "Analyze the file landscape and search results, then produce structural commands." }],
        systemPrompt: u,
        endpoint: r.endpoint,
        model: f,
        apiKey: r.apiKey,
        format: r.format,
        cache: !1
      });
      e.stats.retrieval.push(T);
      const h = L(S).captures || [], g = F(2);
      a.writeFileSync("retrieval-step2.md", g), await x(h, {
        defaultFile: "retrieval-step2.md",
        onCommand: (c, m) => {
          m === "running" && (e.retrieval._cmdCount = (e.retrieval._cmdCount || 0) + 1), t.onToolCall && t.onToolCall(c, m);
        }
      }), e.retrieval.steps[1] = a.readFileSync("retrieval-step2.md", "utf8"), t.onStepComplete && t.onStepComplete("2", e.retrieval._cmdCount || 0);
    }
    l <= 4 && (d = 4, await E({
      session: e,
      stepIndex: 2,
      stepLabel: "3",
      stepTitle: "Content Capture",
      stepPrompt: o[2],
      priorStepIndices: [0, 1],
      tools: [w],
      stepFile: "retrieval-step3.md",
      callbacks: t
    })), l <= 5 && (d = 5, await E({
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
    throw d !== null && (e.retrieval.failedStep = d), i;
  }
  return e.retrieval.failedStep = null, t.onFooter && t.onFooter(), "ASSEMBLY";
}
export {
  H as runRetrieval
};
