import { jsxs as s, jsx as t } from "react/jsx-runtime";
import { Box as n, Text as i } from "ink";
import m from "./Divider.js";
import r from "../../theme.js";
function T({ data: f }) {
  const { summary: o, assessment: c, taskType: h, biasing: a } = f, l = o?.match(/^Task:\s+(.+)$/m);
  let e = l ? l[1] : "";
  !e && o && (e = o.split(`
`).filter((p) => p.trim() !== "")[0] || ""), e.length > 120 && (e = e.slice(0, 117) + "...");
  const d = c === "READY" ? r.status.success : r.status.warning, u = a && a.trim() !== "";
  return /* @__PURE__ */ s(n, { flexDirection: "column", children: [
    /* @__PURE__ */ t(m, {}),
    /* @__PURE__ */ s(n, { flexDirection: "row", justifyContent: "space-between", marginLeft: 2, marginRight: 2, children: [
      /* @__PURE__ */ t(i, { children: "▸ INTAKE" }),
      /* @__PURE__ */ t(i, { color: d, children: `[${c}]` })
    ] }),
    /* @__PURE__ */ s(n, { marginLeft: 2, children: [
      /* @__PURE__ */ t(i, { color: r.status.info, children: "SYS" }),
      /* @__PURE__ */ t(i, { children: `   Task: ${e}` })
    ] }),
    /* @__PURE__ */ s(n, { marginLeft: 2, children: [
      /* @__PURE__ */ t(i, { color: r.status.info, children: "SYS" }),
      /* @__PURE__ */ t(i, { children: `   Type: ${h}${u ? " | Biasing: yes" : ""}` })
    ] }),
    /* @__PURE__ */ t(m, {})
  ] });
}
export {
  T as default
};
