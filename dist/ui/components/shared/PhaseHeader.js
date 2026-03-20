import { jsxs as c, jsx as o } from "react/jsx-runtime";
import { Box as t, Text as m } from "ink";
import l from "./Divider.js";
import n from "../../theme.js";
const s = ["INTAKE", "RETRIEVAL", "ASSEMBLY", "REVIEW"];
function E({ phase: u, title: f }) {
  const i = s.indexOf(u), a = s.map((e, r) => r < i ? { symbol: "●", color: n.status.success } : r === i ? { symbol: "◆", color: n.ui.accent } : { symbol: "○", color: n.ui.muted });
  return /* @__PURE__ */ c(t, { flexDirection: "column", marginBottom: 1, children: [
    /* @__PURE__ */ o(l, {}),
    /* @__PURE__ */ c(t, { flexDirection: "row", justifyContent: "space-between", marginLeft: 2, marginRight: 2, children: [
      /* @__PURE__ */ o(m, { bold: !0, children: f }),
      /* @__PURE__ */ o(t, { flexDirection: "row", children: a.map((e, r) => /* @__PURE__ */ o(m, { color: e.color, children: r > 0 ? ` ${e.symbol}` : e.symbol }, r)) })
    ] }),
    /* @__PURE__ */ o(l, {})
  ] });
}
export {
  E as default
};
