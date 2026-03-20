import { jsx as e } from "react/jsx-runtime";
import { useStdout as i, Text as n } from "ink";
function d() {
  const { stdout: t } = i(), o = t?.columns || 80, r = "─".repeat(o);
  return /* @__PURE__ */ e(n, { dimColor: !0, children: r });
}
export {
  d as default
};
