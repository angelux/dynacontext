import { jsx as c } from "react/jsx-runtime";
import { useState as g, useEffect as I } from "react";
import { useInput as p, Box as m, Text as a } from "ink";
import v from "../../theme.js";
function S({ options: n, defaultValue: r, onSelect: s, onCancel: d }) {
  const f = () => {
    if (r == null) return 0;
    const i = n.findIndex((e) => e.value === r);
    return i >= 0 ? i : 0;
  }, [l, o] = g(f);
  return I(() => {
    const i = n.findIndex((e) => e.value === r);
    i >= 0 && o(i);
  }, [r, n]), p((i, e) => {
    e.upArrow ? o((t) => Math.max(0, t - 1)) : e.downArrow ? o((t) => Math.min(n.length - 1, t + 1)) : e.return || i === " " ? s(n[l].value) : e.escape && d && d();
  }), /* @__PURE__ */ c(m, { flexDirection: "column", children: n.map((i, e) => {
    const t = e === l, h = t ? "❯" : " ", x = t ? "●" : "○", u = t ? v.ui.accent : void 0;
    return /* @__PURE__ */ c(m, { children: /* @__PURE__ */ c(a, { color: u, dimColor: !t, children: `${h} ${x} ${i.label}` }) }, `option-${e}`);
  }) });
}
export {
  S as default
};
