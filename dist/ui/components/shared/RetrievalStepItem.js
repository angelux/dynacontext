import { jsxs as o, jsx as e } from "react/jsx-runtime";
import { Box as t, Text as r } from "ink";
import l from "../../theme.js";
function f({ data: i }) {
  const { label: n, title: c, count: m } = i;
  return /* @__PURE__ */ o(t, { flexDirection: "column", marginBottom: 1, children: [
    /* @__PURE__ */ e(t, { marginLeft: 2, children: /* @__PURE__ */ e(r, { children: `STEP ${n}: ${c}` }) }),
    /* @__PURE__ */ o(t, { marginLeft: 2, children: [
      /* @__PURE__ */ e(r, { color: l.status.success, children: "✓" }),
      /* @__PURE__ */ e(r, { children: ` Complete — ${m} commands executed` })
    ] })
  ] });
}
export {
  f as default
};
