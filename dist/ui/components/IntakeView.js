import { jsxs as l, jsx as e } from "react/jsx-runtime";
import { useState as b, useRef as L, useEffect as w } from "react";
import { Box as n, Text as a } from "ink";
import d from "./shared/TextInput.js";
import k from "./shared/WorkingIndicator.js";
import S from "./shared/KeyMenu.js";
import g from "./shared/Divider.js";
import x from "./shared/PhaseHeader.js";
import D from "./shared/StatusMessage.js";
import o from "../theme.js";
import { processIntakeMessage as y, hasStructuredSummary as v, finalizeIntake as P } from "../../phases/intake.js";
function W({ session: t, config: z, onPhaseComplete: f, onSettingsRequested: A }) {
  const [r, s] = b(
    t.intake.messages.length > 0 ? "assessment" : "welcome"
  ), [h, u] = b(null), c = L(!0);
  w(() => () => {
    c.current = !1;
  }, []);
  const T = async (i) => {
    if (i.trim().toLowerCase() === "/settings") {
      A();
      return;
    }
    t.intake.messages.push({ role: "user", content: i }), s("processing");
    try {
      await y(t), c.current && s("assessment");
    } catch (m) {
      c.current && (u(m.message), s("assessment"));
    }
  }, R = async (i) => {
    if (i === "P") {
      if (!v(t.intake.summary)) {
        s("finalizing");
        try {
          await P(t);
        } catch (m) {
          c.current && u(m.message);
        }
      }
      c.current && s("biasing");
    } else i === "A" ? s("adding") : i === "R" && s("revising");
  }, p = async (i) => {
    t.intake.messages.push({ role: "user", content: i }), s("processing");
    try {
      await y(t), c.current && s("assessment");
    } catch (m) {
      c.current && (u(m.message), s("assessment"));
    }
  }, I = (i) => {
    t.intake.biasing = i, f("RETRIEVAL");
  }, E = (i) => {
    i === "Y" ? s("biasing_input") : (t.intake.biasing = "", f("RETRIEVAL"));
  };
  return /* @__PURE__ */ l(n, { flexDirection: "column", children: [
    /* @__PURE__ */ e(x, { phase: "INTAKE", title: "INTAKE" }),
    r === "welcome" && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
      /* @__PURE__ */ l(n, { marginLeft: 2, children: [
        /* @__PURE__ */ e(a, { color: o.status.info, children: "AWAITING INPUT" }),
        /* @__PURE__ */ e(a, { children: "  Describe task parameters. Terminate with " }),
        /* @__PURE__ */ e(a, { bold: !0, children: "END" }),
        /* @__PURE__ */ e(a, { children: "." })
      ] }),
      /* @__PURE__ */ e(n, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(a, { dimColor: !0, children: "Type /settings to configure." }) }),
      /* @__PURE__ */ e(n, { marginTop: 1, children: /* @__PURE__ */ e(
        d,
        {
          onSubmit: T,
          immediateSubmit: (i) => i.length > 20 || i[0] !== "/" ? !1 : i.toLowerCase() === "/settings"
        }
      ) })
    ] }),
    r === "processing" && /* @__PURE__ */ e(
      k,
      {
        label: t.intake.messages.length <= 1 ? "PROC  Analyzing task description" : "PROC  Processing additional context"
      }
    ),
    (r === "assessment" || r === "adding" || r === "revising" || r === "finalizing") && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
      /* @__PURE__ */ e(n, { marginTop: 1, marginBottom: 1, marginLeft: 2, children: /* @__PURE__ */ e(a, { children: t.intake.summary }) }),
      /* @__PURE__ */ e(g, {}),
      /* @__PURE__ */ l(n, { marginTop: 1, marginBottom: 1, marginLeft: 2, children: [
        /* @__PURE__ */ e(a, { color: o.status.info, children: "STATUS" }),
        /* @__PURE__ */ e(a, { children: "  Assessment: " }),
        /* @__PURE__ */ e(a, { color: t.intake.assessment === "READY" ? o.status.success : o.status.warning, children: `[${t.intake.assessment}]` })
      ] }),
      h && /* @__PURE__ */ e(D, { type: "error", children: h }),
      r === "assessment" && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
        /* @__PURE__ */ e(g, {}),
        /* @__PURE__ */ e(
          S,
          {
            options: [
              { key: "P", label: "Proceed", color: t.intake.assessment === "READY" ? o.ui.active : o.ui.muted },
              { key: "A", label: "Add details" },
              { key: "R", label: "Revise" }
            ],
            onSelect: R
          }
        )
      ] }),
      r === "adding" && /* @__PURE__ */ e(n, { marginTop: 1, children: /* @__PURE__ */ e(d, { promptLabel: "Add details", onSubmit: p }) }),
      r === "revising" && /* @__PURE__ */ e(n, { marginTop: 1, children: /* @__PURE__ */ e(d, { promptLabel: "Revise understanding", onSubmit: p }) }),
      r === "finalizing" && /* @__PURE__ */ e(k, { label: "PROC  Finalizing task summary" })
    ] }),
    (r === "biasing" || r === "biasing_input") && /* @__PURE__ */ e(n, { flexDirection: "column", children: r === "biasing" ? /* @__PURE__ */ l(n, { flexDirection: "column", children: [
      /* @__PURE__ */ l(n, { marginLeft: 2, children: [
        /* @__PURE__ */ e(a, { color: o.status.info, children: "QUERY" }),
        /* @__PURE__ */ e(a, { children: "  Apply biasing? Add guidance to shape assembly output." })
      ] }),
      /* @__PURE__ */ l(n, { marginLeft: 2, children: [
        /* @__PURE__ */ e(a, { color: o.status.info, children: "SYS" }),
        /* @__PURE__ */ e(a, { children: '    Example: "Focus on migration steps" or "Include rollback plan"' })
      ] }),
      /* @__PURE__ */ e(g, {}),
      /* @__PURE__ */ e(
        S,
        {
          options: [
            { key: "Y", label: "Add biasing" },
            { key: "N", label: "Skip" }
          ],
          onSelect: E
        }
      )
    ] }) : /* @__PURE__ */ e(n, { marginTop: 1, children: /* @__PURE__ */ e(d, { promptLabel: "Biasing guidance", onSubmit: I }) }) })
  ] });
}
export {
  W as default
};
