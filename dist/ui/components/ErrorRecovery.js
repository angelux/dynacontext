import { jsxs as o, jsx as r } from "react/jsx-runtime";
import { Box as t, Text as l } from "ink";
import a from "./shared/KeyMenu.js";
import u from "./shared/Divider.js";
import c from "../theme.js";
function d({ phase: e, errorMessage: i, onAction: n }) {
  const m = e === "ASSEMBLY" ? [
    { key: "R", label: "Retry" },
    { key: "E", label: "Re-run retrieval" },
    { key: "Q", label: "Quit" }
  ] : [
    { key: "R", label: "Retry from failure" },
    { key: "F", label: "Full restart" },
    { key: "Q", label: "Quit" }
  ];
  return /* @__PURE__ */ o(t, { flexDirection: "column", marginTop: 1, children: [
    /* @__PURE__ */ r(u, {}),
    /* @__PURE__ */ o(t, { marginTop: 1, marginBottom: 1, children: [
      /* @__PURE__ */ r(l, { color: c.status.error, bold: !0, children: `  ✗ Error in ${e}: ` }),
      /* @__PURE__ */ r(l, { children: i })
    ] }),
    /* @__PURE__ */ r(a, { options: m, onSelect: n })
  ] });
}
export {
  d as default
};
