import { jsxs as B, jsx as u } from "react/jsx-runtime";
import { useRef as g, useState as x, useEffect as E } from "react";
import { useInput as F, Box as l, Text as L } from "ink";
import R from "../../theme.js";
function q({ promptLabel: o = "", onSubmit: f, immediateSubmit: a }) {
  const e = g(""), i = g(!1), [p, c] = x(""), D = () => {
    c(e.current), i.current = !1;
  }, I = () => {
    i.current || (i.current = !0, queueMicrotask(D));
  }, [T, h] = x(!0);
  E(() => (h(!0), () => h(!1)), []), F((n, t) => {
    if (t.backspace || t.delete) {
      e.current.length > 0 && (e.current = e.current.slice(0, -1), c(e.current));
      return;
    }
    if (t.return) {
      if (a) {
        const s = e.current.trim();
        if (a(s)) {
          f(s);
          return;
        }
      }
      const r = e.current.split(`
`);
      if ((r[r.length - 1] || "").trim().toUpperCase() === "END") {
        const s = e.current.replace(/(\r?\n)?END$/i, "");
        f(s.trim());
        return;
      }
      e.current += `
`, c(e.current);
      return;
    }
    if (n) {
      const r = n.replace(/\r\n/g, `
`).replace(/\r/g, `
`);
      e.current += r, r.length === 1 ? c(e.current) : I();
    }
  });
  const m = p.length === 0 ? [""] : p.split(`
`);
  return /* @__PURE__ */ B(l, { flexDirection: "column", children: [
    o ? /* @__PURE__ */ u(l, { marginLeft: 2, marginBottom: 0, children: /* @__PURE__ */ u(L, { color: R.ui.accent, children: o }) }) : null,
    m.map((n, t) => {
      const r = t === m.length - 1, d = T && r ? n + "█" : n;
      return /* @__PURE__ */ u(l, { marginLeft: 2, children: /* @__PURE__ */ u(L, { children: `❯ ${d}` }) }, `input-line-${t}`);
    })
  ] });
}
export {
  q as default
};
