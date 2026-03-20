import { jsxs as i, jsx as s } from "react/jsx-runtime";
import { Box as o, Text as e } from "ink";
import d from "./Divider.js";
import t from "../../theme.js";
function b({ data: h }) {
  const { summary: r, assessment: f, taskType: p, biasing: x, phase: u, sessionId: c } = h, a = r?.match(/^Task:\s+(.+)$/m);
  let n = a ? a[1] : "";
  !n && r && (n = r.split(`
`).filter((T) => T.trim() !== "")[0] || ""), n.length > 120 && (n = n.slice(0, 117) + "...");
  const g = n || "No task description available", S = p || "unknown", l = f || "UNKNOWN", m = c ? new Date(Number(c)).toLocaleString() : null, y = l === "READY" ? t.status.success : t.status.warning, k = t.ui.accent;
  return /* @__PURE__ */ i(o, { flexDirection: "column", children: [
    /* @__PURE__ */ s(d, {}),
    /* @__PURE__ */ i(o, { flexDirection: "row", justifyContent: "space-between", marginLeft: 2, marginRight: 2, children: [
      /* @__PURE__ */ s(e, { children: "▸ RESUME" }),
      /* @__PURE__ */ s(e, { color: k, children: `[${u}]` })
    ] }),
    m && /* @__PURE__ */ i(o, { marginLeft: 2, children: [
      /* @__PURE__ */ s(e, { color: t.status.info, children: "SYS" }),
      /* @__PURE__ */ s(e, { children: `   Session: ${m}` })
    ] }),
    /* @__PURE__ */ i(o, { marginLeft: 2, children: [
      /* @__PURE__ */ s(e, { color: t.status.info, children: "SYS" }),
      /* @__PURE__ */ s(e, { children: `   Task: ${g}` })
    ] }),
    /* @__PURE__ */ i(o, { marginLeft: 2, children: [
      /* @__PURE__ */ s(e, { color: t.status.info, children: "SYS" }),
      /* @__PURE__ */ s(e, { children: `   Type: ${S} | Assessment: ` }),
      /* @__PURE__ */ s(e, { color: y, children: l })
    ] }),
    /* @__PURE__ */ s(d, {})
  ] });
}
export {
  b as default
};
