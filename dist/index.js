#!/usr/bin/env node
import { jsx as c } from "react/jsx-runtime";
import s from "fs";
import i from "path";
import { fileURLToPath as m } from "url";
import { render as f } from "ink";
import { isFirstRun as d, loadConfig as g, ensureGlobalGitignore as u, checkRipgrep as h } from "./services/config.js";
import { validateApiKeys as a } from "./services/provider.js";
const v = m(import.meta.url), w = i.dirname(v), p = i.join(w, "..");
if (process.argv.includes("--version") || process.argv.includes("-v")) {
  const r = JSON.parse(s.readFileSync(i.join(p, "package.json"), "utf8"));
  console.log(`dynacontext v${r.version}`), process.exit(0);
}
function l(r) {
  const e = i.join(p, "prompts"), t = [
    r.intake.systemPrompt,
    r.assembly.systemPrompt,
    "intake.md",
    "assembly.md",
    "retrieval-steps.md",
    "retrieval-refinement-1b.md",
    "retrieval-refinement-2.md"
  ];
  for (const n of t) {
    const o = i.join(e, n);
    if (!s.existsSync(o))
      throw new Error(`Prompt file not found: ${n}`);
  }
}
function y(r) {
  const e = a(r);
  if (e.length > 0)
    return e;
  try {
    l(r);
  } catch (t) {
    return [t.message];
  }
  return [];
}
async function b() {
  try {
    let r = null, e = !1;
    if (d())
      e = !0;
    else {
      r = g();
      const o = a(r);
      if (o.length > 0)
        throw new Error(o.join(`
  `));
      l(r);
    }
    u(), h() || process.stderr.write(`
⚠  ripgrep (rg) not found

DynaContext uses ripgrep for fast codebase search during retrieval.
Without it, the retrieval phase will not work correctly.

Install ripgrep:
  macOS:    brew install ripgrep
  Ubuntu:   sudo apt install ripgrep
  Windows:  choco install ripgrep  OR  scoop install ripgrep
  Other:    https://github.com/BurntSushi/ripgrep#installation

`);
    const { default: t } = await import("./ui/app.js"), { waitUntilExit: n } = f(
      /* @__PURE__ */ c(
        t,
        {
          initialConfig: r,
          needsWizard: e,
          onValidateConfig: y
        }
      )
    );
    await n();
  } catch (r) {
    console.error(`
  ✗ [INIT] ${r.message}`), process.exit(1);
  }
}
b();
