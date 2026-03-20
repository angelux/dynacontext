import { jsxs as t, jsx as e } from "react/jsx-runtime";
import { Box as i, Text as r } from "ink";
import o from "./Divider.js";
import n from "../../theme.js";
function d({ data: s }) {
  const { retrievalRequested: c } = s;
  return /* @__PURE__ */ t(i, { flexDirection: "column", children: [
    /* @__PURE__ */ e(o, {}),
    /* @__PURE__ */ t(i, { flexDirection: "row", justifyContent: "space-between", marginLeft: 2, marginRight: 2, children: [
      /* @__PURE__ */ e(r, { children: "▸ ASSEMBLY" }),
      /* @__PURE__ */ e(r, { color: n.status.success, children: "complete" })
    ] }),
    c && /* @__PURE__ */ t(i, { marginLeft: 2, children: [
      /* @__PURE__ */ e(r, { color: n.status.info, children: "SYS" }),
      /* @__PURE__ */ e(r, { children: "  Retrieval expansion: yes" })
    ] }),
    /* @__PURE__ */ e(o, {})
  ] });
}
export {
  d as default
};
