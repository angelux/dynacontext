import { jsx as e, jsxs as h } from "react/jsx-runtime";
import { useState as c, useRef as R, useEffect as v } from "react";
import { Box as l, Text as i } from "ink";
import D from "./shared/PhaseHeader.js";
import N from "./ErrorRecovery.js";
import E from "../theme.js";
import { runRetrieval as P } from "../../phases/retrieval.js";
function O({ session: g, config: W, onPhaseComplete: S, onStaticAdd: y }) {
  const [a, T] = c(null), x = R(null), [f, m] = c(null), [A, d] = c(null), [C, w] = c(null), [I, L] = c(0), p = R(/* @__PURE__ */ new Set()), t = R(!0);
  v(() => () => {
    t.current = !1;
  }, []), v(() => {
    (async () => {
      try {
        const n = await P(g, {
          onHeader: () => {
          },
          onStepStart: (r, o) => {
            if (t.current) {
              const s = { label: r, title: o };
              T(s), x.current = s, m(null);
            }
          },
          onToolCall: (r, o) => {
            t.current && m({ command: r, status: o });
          },
          onStepComplete: (r, o) => {
            if (t.current) {
              if (p.current.has(r)) return;
              p.current.add(r);
              const s = x.current?.title;
              y({ type: "RETRIEVAL_STEP", data: { label: r, count: o, title: s } }), T(null), m(null);
            }
          },
          onTurnWarning: (r) => {
            t.current && w(r);
          },
          onFooter: () => {
          }
        });
        t.current && S(n);
      } catch (n) {
        t.current && d(n.message);
      }
    })();
  }, [I]);
  const V = (u) => {
    u === "R" ? (d(null), L((n) => n + 1)) : u === "F" ? (g.retrieval.failedStep = 0, p.current.clear(), d(null), L((n) => n + 1)) : u === "Q" && S("DONE");
  };
  return A ? /* @__PURE__ */ e(
    N,
    {
      phase: "RETRIEVAL",
      errorMessage: A,
      onAction: V
    }
  ) : /* @__PURE__ */ h(l, { flexDirection: "column", children: [
    /* @__PURE__ */ e(D, { phase: "RETRIEVAL", title: "RETRIEVAL ENGINE" }),
    a && /* @__PURE__ */ h(l, { flexDirection: "column", children: [
      /* @__PURE__ */ e(l, { marginLeft: 2, children: /* @__PURE__ */ e(i, { children: `STEP ${a.label}: ${a.title}` }) }),
      f && /* @__PURE__ */ h(l, { marginLeft: 3, children: [
        f.status === "error" ? /* @__PURE__ */ e(i, { color: E.status.error, children: "✗ " }) : /* @__PURE__ */ e(i, { color: E.ui.accent, children: "⊹ " }),
        /* @__PURE__ */ e(i, { dimColor: !0, children: f.command.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim() })
      ] }),
      C && /* @__PURE__ */ e(l, { marginLeft: 2, children: /* @__PURE__ */ e(i, { color: E.status.warning, children: `⚠ WARN  Agent turn ${C} reached threshold` }) })
    ] })
  ] });
}
export {
  O as default
};
