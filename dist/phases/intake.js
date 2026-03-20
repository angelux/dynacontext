import { callLLM as f } from "../services/llm.js";
import { composeIntakePrompt as S } from "../services/prompts.js";
import { resolveProvider as k } from "../services/provider.js";
async function d(t) {
  const h = S(t.config), s = k(t.config.intake), { content: e, usage: n } = await f({
    messages: t.intake.messages,
    systemPrompt: h,
    endpoint: s.endpoint,
    model: s.model,
    apiKey: s.apiKey,
    format: s.format
  });
  t.stats.intake.push(n);
  const p = e.match(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/i), r = p ? p[1].toUpperCase() : "NEEDS_INFO";
  t.intake.assessment = r;
  const c = e.match(/Type:\s*([a-zA-Z-]+)/i);
  t.intake.taskType = c ? c[1].toLowerCase() : "modification";
  const i = e.match(/```search_patterns\s*\n([\s\S]*?)\n```/);
  if (i)
    try {
      const a = JSON.parse(i[1].trim());
      t.intake.searchPatterns = a.captures || [];
    } catch {
      t.intake.searchPatterns = [];
    }
  else
    t.intake.searchPatterns = [];
  const o = e.match(/References:\s*(.*)/i);
  t.intake.references = o ? o[1].split(",").map((a) => a.trim()) : [];
  const m = e.replace(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/gi, "").replace(/```search_patterns\s*\n[\s\S]*?\n```/g, "").trim();
  return t.intake.summary = m, t.intake.messages.push({ role: "assistant", content: e }), { displayContent: m, assessment: r };
}
async function y(t) {
  t.intake.messages.push({ role: "user", content: "The user has initiated retrieval. Based on everything discussed so far, produce your best structured task summary now. Use the standard format (Task, Component, Feature, Stack, Constraint, Type, Pattern, Hook, References). Include [ASSESSMENT: READY] or [ASSESSMENT: NEEDS_INFO] as appropriate. Work with whatever information you have — do not ask further questions." });
  const s = S(t.config), e = k(t.config.intake), { content: n, usage: p } = await f({
    messages: t.intake.messages,
    systemPrompt: s,
    endpoint: e.endpoint,
    model: e.model,
    apiKey: e.apiKey,
    format: e.format
  });
  t.stats.intake.push(p), t.intake.messages.push({ role: "assistant", content: n });
  const r = n.match(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/i);
  r && (t.intake.assessment = r[1].toUpperCase());
  const c = n.match(/Type:\s*([a-zA-Z-]+)/i);
  c && (t.intake.taskType = c[1].toLowerCase());
  const i = n.match(/References:\s*(.*)/i);
  i && (t.intake.references = i[1].split(",").map((a) => a.trim()));
  const o = n.match(/```search_patterns\s*\n([\s\S]*?)\n```/);
  if (o)
    try {
      const a = JSON.parse(o[1].trim());
      t.intake.searchPatterns = a.captures || [];
    } catch {
      t.intake.searchPatterns = [];
    }
  else
    t.intake.searchPatterns = [];
  const m = n.replace(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/gi, "").replace(/```search_patterns\s*\n[\s\S]*?\n```/g, "").trim();
  return t.intake.summary = m, m;
}
function g(t) {
  return /^Task:\s+.+/m.test(t) && /^Type:\s+.+/m.test(t);
}
export {
  y as finalizeIntake,
  g as hasStructuredSummary,
  d as processIntakeMessage
};
