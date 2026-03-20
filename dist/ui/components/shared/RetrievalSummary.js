import { jsxs as r, jsx as e } from "react/jsx-runtime";
import { Box as t, Text as i } from "ink";
import o from "./Divider.js";
import m from "../../theme.js";
function f() {
  return /* @__PURE__ */ r(t, { flexDirection: "column", children: [
    /* @__PURE__ */ e(o, {}),
    /* @__PURE__ */ r(t, { flexDirection: "row", justifyContent: "space-between", marginLeft: 2, marginRight: 2, children: [
      /* @__PURE__ */ e(i, { children: "▸ RETRIEVAL" }),
      /* @__PURE__ */ e(i, { color: m.status.success, children: "complete" })
    ] }),
    /* @__PURE__ */ e(o, {})
  ] });
}
export {
  f as default
};
