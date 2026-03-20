import { jsxs as i, jsx as e } from "react/jsx-runtime";
import { useRef as C, useState as x, useEffect as D } from "react";
import { Box as l, Text as t } from "ink";
import I from "../../theme.js";
const r = 32, s = 1e4, T = 250;
function L({ label: o, detail: n }) {
  const a = C(Date.now()), [c, f] = x(0);
  D(() => {
    const u = setInterval(() => {
      const h = (Date.now() - a.current) % s, p = Math.min(Math.floor(h / s * (r + 1)), r);
      f(p);
    }, T);
    return () => clearInterval(u);
  }, []);
  const d = "█".repeat(c), m = "░".repeat(r - c);
  return /* @__PURE__ */ i(l, { flexDirection: "column", marginLeft: 2, children: [
    o && /* @__PURE__ */ e(t, { children: o }),
    n && /* @__PURE__ */ e(t, { dimColor: !0, children: n }),
    /* @__PURE__ */ i(l, { children: [
      /* @__PURE__ */ e(t, { color: I.ui.accent, children: d }),
      /* @__PURE__ */ e(t, { dimColor: !0, children: m })
    ] })
  ] });
}
export {
  L as default
};
