import { jsx as i } from "react/jsx-runtime";
import { useInput as d, Box as a, Text as l } from "ink";
import m from "../../theme.js";
function h({ options: o, onSelect: c }) {
  return d((e, n) => {
    const r = e?.toUpperCase();
    if (!r) return;
    o.find((t) => t.key.toUpperCase() === r && !t.disabled) && c(r);
  }), /* @__PURE__ */ i(a, { flexDirection: "row", marginLeft: 2, children: o.map((e, n) => {
    const r = e.disabled ? m.ui.muted : e.color || void 0;
    return /* @__PURE__ */ i(a, { marginRight: 4, children: /* @__PURE__ */ i(l, { color: r, children: `[${e.key}] ${e.label}` }) }, n);
  }) });
}
export {
  h as default
};
