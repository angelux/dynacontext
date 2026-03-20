import t from "fs";
import s from "path";
import c from "os";
import { execSync as l } from "child_process";
const d = ".dynacontext", u = "config.json", r = {
  intake: { systemPrompt: "system-prompt.md" },
  assembly: { systemPrompt: "system-prompt.md" },
  agent: { warningThreshold: 100, commandTimeout: 3e4 },
  retrieval: { stepCount: 4, refinement: {} }
};
function f() {
  return s.join(c.homedir(), d);
}
function p() {
  return s.join(f(), u);
}
function b() {
  return !t.existsSync(p());
}
function g(e) {
  return {
    intake: {
      ...r.intake,
      ...e.intake
    },
    assembly: {
      ...r.assembly,
      ...e.assembly
    },
    agent: {
      ...r.agent,
      ...e.agent
    },
    retrieval: {
      ...r.retrieval
    },
    output: {
      ...e.output
    },
    stepFiles: {
      ...e.stepFiles
    }
  };
}
function k() {
  const e = p();
  if (!t.existsSync(e))
    throw new Error(`Config file not found: ${e}`);
  const i = t.readFileSync(e, "utf8"), o = JSON.parse(i);
  return g(o);
}
function v(e) {
  const i = f();
  t.existsSync(i) || t.mkdirSync(i, { recursive: !0 });
  const o = {
    intake: {
      endpoint: e.intake?.endpoint,
      model: e.intake?.model,
      apiKey: e.intake?.apiKey,
      format: e.intake?.format
    },
    assembly: {
      endpoint: e.assembly?.endpoint,
      model: e.assembly?.model,
      apiKey: e.assembly?.apiKey,
      format: e.assembly?.format
    },
    agent: {
      endpoint: e.agent?.endpoint,
      model: e.agent?.model,
      apiKey: e.agent?.apiKey,
      format: e.agent?.format
    },
    output: {
      filenamePrefix: e.output?.filenamePrefix,
      dir: e.output?.dir
    },
    stepFiles: {
      cleanup: e.stepFiles?.cleanup,
      reviewBeforeAssembly: e.stepFiles?.reviewBeforeAssembly
    }
  };
  t.writeFileSync(p(), JSON.stringify(o, null, 2), "utf8");
}
function w() {
  try {
    let e;
    try {
      const n = l("git config --global core.excludesFile", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"]
      }).trim();
      n && (e = n.startsWith("~") ? s.join(c.homedir(), n.slice(1).replace(/^\//, "")) : n);
    } catch {
    }
    e || (e = s.join(c.homedir(), ".config", "git", "ignore"));
    const i = "**/.dynacontext/*/session.json", o = "# DynaContext session files";
    if (t.existsSync(e) && t.readFileSync(e, "utf8").includes(i))
      return;
    const m = s.dirname(e);
    t.existsSync(m) || t.mkdirSync(m, { recursive: !0 });
    let a = "";
    if (t.existsSync(e)) {
      const n = t.readFileSync(e, "utf8");
      (n.length > 0 && !n.endsWith(`
`) || n.length > 0) && (a = `
`);
    }
    const y = `${a}${o}
${i}
`;
    t.appendFileSync(e, y, "utf8");
  } catch {
  }
}
function D() {
  try {
    return l("rg --version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }), !0;
  } catch {
    return !1;
  }
}
export {
  D as checkRipgrep,
  w as ensureGlobalGitignore,
  f as getConfigDir,
  p as getConfigPath,
  b as isFirstRun,
  k as loadConfig,
  v as saveConfig
};
