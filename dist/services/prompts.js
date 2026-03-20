import a from "fs";
import m from "path";
import { fileURLToPath as l } from "url";
const d = l(import.meta.url), f = m.dirname(d), u = m.join(f, "..", "..");
function o(e) {
  const t = m.join(u, "prompts", e);
  if (!a.existsSync(t))
    throw new Error(`Prompt file not found: ${e}`);
  return a.readFileSync(t, "utf8");
}
function b(e) {
  return o(`step-headers/step${e}.md`);
}
function h(e) {
  const t = o(e.intake.systemPrompt), r = o("intake.md");
  let s = t.replace("{{PHASE_INSTRUCTIONS}}", r);
  return s += `

`, s;
}
function A(e) {
  const t = o(e.assembly.systemPrompt), r = o("assembly.md");
  let s = t.replace("{{PHASE_INSTRUCTIONS}}", r);
  return s += `

`, s;
}
function E({ taskSummary: e, taskType: t, config: r }) {
  const c = o("retrieval-steps.md").split(/---STEP_\d+---/).filter((n) => n.trim().length > 0), i = `preambles/${t}.md`;
  let p = "";
  try {
    p = o(i);
  } catch {
  }
  return c.map((n, P) => n.replace(/{{TASK_SUMMARY}}/g, e).replace(/{{TASK_TYPE_PREAMBLE}}/g, p));
}
export {
  A as composeAssemblyPrompt,
  h as composeIntakePrompt,
  E as composeRetrievalStepPrompts,
  o as loadPrompt,
  b as loadStepHeader
};
