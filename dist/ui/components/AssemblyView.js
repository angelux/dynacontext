import { jsxs as a, jsx as e } from "react/jsx-runtime";
import { useState as f, useRef as I, useEffect as S } from "react";
import { Box as n, Text as i } from "ink";
import b from "./shared/Divider.js";
import V from "./shared/PhaseHeader.js";
import R from "./shared/WorkingIndicator.js";
import C from "./shared/KeyMenu.js";
import W from "./shared/TextInput.js";
import q from "./ErrorRecovery.js";
import h from "../theme.js";
import { callAssemblyLLM as Y, reassembleWithDenial as _, executeRetrievalAndReassemble as k } from "../../phases/assembly.js";
import { notify as O } from "../../services/notify.js";
function P({ session: s, config: A, onPhaseComplete: u }) {
  const [c, l] = f("processing"), [x, g] = f(null), [m, L] = f(null), [E, M] = f(null), [p, T] = f(null), o = I(!0);
  S(() => () => {
    o.current = !1;
  }, []), S(() => {
    c === "processing" && (async () => {
      try {
        const { content: t, retrievalRequest: d } = await Y(s);
        if (!o.current) return;
        !d || s.assembly.retrievalRequested ? (s.assembly.content = t.replace(/\[ASSEMBLY_RETRIEVAL_REQUEST\][\s\S]*?\[\/ASSEMBLY_RETRIEVAL_REQUEST\]/, "").trim(), u("REVIEW")) : (L(d), l("gate"), O("DynaContext", "Assembly requesting additional files."));
      } catch (t) {
        if (!o.current) return;
        g(t.message), l("error");
      }
    })();
  }, [c]);
  const D = async (r) => {
    if (r === "D") {
      l("processing_denial");
      try {
        const t = await _(s);
        if (!o.current) return;
        s.assembly.content = t, u("REVIEW");
      } catch (t) {
        if (!o.current) return;
        g(t.message), l("error");
      }
    } else r === "A" ? y(m) : r === "M" && l("modifying");
  }, y = async (r) => {
    l("expanding");
    try {
      const t = await k(s, r, {
        onToolCall: (d, B) => {
          o.current && M({ cmd: d, status: B });
        },
        onTurnWarning: (d) => {
          o.current && T(d);
        }
      });
      if (!o.current) return;
      s.assembly.content = t, u("REVIEW");
    } catch (t) {
      if (!o.current) return;
      g(t.message), l("error");
    }
  }, v = (r) => {
    const t = { ...m, targetedSearch: r };
    y(t);
  }, w = (r) => {
    r === "R" ? (l("processing"), g(null)) : r === "E" ? u("RETRIEVAL") : r === "Q" && u("DONE");
  };
  return /* @__PURE__ */ a(n, { flexDirection: "column", children: [
    /* @__PURE__ */ e(V, { phase: "ASSEMBLY", title: "CONTEXT ASSEMBLY" }),
    c === "processing" && /* @__PURE__ */ e(
      R,
      {
        label: "PROC  Assembling context package",
        detail: `SYS   Model: ${A.assembly.model}`
      }
    ),
    c === "processing_denial" && /* @__PURE__ */ e(R, { label: "PROC  Reassembling with current context" }),
    c === "error" && /* @__PURE__ */ e(
      q,
      {
        phase: "ASSEMBLY",
        errorMessage: x,
        onAction: w
      }
    ),
    c === "gate" && /* @__PURE__ */ a(n, { flexDirection: "column", children: [
      /* @__PURE__ */ e(n, { marginBottom: 1, marginLeft: 2, children: /* @__PURE__ */ e(i, { bold: !0, children: "RETRIEVAL REQUEST" }) }),
      m.directReads.length > 0 && /* @__PURE__ */ a(n, { flexDirection: "column", marginBottom: 1, marginLeft: 2, children: [
        /* @__PURE__ */ e(i, { dimColor: !0, children: "Direct Reads:" }),
        m.directReads.map((r, t) => /* @__PURE__ */ e(n, { marginLeft: 2, children: /* @__PURE__ */ e(i, { children: `- ${r.path} (${r.reason})` }) }, t))
      ] }),
      m.targetedSearch && /* @__PURE__ */ a(n, { flexDirection: "column", marginBottom: 1, marginLeft: 2, children: [
        /* @__PURE__ */ e(i, { dimColor: !0, children: "Targeted Search:" }),
        /* @__PURE__ */ e(n, { marginLeft: 2, children: /* @__PURE__ */ e(i, { children: m.targetedSearch }) })
      ] }),
      /* @__PURE__ */ e(b, {}),
      /* @__PURE__ */ e(
        C,
        {
          options: [
            { key: "A", label: "Approve" },
            { key: "D", label: "Deny" },
            { key: "M", label: "Modify" }
          ],
          onSelect: D
        }
      )
    ] }),
    c === "modifying" && /* @__PURE__ */ a(n, { flexDirection: "column", children: [
      /* @__PURE__ */ e(b, {}),
      /* @__PURE__ */ e(n, { marginTop: 1, children: /* @__PURE__ */ e(
        W,
        {
          promptLabel: "Modify targeted search",
          onSubmit: v
        }
      ) })
    ] }),
    c === "expanding" && /* @__PURE__ */ a(n, { flexDirection: "column", children: [
      /* @__PURE__ */ a(n, { marginLeft: 2, children: [
        /* @__PURE__ */ e(i, { color: h.status.info, children: "PROC" }),
        /* @__PURE__ */ e(i, { children: "  Executing targeted retrieval" })
      ] }),
      E && /* @__PURE__ */ a(n, { marginLeft: 3, children: [
        /* @__PURE__ */ e(i, { color: E.status === "error" ? h.status.error : h.ui.accent, children: "⊹ " }),
        /* @__PURE__ */ e(i, { dimColor: !0, children: E.cmd })
      ] }),
      p && /* @__PURE__ */ e(n, { marginLeft: 2, children: /* @__PURE__ */ e(i, { color: h.status.warning, children: `⚠ WARN  Agent turn ${p} reached threshold` }) }),
      /* @__PURE__ */ e(R, {})
    ] })
  ] });
}
export {
  P as default
};
