import { jsxs as l, jsx as e } from "react/jsx-runtime";
import { useState as v } from "react";
import { useInput as j, Box as t, Text as i } from "ink";
import f from "./shared/Divider.js";
import V from "./shared/SelectInput.js";
import o from "../theme.js";
import { saveConfig as W, loadConfig as z } from "../../services/config.js";
const A = [
  { id: "welcome", title: "Welcome", hasFields: !1 },
  { id: "intake", title: "Intake Provider", section: "intake", fieldCount: 4 },
  { id: "assembly", title: "Assembly Provider", section: "assembly", fieldCount: 4 },
  { id: "agent", title: "Agent Provider", section: "agent", fieldCount: 4 },
  { id: "output", title: "Output Settings", section: "output", fieldCount: 2 },
  { id: "stepFiles", title: "Step File Behavior", section: "stepFiles", fieldCount: 2 },
  { id: "confirm", title: "Configuration Summary", hasFields: !1 }
], D = {
  intake: [
    {
      key: "endpoint",
      label: "ENDPOINT",
      description: "API endpoint URL",
      hint: "Full URL for the intake LLM API (e.g. https://api.openai.com/v1/chat/completions)",
      required: !0
    },
    {
      key: "model",
      label: "MODEL",
      description: "Model identifier",
      hint: "Model name as recognized by your provider (e.g. gpt-4o, deepseek/deepseek-v3.2)",
      required: !0
    },
    {
      key: "apiKey",
      label: "API KEY",
      description: "API key or env var",
      hint: "Environment variable name (e.g. OPENAI_API_KEY) or the literal API key",
      required: !0
    },
    {
      key: "format",
      label: "FORMAT",
      description: "API format",
      type: "choice",
      options: ["openai", "anthropic"],
      defaultValue: "openai"
    }
  ],
  assembly: [
    {
      key: "endpoint",
      label: "ENDPOINT",
      description: "API endpoint URL",
      hint: "Full URL for the assembly LLM API",
      required: !0
    },
    {
      key: "model",
      label: "MODEL",
      description: "Model identifier",
      hint: "Model name for context assembly (e.g. claude-opus-4.6, gpt-4o)",
      required: !0
    },
    {
      key: "apiKey",
      label: "API KEY",
      description: "API key or env var",
      hint: "Environment variable name or literal API key for the assembly provider",
      required: !0
    },
    {
      key: "format",
      label: "FORMAT",
      description: "API format",
      type: "choice",
      options: ["openai", "anthropic"],
      defaultValue: "openai"
    }
  ],
  agent: [
    {
      key: "endpoint",
      label: "ENDPOINT",
      description: "API endpoint URL",
      hint: "Full URL for the retrieval agent API (e.g. https://api.anthropic.com/v1/messages)",
      required: !0
    },
    {
      key: "model",
      label: "MODEL",
      description: "Model identifier",
      hint: "Model name for the tool-calling retrieval agent (e.g. claude-sonnet-4-20250514)",
      required: !0
    },
    {
      key: "apiKey",
      label: "API KEY",
      description: "API key or env var",
      hint: "Environment variable name or literal API key for the agent provider",
      required: !0
    },
    {
      key: "format",
      label: "FORMAT",
      description: "API format",
      type: "choice",
      options: ["openai", "anthropic"],
      defaultValue: "anthropic"
    }
  ],
  output: [
    {
      key: "filenamePrefix",
      label: "FILENAME PREFIX",
      description: "Output file prefix",
      hint: "Prefix for generated context files",
      defaultValue: "DYNA"
    },
    {
      key: "dir",
      label: "OUTPUT DIRECTORY",
      description: "Output directory path",
      hint: "Directory where context files are saved (relative to project root)",
      defaultValue: "."
    }
  ],
  stepFiles: [
    {
      key: "cleanup",
      label: "CLEANUP",
      description: "Remove step files after assembly?",
      type: "boolean",
      defaultValue: !0
    },
    {
      key: "reviewBeforeAssembly",
      label: "REVIEW",
      description: "Review before assembly?",
      type: "boolean",
      defaultValue: !0
    }
  ]
};
function ee({ onComplete: Y, onValidateConfig: B }) {
  const [a, k] = v(0), [c, q] = v(() => ({
    intake: { endpoint: "", model: "", apiKey: "", format: "openai" },
    assembly: { endpoint: "", model: "", apiKey: "", format: "openai" },
    agent: { endpoint: "", model: "", apiKey: "", format: "anthropic" },
    output: { filenamePrefix: "DYNA", dir: "." },
    stepFiles: { cleanup: !0, reviewBeforeAssembly: !0 }
  })), [m, h] = v(0), [T, L] = v(""), [y, $] = v(null), [O, E] = v(null), b = A[a], C = () => {
    if (E(null), L(""), m > 0)
      h(m - 1);
    else if (a > 1) {
      const r = A[a - 1];
      r.fieldCount && (k(a - 1), h(r.fieldCount - 1));
    } else a === 1 && (k(0), h(0));
  }, F = () => {
    E(null), L("");
    const r = b.section, n = D[r];
    m < n.length - 1 ? h(m + 1) : (k(a + 1), h(0));
  };
  j((r, n) => {
    if ($(null), a === 0) {
      k(1), h(0), L("");
      return;
    }
    if (a === A.length - 1) {
      const u = r?.toUpperCase();
      if (u === "Y")
        w();
      else if (u === "B") {
        k(a - 1);
        const p = A[a - 1];
        p.fieldCount && h(p.fieldCount - 1);
      }
      return;
    }
    const d = b.section, s = D[d][m];
    if (!(s.type === "choice" || s.type === "boolean")) {
      if (n.escape) {
        C();
        return;
      }
      if (n.return) {
        const u = T.trim() || S(d, s.key);
        if (s.required && !u) {
          E("This field is required");
          return;
        }
        x(d, s.key, u), F();
        return;
      }
      if (n.backspace || n.delete) {
        L((u) => u.slice(0, -1)), E(null);
        return;
      }
      r && !n.ctrl && !n.meta && (L((u) => u + r), E(null));
    }
  });
  const S = (r, n) => c[r]?.[n] ?? "", x = (r, n, d) => {
    q((g) => ({
      ...g,
      [r]: {
        ...g[r],
        [n]: d
      }
    }));
  }, w = () => {
    try {
      W(c);
      const r = z(), n = B(r);
      if (n.length > 0) {
        $(n.join(`
`));
        return;
      }
      Y(r);
    } catch (r) {
      $(r.message);
    }
  };
  if (a === 0)
    return /* @__PURE__ */ l(t, { flexDirection: "column", children: [
      /* @__PURE__ */ e(f, {}),
      /* @__PURE__ */ e(t, { marginLeft: 1, children: /* @__PURE__ */ e(i, { bold: !0, children: "DYNACONTEXT - FIRST RUN SETUP" }) }),
      /* @__PURE__ */ e(f, {}),
      /* @__PURE__ */ e(t, { marginLeft: 1, marginTop: 1, children: /* @__PURE__ */ e(i, { children: "Welcome. This wizard will configure your API providers and output preferences." }) }),
      /* @__PURE__ */ e(t, { marginLeft: 1, marginTop: 1, children: /* @__PURE__ */ e(i, { children: "Configuration will be saved to ~/.dynacontext/config.json" }) }),
      /* @__PURE__ */ e(t, { marginLeft: 1, marginTop: 1, children: /* @__PURE__ */ e(i, { children: "Press any key to begin." }) }),
      y && /* @__PURE__ */ e(t, { marginLeft: 1, marginTop: 1, children: /* @__PURE__ */ e(i, { color: o.status.error, children: `Error: ${y}` }) })
    ] });
  if (a === A.length - 1)
    return /* @__PURE__ */ l(t, { flexDirection: "column", children: [
      /* @__PURE__ */ e(f, {}),
      /* @__PURE__ */ l(t, { marginLeft: 2, marginTop: 1, children: [
        /* @__PURE__ */ e(i, { color: o.status.info, children: "SYS" }),
        /* @__PURE__ */ e(i, { bold: !0, children: "   CONFIGURATION SUMMARY" })
      ] }),
      /* @__PURE__ */ e(f, {}),
      /* @__PURE__ */ l(t, { marginLeft: 2, marginTop: 1, children: [
        /* @__PURE__ */ e(i, { color: o.status.info, children: "INTAKE" }),
        /* @__PURE__ */ e(i, { children: `      ${c.intake.model} @ ${c.intake.endpoint.slice(0, 30)}...` })
      ] }),
      /* @__PURE__ */ l(t, { marginLeft: 2, marginTop: 1, children: [
        /* @__PURE__ */ e(i, { color: o.status.info, children: "ASSEMBLY" }),
        /* @__PURE__ */ e(i, { children: `    ${c.assembly.model} @ ${c.assembly.endpoint.slice(0, 30)}...` })
      ] }),
      /* @__PURE__ */ l(t, { marginLeft: 2, marginTop: 1, children: [
        /* @__PURE__ */ e(i, { color: o.status.info, children: "AGENT" }),
        /* @__PURE__ */ e(i, { children: `       ${c.agent.model} @ ${c.agent.endpoint.slice(0, 30)}...` })
      ] }),
      /* @__PURE__ */ l(t, { marginLeft: 2, marginTop: 1, children: [
        /* @__PURE__ */ e(i, { color: o.status.info, children: "OUTPUT" }),
        /* @__PURE__ */ e(i, { children: `      ${c.output.filenamePrefix} / ${c.output.dir}` })
      ] }),
      /* @__PURE__ */ l(t, { marginLeft: 2, marginTop: 1, children: [
        /* @__PURE__ */ e(i, { color: o.status.info, children: "STEP FILES" }),
        /* @__PURE__ */ e(i, { children: `  cleanup: ${c.stepFiles.cleanup ? "yes" : "no"} / review: ${c.stepFiles.reviewBeforeAssembly ? "yes" : "no"}` })
      ] }),
      /* @__PURE__ */ e(f, {}),
      /* @__PURE__ */ e(t, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(i, { dimColor: !0, children: "[Y] Save and continue   [B] Go back" }) }),
      y && /* @__PURE__ */ e(t, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(i, { color: o.status.error, children: `Error: ${y}` }) })
    ] });
  const I = b.section, R = D[I], N = R[m], P = S(I, N.key), U = T || P, M = !T && !P, K = () => N.type === "choice" || N.type === "boolean" ? "[↑↓] Navigate   [Enter/Space] Select   [Esc] Back" : "[Enter] Confirm   [Esc] Back";
  return /* @__PURE__ */ l(t, { flexDirection: "column", children: [
    /* @__PURE__ */ e(f, {}),
    /* @__PURE__ */ e(t, { marginLeft: 1, children: /* @__PURE__ */ e(i, { bold: !0, children: `SETUP: ${b.title.toUpperCase()}` }) }),
    /* @__PURE__ */ e(f, {}),
    /* @__PURE__ */ e(t, { marginLeft: 1, marginTop: 1, children: /* @__PURE__ */ e(i, { children: `${b.section === "stepFiles" ? "Configure step file behavior options." : `Configure the ${b.section} provider.`}` }) }),
    /* @__PURE__ */ e(t, { flexDirection: "column", marginTop: 1, children: R.map((r, n) => {
      const d = n === m, g = d ? U : S(I, r.key), s = d ? ">" : " ";
      if (r.type === "choice")
        return d ? /* @__PURE__ */ l(t, { flexDirection: "column", marginLeft: 2, children: [
          /* @__PURE__ */ e(t, { children: /* @__PURE__ */ e(i, { color: o.status.info, children: `${s} ${r.label}` }) }),
          /* @__PURE__ */ e(t, { marginLeft: 4, children: /* @__PURE__ */ e(
            V,
            {
              options: r.options.map((p) => ({ label: p.charAt(0).toUpperCase() + p.slice(1), value: p })),
              defaultValue: P,
              onSelect: (p) => {
                x(I, r.key, p), F();
              },
              onCancel: C
            }
          ) })
        ] }, r.key) : /* @__PURE__ */ l(t, { marginLeft: 2, children: [
          /* @__PURE__ */ e(i, { color: o.ui.muted, children: `${s} ${r.label}` }),
          /* @__PURE__ */ e(i, { children: "  " }),
          /* @__PURE__ */ e(i, { children: g })
        ] }, r.key);
      if (r.type === "boolean")
        return d ? /* @__PURE__ */ l(t, { flexDirection: "column", marginLeft: 2, children: [
          /* @__PURE__ */ e(t, { children: /* @__PURE__ */ e(i, { color: o.status.info, children: `${s} ${r.label}  ${r.description}` }) }),
          /* @__PURE__ */ e(t, { marginLeft: 4, children: /* @__PURE__ */ e(
            V,
            {
              options: [{ label: "Yes", value: !0 }, { label: "No", value: !1 }],
              defaultValue: P,
              onSelect: (p) => {
                x(I, r.key, p), F();
              },
              onCancel: C
            }
          ) })
        ] }, r.key) : /* @__PURE__ */ l(t, { marginLeft: 2, children: [
          /* @__PURE__ */ e(i, { color: o.ui.muted, children: `${s} ${r.label}` }),
          /* @__PURE__ */ e(i, { children: "  " }),
          /* @__PURE__ */ e(i, { children: g ? "Yes" : "No" })
        ] }, r.key);
      if (d)
        return /* @__PURE__ */ l(t, { flexDirection: "column", marginLeft: 2, children: [
          /* @__PURE__ */ l(t, { children: [
            /* @__PURE__ */ e(i, { color: o.status.info, children: `${s} ${r.label}` }),
            /* @__PURE__ */ e(i, { children: "  " }),
            /* @__PURE__ */ e(i, { bold: !0, children: `${U}${M ? "" : "█"}` })
          ] }),
          M && /* @__PURE__ */ e(t, { marginLeft: 4, children: /* @__PURE__ */ e(i, { dimColor: !0, color: o.ui.muted, children: r.hint || "" }) }),
          O && /* @__PURE__ */ e(t, { marginLeft: 4, children: /* @__PURE__ */ e(i, { color: o.status.error, children: O }) })
        ] }, r.key);
      const u = g || "—";
      return /* @__PURE__ */ l(t, { marginLeft: 2, children: [
        /* @__PURE__ */ e(i, { color: o.ui.muted, children: `${s} ${r.label}` }),
        /* @__PURE__ */ e(i, { children: "  " }),
        /* @__PURE__ */ e(i, { children: u })
      ] }, r.key);
    }) }),
    /* @__PURE__ */ e(f, {}),
    /* @__PURE__ */ e(t, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(i, { dimColor: !0, children: K() }) }),
    y && /* @__PURE__ */ e(t, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(i, { color: o.status.error, children: `Error: ${y}` }) })
  ] });
}
export {
  ee as default
};
