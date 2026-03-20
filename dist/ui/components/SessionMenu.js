import { jsxs as h, jsx as e } from "react/jsx-runtime";
import { useState as x } from "react";
import { useInput as M, Box as l, Text as t } from "ink";
import { deleteSession as B } from "../../services/session.js";
import I from "./shared/Divider.js";
import a from "../theme.js";
function T({ sessions: N, onSelect: d }) {
  const [r, D] = x(N), [i, p] = x(0), [S, u] = x(!1);
  M((n, c) => {
    const o = n?.toUpperCase();
    if (S) {
      if (o === "Y") {
        const g = r[i].id;
        try {
          B(g);
        } catch {
        }
        const m = r.filter((s, f) => f !== i);
        D(m), m.length === 0 ? d({ action: "new" }) : (p(Math.min(i, m.length - 1)), u(!1));
      } else o === "N" && u(!1);
      return;
    }
    c.upArrow ? p(Math.max(0, i - 1)) : c.downArrow ? p(Math.min(r.length - 1, i + 1)) : c.return ? d({ action: "resume", id: r[i].id }) : o === "N" ? d({ action: "new" }) : o === "S" ? d({ action: "settings" }) : o === "D" && u(!0);
  });
  const w = (n) => a.phase[n] || a.phase.default;
  return /* @__PURE__ */ h(l, { flexDirection: "column", children: [
    /* @__PURE__ */ h(l, { marginTop: 1, marginBottom: 1, marginLeft: 2, children: [
      /* @__PURE__ */ e(t, { color: a.status.info, children: "SYS" }),
      /* @__PURE__ */ e(t, { bold: !0, children: "  Active Sessions" })
    ] }),
    /* @__PURE__ */ e(I, {}),
    /* @__PURE__ */ e(l, { flexDirection: "column", marginTop: 1, marginBottom: 1, children: r.map((n, c) => {
      const g = c === i ? /* @__PURE__ */ e(t, { color: a.ui.accent, children: "❯" }) : /* @__PURE__ */ e(t, { children: " " }), m = w(n.phase);
      let s = n.displayName;
      const f = 36;
      return s.length > f && (s = s.slice(0, f - 1) + "…"), /* @__PURE__ */ h(l, { marginLeft: 2, children: [
        g,
        /* @__PURE__ */ e(t, { children: ` ${s.padEnd(38)} ` }),
        /* @__PURE__ */ e(t, { color: m, children: n.phase })
      ] }, n.id);
    }) }),
    S ? /* @__PURE__ */ h(l, { marginBottom: 2, marginLeft: 2, children: [
      /* @__PURE__ */ e(t, { color: a.status.info, children: "QUERY" }),
      /* @__PURE__ */ e(t, { color: a.status.error, children: `  Delete "${r[i].displayName.slice(0, 30)}"? [Y/N]` })
    ] }) : /* @__PURE__ */ e(l, { marginBottom: 2, marginLeft: 2, children: /* @__PURE__ */ e(t, { dimColor: !0, children: "[↑↓] Navigate   [Enter] Resume   [N] New   [S] Settings   [D] Delete" }) })
  ] });
}
export {
  T as default
};
