import { jsxs as l, jsx as e } from "react/jsx-runtime";
import { useState as f, useRef as Y, useEffect as S } from "react";
import { useInput as O, Box as n, Text as c } from "ink";
import h from "./shared/Divider.js";
import W from "./shared/PhaseHeader.js";
import g from "./shared/KeyMenu.js";
import R from "./shared/MarkdownRenderer.js";
import E from "./shared/TextInput.js";
import N from "./shared/StatusMessage.js";
import V from "./shared/WorkingIndicator.js";
import s from "../theme.js";
import { saveAssemblyOutput as k, cleanupStepFiles as B, runRetrievalExpansion as F } from "../../phases/review.js";
function ee({ session: t, config: H, onPhaseComplete: y }) {
  const [i, o] = f("menu"), [v, w] = f(null), [m, p] = f(t.assembly.revisionHistory.length), [b, I] = f(null), [x, M] = f(null), u = Y(!0);
  S(() => () => {
    u.current = !1;
  }, []);
  const d = [...t.assembly.revisionHistory, t.assembly.content];
  S(() => {
    let r;
    return i === "saved" && (r = setTimeout(() => {
      u.current && o("menu");
    }, 3e3)), () => {
      r && clearTimeout(r);
    };
  }, [i]);
  const D = (r) => {
    if (r === "S") {
      const a = k(t);
      w(a), o("saved");
    } else r === "X" ? (k(t), B(H), y("DONE")) : r === "R" ? o("revising") : r === "E" ? o("expanding_input") : r === "H" && (o("history"), p(d.length - 1));
  }, L = (r) => {
    t.assembly.revisionHistory.push(t.assembly.content), t.assembly.revisionFeedback = r, y("ASSEMBLY");
  }, _ = async (r) => {
    o("expanding_running");
    try {
      if (await F(t, r, {
        onToolCall: (a, A) => {
          u.current && I({ cmd: a, status: A });
        },
        onTurnWarning: (a) => {
          u.current && M(a);
        }
      }), !u.current) return;
      t.assembly.revisionHistory.push(t.assembly.content), y("ASSEMBLY");
    } catch {
      if (!u.current) return;
      o("menu");
    }
  };
  O((r, a) => {
    i === "history" && (a.leftArrow ? p(Math.max(0, m - 1)) : a.rightArrow && p(Math.min(d.length - 1, m + 1)));
  });
  const C = (r) => {
    r === "C" ? o("menu") : r === "M" && o("confirming_make_head");
  }, T = (r) => {
    r === "Y" ? (t.assembly.content = d[m], t.assembly.revisionHistory = d.slice(0, m), t.assembly.revisionFeedback = "", t.assembly.retrievalRequested = !1, o("menu")) : o("history");
  };
  return /* @__PURE__ */ l(n, { flexDirection: "column", children: [
    /* @__PURE__ */ e(W, { phase: "REVIEW", title: "REVIEW" }),
    i !== "history" && i !== "confirming_make_head" && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
      /* @__PURE__ */ e(R, { content: t.assembly.content }),
      /* @__PURE__ */ e(h, {}),
      i === "menu" && /* @__PURE__ */ e(
        g,
        {
          options: [
            { key: "S", label: "Save" },
            { key: "X", label: "Save & Exit" },
            { key: "R", label: "Revise" },
            { key: "E", label: "Expand retrieval" },
            { key: "H", label: "History", disabled: t.assembly.revisionHistory.length === 0 }
          ],
          onSelect: D
        }
      ),
      i === "saved" && v && /* @__PURE__ */ e(N, { type: "success", children: `Output committed: ${v.filename}` }),
      i === "revising" && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
        /* @__PURE__ */ e(h, {}),
        /* @__PURE__ */ e(n, { marginTop: 1, children: /* @__PURE__ */ e(
          E,
          {
            promptLabel: "Revision instructions",
            onSubmit: L
          }
        ) })
      ] }),
      i === "expanding_input" && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
        /* @__PURE__ */ e(h, {}),
        /* @__PURE__ */ e(n, { marginTop: 1, children: /* @__PURE__ */ e(
          E,
          {
            promptLabel: "Describe additional context to retrieve",
            onSubmit: _
          }
        ) })
      ] }),
      i === "expanding_running" && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
        /* @__PURE__ */ l(n, { marginLeft: 2, children: [
          /* @__PURE__ */ e(c, { color: s.status.info, children: "PROC" }),
          /* @__PURE__ */ e(c, { children: "  Expanding retrieval" })
        ] }),
        b && /* @__PURE__ */ l(n, { marginLeft: 3, children: [
          /* @__PURE__ */ e(c, { color: b.status === "error" ? s.status.error : s.ui.accent, children: "⊹ " }),
          /* @__PURE__ */ e(c, { dimColor: !0, children: b.cmd })
        ] }),
        x && /* @__PURE__ */ e(n, { marginLeft: 2, children: /* @__PURE__ */ e(c, { color: s.status.warning, children: `⚠ WARN  Agent turn ${x} reached threshold` }) }),
        /* @__PURE__ */ e(V, {})
      ] })
    ] }),
    (i === "history" || i === "confirming_make_head") && /* @__PURE__ */ l(n, { flexDirection: "column", children: [
      /* @__PURE__ */ l(n, { marginBottom: 1, marginLeft: 2, children: [
        /* @__PURE__ */ e(c, { bold: !0, color: s.ui.accent, children: `REVISION HISTORY [${m + 1}/${d.length}]` }),
        /* @__PURE__ */ e(n, { marginLeft: 2, children: /* @__PURE__ */ e(c, { dimColor: !0, children: "(Use ←/→ to navigate)" }) })
      ] }),
      /* @__PURE__ */ e(R, { content: d[m] }),
      /* @__PURE__ */ e(h, {}),
      i === "history" ? /* @__PURE__ */ e(
        g,
        {
          options: [
            { key: "M", label: "Restore this version" },
            { key: "C", label: "Cancel" }
          ],
          onSelect: C
        }
      ) : /* @__PURE__ */ l(n, { flexDirection: "column", children: [
        /* @__PURE__ */ l(n, { marginLeft: 2, children: [
          /* @__PURE__ */ e(c, { color: s.status.info, children: "QUERY" }),
          /* @__PURE__ */ e(c, { color: s.status.warning, bold: !0, children: "  Restore this version? Future history will be truncated." })
        ] }),
        /* @__PURE__ */ e(
          g,
          {
            options: [
              { key: "Y", label: "Yes" },
              { key: "N", label: "No" }
            ],
            onSelect: T
          }
        )
      ] })
    ] })
  ] });
}
export {
  ee as default
};
