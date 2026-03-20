import r from "fs";
import a from "path";
const S = ".dynacontext";
function y(n) {
  return JSON.parse(JSON.stringify(n, (e, t) => {
    if (e !== "config" && !e.startsWith("_"))
      return t;
  }));
}
function d() {
  return a.join(process.cwd(), S);
}
function m(n) {
  const s = d();
  r.existsSync(s) || r.mkdirSync(s, { recursive: !0 });
  let e = n._sessionId;
  e || (e = String(Date.now()), n._sessionId = e);
  const t = a.join(s, e);
  r.existsSync(t) || r.mkdirSync(t, { recursive: !0 });
  const o = a.join(t, "session.json"), i = y(n);
  r.writeFileSync(o, JSON.stringify(i, null, 2), "utf8");
}
function N(n, s) {
  const e = d(), t = a.join(e, n, "session.json");
  if (!r.existsSync(t))
    throw new Error(`Session not found: ${n}`);
  const o = r.readFileSync(t, "utf8"), i = JSON.parse(o);
  return i.config = s, i.cwd = process.cwd(), i.retrieval && Array.isArray(i.retrieval.expandedSteps) && (i.retrieval.expandedSteps = i.retrieval.expandedSteps.map((c) => {
    if (typeof c == "object" && c !== null) {
      const u = { ...c };
      return Object.keys(u).forEach((f) => {
        f.startsWith("_") && delete u[f];
      }), u;
    }
    return c;
  })), i._sessionId = n, i;
}
function l(n, s) {
  if (n.assembly?.content) {
    const t = n.assembly.content.match(/^# (.+)$/m);
    if (t)
      return t[1].trim();
  }
  const e = Number(s);
  return isNaN(e) ? `Session ${s}` : new Date(e).toLocaleString();
}
function x() {
  const n = d();
  if (!r.existsSync(n))
    return [];
  const s = r.readdirSync(n, { withFileTypes: !0 }), e = [];
  for (const t of s) {
    if (!t.isDirectory()) continue;
    const o = t.name, i = a.join(n, o), c = a.join(i, "session.json");
    if (r.existsSync(c))
      try {
        const u = r.readFileSync(c, "utf8"), f = JSON.parse(u);
        e.push({
          id: o,
          path: i,
          phase: f.phase || "UNKNOWN",
          displayName: l(f, o)
        });
      } catch {
        continue;
      }
  }
  return e.sort((t, o) => Number(o.id) - Number(t.id)), e;
}
function j(n) {
  const s = d(), e = a.join(s, n);
  if (!r.existsSync(e))
    throw new Error(`Session not found: ${n}`);
  r.rmSync(e, { recursive: !0, force: !0 });
}
export {
  j as deleteSession,
  x as listSessions,
  N as loadSession,
  m as saveSession
};
