import { jsx as o } from "react/jsx-runtime";
import { Text as t } from "ink";
import { marked as r } from "marked";
import { markedTerminal as n } from "marked-terminal";
r.use(n());
function p({ content: e }) {
  const m = r(e || "");
  return /* @__PURE__ */ o(t, { children: m.trim() });
}
export {
  p as default
};
