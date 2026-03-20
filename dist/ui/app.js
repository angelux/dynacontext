import { jsx as r, jsxs as M } from "react/jsx-runtime";
import { useRef as _, useState as p, useEffect as T } from "react";
import { useApp as g, Box as C, Static as K } from "ink";
import { createSession as E } from "../pipeline.js";
import { listSessions as P, saveSession as W, loadSession as Y } from "../services/session.js";
import "fs";
import "path";
import "os";
import "child_process";
import { notify as R } from "../services/notify.js";
import d from "./components/BootSequence.js";
import v from "./components/SessionMenu.js";
import $ from "./components/IntakeView.js";
import D from "./components/RetrievalView.js";
import q from "./components/AssemblyView.js";
import F from "./components/ReviewView.js";
import U from "./components/StepFileReviewView.js";
import z from "./components/shared/IntakeSummary.js";
import j from "./components/shared/RetrievalSummary.js";
import x from "./components/shared/AssemblySummary.js";
import G from "./components/shared/ResumeSummary.js";
import H from "./components/shared/RetrievalStepItem.js";
import J from "./components/WizardView.js";
import Z from "./components/SettingsView.js";
function ke({ initialConfig: A, needsWizard: l, onValidateConfig: S }) {
  const { exit: k } = g(), s = _(null), [n, f] = p(A), [i, a] = p(l ? "WIZARD" : "INIT"), [b, I] = p(null), [B, u] = p([]), [h, N] = p(0), O = () => {
    process.stdout.write("\x1B[2J\x1B[3J\x1B[H"), N((e) => e + 1);
  };
  T(() => {
    if (l) return;
    const e = P();
    e.length > 0 ? (s.current = { _pendingSessions: e }, a("SESSION_MENU")) : (s.current = E(n), a("BOOT"));
  }, [n, l]), T(() => {
    let e;
    const t = () => {
      clearTimeout(e), e = setTimeout(() => {
        O();
      }, 300);
    };
    return process.stdout.on("resize", t), () => {
      process.stdout.off("resize", t), clearTimeout(e);
    };
  }, []);
  const V = (e) => {
    f(e), s.current = E(e), a("BOOT");
  }, y = (e) => {
    I(e || i), a("SETTINGS");
  }, L = (e) => {
    e && f(e), a(b || "INIT"), I(null);
  }, c = (e) => {
    if (i === "BOOT" && u((t) => t.some((m) => m.type === "BOOT") ? t : [...t, { type: "BOOT" }]), i === "INTAKE" && u((t) => t.some((m) => m.type === "INTAKE") ? t : [...t, {
      type: "INTAKE",
      data: {
        summary: s.current.intake.summary,
        assessment: s.current.intake.assessment,
        taskType: s.current.intake.taskType,
        biasing: s.current.intake.biasing
      }
    }]), i === "RETRIEVAL" && u((t) => t.some((m) => m.type === "RETRIEVAL") ? t : [...t, {
      type: "RETRIEVAL",
      data: {}
    }]), i === "ASSEMBLY" && u((t) => t.some((m) => m.type === "ASSEMBLY") ? t : [...t, {
      type: "ASSEMBLY",
      data: {
        retrievalRequested: s.current.assembly.retrievalRequested
      }
    }]), e === "DONE") {
      k();
      return;
    }
    if (e === "ASSEMBLY" && i === "RETRIEVAL" && n.stepFiles?.reviewBeforeAssembly === !0) {
      s.current.phase = "STEP_FILE_REVIEW", a("STEP_FILE_REVIEW"), R("DynaContext", "Retrieval complete — step files ready for review.");
      return;
    }
    s.current.phase = e, ["ASSEMBLY", "REVIEW"].includes(e) && W(s.current), e === "REVIEW" && i === "ASSEMBLY" && R("DynaContext", "Context package assembled — ready for review."), a(e);
  }, w = (e) => {
    e.action === "resume" ? (s.current = Y(e.id, n), u((t) => [...t, {
      type: "RESUME",
      data: {
        summary: s.current.intake.summary,
        assessment: s.current.intake.assessment,
        taskType: s.current.intake.taskType,
        biasing: s.current.intake.biasing,
        phase: s.current.phase,
        sessionId: s.current._sessionId
      }
    }]), a(s.current.phase || "INTAKE")) : e.action === "settings" ? y("SESSION_MENU") : (s.current = E(n), a("BOOT"));
  };
  let o = null;
  switch (i) {
    case "INIT":
      break;
    case "WIZARD":
      o = /* @__PURE__ */ r(
        J,
        {
          onComplete: V,
          onValidateConfig: S
        }
      );
      break;
    case "SETTINGS":
      o = /* @__PURE__ */ r(
        Z,
        {
          config: n,
          onComplete: L,
          onValidateConfig: S
        }
      );
      break;
    case "SESSION_MENU":
      o = /* @__PURE__ */ r(
        v,
        {
          sessions: s.current._pendingSessions,
          onSelect: w
        }
      );
      break;
    case "BOOT":
      o = /* @__PURE__ */ r(
        d,
        {
          config: n,
          onComplete: () => c("INTAKE")
        }
      );
      break;
    case "INTAKE":
      o = /* @__PURE__ */ r(
        $,
        {
          session: s.current,
          config: n,
          onPhaseComplete: c,
          onSettingsRequested: () => y("INTAKE")
        }
      );
      break;
    case "RETRIEVAL":
      o = /* @__PURE__ */ r(
        D,
        {
          session: s.current,
          config: n,
          onPhaseComplete: c,
          onStaticAdd: (e) => u((t) => [...t, e])
        }
      );
      break;
    case "STEP_FILE_REVIEW":
      o = /* @__PURE__ */ r(
        U,
        {
          session: s.current,
          config: n,
          onPhaseComplete: c
        }
      );
      break;
    case "ASSEMBLY":
      o = /* @__PURE__ */ r(
        q,
        {
          session: s.current,
          config: n,
          onPhaseComplete: c
        }
      );
      break;
    case "REVIEW":
      o = /* @__PURE__ */ r(
        F,
        {
          session: s.current,
          config: n,
          onPhaseComplete: c
        }
      );
      break;
  }
  return /* @__PURE__ */ M(C, { flexDirection: "column", children: [
    /* @__PURE__ */ r(K, { items: B, children: (e, t) => e.type === "RESUME" ? /* @__PURE__ */ r(G, { data: e.data }, `static-resume-${t}`) : e.type === "BOOT" ? /* @__PURE__ */ r(d, { config: n, isStatic: !0 }, `static-boot-${t}`) : e.type === "INTAKE" ? /* @__PURE__ */ r(z, { data: e.data }, `static-intake-${t}`) : e.type === "RETRIEVAL_STEP" ? /* @__PURE__ */ r(H, { data: e.data }, `static-retrieval-step-${t}`) : e.type === "RETRIEVAL" ? /* @__PURE__ */ r(j, { data: e.data }, `static-retrieval-${t}`) : e.type === "ASSEMBLY" ? /* @__PURE__ */ r(x, { data: e.data }, `static-assembly-${t}`) : null }, `history-${h}`),
    o
  ] });
}
export {
  ke as default
};
