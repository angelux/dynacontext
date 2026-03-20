import { jsxs as d, jsx as e } from "react/jsx-runtime";
import { useState as g } from "react";
import { useInput as U, Box as r, Text as n } from "ink";
import p from "./shared/Divider.js";
import I from "./shared/SelectInput.js";
import s from "../theme.js";
import { saveConfig as Y, loadConfig as Q } from "../../services/config.js";
const u = [
  {
    key: "intake",
    label: "Intake Provider",
    description: "Model used for task intake and clarification.",
    fields: [
      { key: "endpoint", label: "Endpoint", type: "string" },
      { key: "model", label: "Model", type: "string" },
      { key: "apiKey", label: "API Key", type: "string" },
      { key: "format", label: "Format", type: "choice", options: ["openai", "anthropic"] }
    ]
  },
  {
    key: "assembly",
    label: "Assembly Provider",
    description: "Model used for context assembly.",
    fields: [
      { key: "endpoint", label: "Endpoint", type: "string" },
      { key: "model", label: "Model", type: "string" },
      { key: "apiKey", label: "API Key", type: "string" },
      { key: "format", label: "Format", type: "choice", options: ["openai", "anthropic"] }
    ]
  },
  {
    key: "agent",
    label: "Agent Provider",
    description: "Model used for retrieval agent (tool-calling).",
    fields: [
      { key: "endpoint", label: "Endpoint", type: "string" },
      { key: "model", label: "Model", type: "string" },
      { key: "apiKey", label: "API Key", type: "string" },
      { key: "format", label: "Format", type: "choice", options: ["openai", "anthropic"] }
    ]
  },
  {
    key: "output",
    label: "Output",
    description: "Output file naming and location.",
    fields: [
      { key: "filenamePrefix", label: "Filename Prefix", type: "string" },
      { key: "dir", label: "Output Directory", type: "string" }
    ]
  },
  {
    key: "stepFiles",
    label: "Step Files",
    description: "Retrieval step file behavior.",
    fields: [
      { key: "cleanup", label: "Cleanup After Assembly", type: "boolean", labels: ["Yes", "No"] },
      { key: "reviewBeforeAssembly", label: "Review Before Assembly", type: "boolean", labels: ["Yes", "No"] }
    ]
  }
];
function z({ config: $, onComplete: x, onValidateConfig: D }) {
  const [S, f] = g("sections"), [a, A] = g(0), [c, T] = g(0), [N, E] = g(""), [k, V] = g(() => JSON.parse(JSON.stringify($))), [B, F] = g(!1), [h, v] = g(null);
  U((i, t) => {
    const o = i?.toUpperCase();
    if (v(null), S === "sections") {
      t.upArrow ? A(Math.max(0, a - 1)) : t.downArrow ? A(Math.min(u.length - 1, a + 1)) : t.return ? (T(0), f("fields")) : o === "S" ? P() : (t.escape || o === "Q") && x(null);
      return;
    }
    if (S === "fields") {
      const l = u[a].fields;
      t.upArrow ? T(Math.max(0, c - 1)) : t.downArrow ? T(Math.min(l.length - 1, c + 1)) : t.return ? (l[c], E(M(a, c)), f("editing")) : (t.escape || o === "Q") && f("sections");
      return;
    }
    if (S === "editing") {
      const b = u[a].fields[c];
      if (b.type === "choice" || b.type === "boolean")
        return;
      t.return ? (C(a, c, N), f("fields")) : t.escape ? f("fields") : t.backspace || t.delete ? E((m) => m.slice(0, -1)) : i && !t.ctrl && !t.meta && E((m) => m + i);
    }
  });
  const M = (i, t) => {
    const o = u[i], l = o.fields[t];
    return k[o.key]?.[l.key] ?? "";
  }, C = (i, t, o) => {
    const l = u[i], b = l.fields[t];
    V((m) => ({
      ...m,
      [l.key]: {
        ...m[l.key],
        [b.key]: o
      }
    }));
  }, P = () => {
    try {
      Y(k);
      const i = Q(), t = D(i);
      if (t.length > 0) {
        v(t.join(`
`));
        return;
      }
      F(!0), setTimeout(() => x(i), 800);
    } catch (i) {
      v(i.message);
    }
  }, O = (i, t, o) => {
    const l = k[i]?.[t];
    return l == null ? "" : o === "boolean" ? l ? "Yes" : "No" : String(l);
  };
  if (S === "sections")
    return /* @__PURE__ */ d(r, { flexDirection: "column", children: [
      /* @__PURE__ */ e(p, {}),
      /* @__PURE__ */ e(r, { marginLeft: 2, children: /* @__PURE__ */ e(n, { bold: !0, children: "   SETTINGS" }) }),
      /* @__PURE__ */ e(p, {}),
      /* @__PURE__ */ e(r, { flexDirection: "column", marginTop: 1, marginBottom: 1, children: u.map((i, t) => {
        const o = t === a, l = o ? "❯" : " ";
        return /* @__PURE__ */ d(r, { marginLeft: 2, children: [
          /* @__PURE__ */ e(n, { color: o ? s.ui.accent : s.ui.muted, children: l }),
          /* @__PURE__ */ e(n, { children: ` ${i.label}` })
        ] }, i.key);
      }) }),
      /* @__PURE__ */ e(p, {}),
      /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(n, { dimColor: !0, children: "[↑↓] Navigate   [Enter] Edit section   [S] Save   [Q] Back" }) }),
      B && /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(n, { color: s.status.success, children: "Saved!" }) }),
      h && /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(n, { color: s.status.error, children: `Error: ${h}` }) })
    ] });
  if (S === "fields") {
    const i = u[a];
    return /* @__PURE__ */ d(r, { flexDirection: "column", children: [
      /* @__PURE__ */ e(p, {}),
      /* @__PURE__ */ d(r, { marginLeft: 2, marginTop: 1, children: [
        /* @__PURE__ */ e(n, { color: s.status.info, children: "SYS" }),
        /* @__PURE__ */ e(n, { bold: !0, children: `   SETTINGS: ${i.label.toUpperCase()}` })
      ] }),
      /* @__PURE__ */ e(p, {}),
      /* @__PURE__ */ e(r, { marginLeft: 2, children: /* @__PURE__ */ e(n, { dimColor: !0, children: i.description }) }),
      /* @__PURE__ */ e(r, { flexDirection: "column", marginTop: 1, children: i.fields.map((t, o) => {
        const l = o === c, b = l ? "❯" : " ", m = O(i.key, t.key, t.type);
        return /* @__PURE__ */ d(r, { marginLeft: 2, children: [
          /* @__PURE__ */ e(n, { color: l ? s.ui.accent : s.ui.muted, children: b }),
          /* @__PURE__ */ e(n, { children: ` ${t.label.padEnd(20)} ${m}` })
        ] }, t.key);
      }) }),
      /* @__PURE__ */ e(p, {}),
      /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(n, { dimColor: !0, children: "[↑↓] Navigate   [Enter] Edit   [Q] Back to sections" }) }),
      h && /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(n, { color: s.status.error, children: `Error: ${h}` }) })
    ] });
  }
  const w = u[a], y = w.fields[c], L = M(a, c), K = () => y.type === "string" ? "[Enter] Save   [Esc/Q] Cancel" : "[↑↓] Navigate   [Enter/Space] Select   [Esc] Cancel";
  return /* @__PURE__ */ d(r, { flexDirection: "column", children: [
    /* @__PURE__ */ e(p, {}),
    /* @__PURE__ */ d(r, { marginLeft: 2, marginTop: 1, children: [
      /* @__PURE__ */ e(n, { color: s.status.info, children: "SYS" }),
      /* @__PURE__ */ e(n, { bold: !0, children: `   EDIT: ${y.label.toUpperCase()}` })
    ] }),
    /* @__PURE__ */ e(p, {}),
    /* @__PURE__ */ d(r, { marginLeft: 2, marginTop: 1, children: [
      /* @__PURE__ */ e(n, { color: s.status.info, children: "SECTION" }),
      /* @__PURE__ */ e(n, { children: `  ${w.label}` })
    ] }),
    /* @__PURE__ */ d(r, { marginLeft: 2, marginTop: 1, children: [
      /* @__PURE__ */ e(n, { color: s.status.info, children: "CURRENT" }),
      /* @__PURE__ */ e(n, { children: `  ${L}` })
    ] }),
    y.type === "choice" && /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(
      I,
      {
        options: y.options.map((i) => ({ label: i.charAt(0).toUpperCase() + i.slice(1), value: i })),
        defaultValue: L,
        onSelect: (i) => {
          C(a, c, i), f("fields");
        },
        onCancel: () => f("fields")
      }
    ) }),
    y.type === "boolean" && /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(
      I,
      {
        options: [{ label: "Yes", value: !0 }, { label: "No", value: !1 }],
        defaultValue: L,
        onSelect: (i) => {
          C(a, c, i), f("fields");
        },
        onCancel: () => f("fields")
      }
    ) }),
    y.type === "string" && /* @__PURE__ */ d(r, { flexDirection: "column", marginTop: 1, children: [
      /* @__PURE__ */ e(r, { marginLeft: 2, children: /* @__PURE__ */ e(n, { color: s.status.info, children: "NEW VALUE" }) }),
      /* @__PURE__ */ e(r, { marginLeft: 2, children: /* @__PURE__ */ e(n, { bold: !0, children: `> ${N}█` }) })
    ] }),
    /* @__PURE__ */ e(p, {}),
    /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(n, { dimColor: !0, children: K() }) }),
    h && /* @__PURE__ */ e(r, { marginLeft: 2, marginTop: 1, children: /* @__PURE__ */ e(n, { color: s.status.error, children: `Error: ${h}` }) })
  ] });
}
export {
  z as default
};
