import { jsxs as i, jsx as t } from "react/jsx-runtime";
import { Box as n, Text as a } from "ink";
import r from "../../theme.js";
function m({ type: o, children: c }) {
  let s = "", e;
  switch (o) {
    case "success":
      s = "✓ ", e = r.status.success;
      break;
    case "warning":
      s = "⚠ ", e = r.status.warning;
      break;
    case "error":
      s = "✗ ", e = r.status.error;
      break;
    case "info":
      s = "SYS ", e = r.status.info;
      break;
  }
  return /* @__PURE__ */ i(n, { children: [
    /* @__PURE__ */ t(a, { children: "  " }),
    /* @__PURE__ */ t(a, { color: e, children: s }),
    /* @__PURE__ */ t(a, { children: c })
  ] });
}
export {
  m as default
};
