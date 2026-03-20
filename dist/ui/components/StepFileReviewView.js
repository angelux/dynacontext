import { jsxs as i, jsx as e } from "react/jsx-runtime";
import { Box as n, Text as t } from "ink";
import h from "./shared/PhaseHeader.js";
import f from "./shared/Divider.js";
import S from "./shared/KeyMenu.js";
import l from "../theme.js";
import { handleStepFileReload as g } from "../../pipeline.js";
function F({ session: r, config: v, onPhaseComplete: c }) {
  const m = [
    { name: "retrieval-step1.md", content: r.retrieval.steps[0] },
    { name: "retrieval-step2.md", content: r.retrieval.steps[1] },
    { name: "retrieval-step3.md", content: r.retrieval.steps[2] },
    { name: "retrieval-step4.md", content: r.retrieval.steps[3] }
  ];
  return /* @__PURE__ */ i(n, { flexDirection: "column", children: [
    /* @__PURE__ */ e(h, { phase: "RETRIEVAL", title: "RETRIEVAL CHECKPOINT" }),
    /* @__PURE__ */ i(n, { marginLeft: 2, children: [
      /* @__PURE__ */ e(t, { color: l.status.info, children: "STATUS" }),
      /* @__PURE__ */ e(t, { children: "  Retrieval complete. Step files staged for review:" })
    ] }),
    m.map((o, d) => {
      const a = String(Math.ceil(o.content.length / 1024)).padStart(3, "0") + " KB", p = ".".repeat(Math.max(2, 44 - o.name.length - a.length)), s = `${o.name} ${p} ${a}`;
      return /* @__PURE__ */ e(n, { marginLeft: 2, children: /* @__PURE__ */ e(t, { children: s }) }, d);
    }),
    /* @__PURE__ */ i(n, { marginTop: 1, marginLeft: 2, children: [
      /* @__PURE__ */ e(t, { color: l.status.info, children: "SYS" }),
      /* @__PURE__ */ e(t, { children: "  Files located in project root." })
    ] }),
    /* @__PURE__ */ i(n, { marginLeft: 2, children: [
      /* @__PURE__ */ e(t, { color: l.status.info, children: "SYS" }),
      /* @__PURE__ */ e(t, { children: "  Edit externally, then proceed to assembly." })
    ] }),
    /* @__PURE__ */ e(f, {}),
    /* @__PURE__ */ e(
      S,
      {
        options: [{ key: "P", label: "Proceed" }],
        onSelect: () => {
          g(r), c("ASSEMBLY");
        }
      }
    )
  ] });
}
export {
  F as default
};
