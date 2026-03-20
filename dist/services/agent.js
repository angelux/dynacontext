import { spawn as _ } from "child_process";
import d from "fs";
import p from "path";
const E = {
  name: "capture",
  description: [
    "Execute shell commands and/or record content to files. Four modes based on parameter combination:",
    "",
    "Mode 1 (readonly): Execute command, return output. Nothing written to file.",
    "  Use: capture(command, readonly: true)",
    "  Returns: command output",
    "",
    "Mode 2 (writeonly + command): Execute command, record output and notes to file.",
    "  Use: capture(command, file, notes, writeonly: true)",
    "  Returns: write confirmation only — command output is recorded but not returned",
    "",
    "Mode 3 (writeonly, no command): Write notes to file. No command executed.",
    "  Use: capture(notes, file, writeonly: true)",
    "  Returns: write confirmation only",
    "",
    "Mode 4 (command + file, no flags): Execute command, record output to file, and return output.",
    "  Use: capture(command, file)",
    "  Returns: command output",
    "",
    "When neither readonly nor writeonly is set and a file is provided, Mode 4 applies.",
    "When neither readonly nor writeonly is set and no file is provided, the command executes and output is returned (equivalent to Mode 1)."
  ].join(`
`),
  input_schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute. Used in Modes 1, 2, and 4. Omit for Mode 3 (notes-only)."
      },
      file: {
        type: "string",
        description: "File path to append results to. Used in Modes 2, 3, and 4. Omit for Mode 1 (readonly)."
      },
      notes: {
        type: "string",
        description: "Annotation text recorded in the file alongside command output. Required for Mode 3 (notes-only). Recommended for Mode 2 (record). Notes appear in the file as a separated annotation; they are not included in the response returned to you."
      },
      writeonly: {
        type: "boolean",
        description: "Enables Modes 2 and 3. When true, output is written to the file and the response contains only a write confirmation. Combine with command + file for Mode 2 (execute and record). Combine with notes + file for Mode 3 (notes-only)."
      },
      readonly: {
        type: "boolean",
        description: "Enables Mode 1. When true, the command executes and output is returned. Nothing is written to any file. The file and notes parameters are ignored."
      }
    },
    required: []
  },
  cache_control: { type: "ephemeral" }
};
class $ {
  constructor({ endpoint: o, model: a, apiKey: n, format: t = "anthropic", cwd: s, stepFile: e, tools: i, warningThreshold: r = 30, commandTimeout: c = 3e4, onToolCall: u, onTurnWarning: l }) {
    this.endpoint = o, this.model = a, this.apiKey = n, this.format = t, this.cwd = s || process.cwd(), this.stepFile = e || null, this.tools = i || [], this.warningThreshold = r, this.commandTimeout = c, this.onToolCall = u, this.onTurnWarning = l, this.messages = [], this.usageLog = [], this.activeChildren = /* @__PURE__ */ new Set(), this._exitHandler = () => this._killAllChildren(), process.on("exit", this._exitHandler), process.on("SIGINT", this._exitHandler);
  }
  _formatTools() {
    return this.format === "openai" ? this.tools.map((o) => ({
      type: "function",
      function: {
        name: o.name,
        description: o.description,
        parameters: o.input_schema
      }
    })) : this.tools;
  }
  async chat(o) {
    this.messages.push({ role: "user", content: o });
    let a = 0;
    for (; ; ) {
      const n = await this._callAPI();
      let t;
      if (this.format === "openai") {
        const e = n.choices?.[0]?.message || {};
        if (this.messages.push({
          role: "assistant",
          content: e.content || "",
          tool_calls: e.tool_calls || void 0
        }), t = e.tool_calls || [], t.length === 0)
          return e.content || "";
      } else {
        const e = n.content || [];
        if (this.messages.push({ role: "assistant", content: e }), t = e.filter((i) => i.type === "tool_use"), t.length === 0)
          return e.find((i) => i.type === "text")?.text || "";
      }
      const s = await Promise.all(t.map(async (e) => {
        let i, r, c;
        if (this.format === "openai") {
          i = e.function?.name, c = e.id;
          try {
            r = JSON.parse(e.function?.arguments || "{}");
          } catch (u) {
            const l = `[ERROR: Failed to parse tool arguments for ${i || "unknown"}: ${u.message}]`;
            return this._toolResponse(c, l);
          }
        } else
          i = e.name, r = e.input || {}, c = e.id;
        return i === "capture" ? this._handleCapture(c, r) : this._toolResponse(c, `[ERROR: Unknown tool "${i}".]`);
      }));
      if (this.format === "openai")
        for (const e of s)
          this.messages.push(e);
      else
        this.messages.push({ role: "user", content: s });
      a++, a === this.warningThreshold && this.onTurnWarning && this.onTurnWarning(a);
    }
  }
  async _callAPI() {
    let a, n;
    this.format === "anthropic" ? n = this.messages.map((t, s) => {
      const e = s === this.messages.length - 1, i = s === this.messages.length - 3;
      if (e || i) {
        if (typeof t.content == "string")
          return {
            role: t.role,
            content: [
              { type: "text", text: t.content, cache_control: { type: "ephemeral" } }
            ]
          };
        if (Array.isArray(t.content) && t.content.length > 0) {
          const r = [...t.content], c = { ...r[r.length - 1] };
          return c.cache_control = { type: "ephemeral" }, r[r.length - 1] = c, {
            role: t.role,
            content: r
          };
        }
      }
      return t;
    }) : n = this.messages;
    for (let t = 1; t <= 3; t++)
      try {
        const s = this.endpoint, e = { "Content-Type": "application/json" };
        this.format === "openai" ? e.Authorization = `Bearer ${this.apiKey}` : (e["x-api-key"] = this.apiKey, e["anthropic-version"] = "2023-06-01");
        const i = {
          model: this.model,
          max_tokens: 4096,
          messages: n,
          tools: this._formatTools()
        }, r = await fetch(s, {
          method: "POST",
          headers: e,
          body: JSON.stringify(i)
        });
        if (!r.ok) {
          const u = await r.text();
          if ((r.status >= 500 || r.status === 429) && t < 3) {
            const l = t * 1e3;
            await this._sleep(l);
            continue;
          }
          throw new Error(`Agent API Error (${r.status}): ${u}`);
        }
        const c = await r.text();
        if (!c || c.trim().length === 0) {
          if (t < 3) {
            const u = t * 1e3;
            await this._sleep(u);
            continue;
          }
          throw new Error("Agent API returned an empty response after multiple retries.");
        }
        try {
          const u = JSON.parse(c);
          let l;
          return this.format === "openai" ? l = {
            model: this.model,
            inputTokens: u.usage?.prompt_tokens || 0,
            outputTokens: u.usage?.completion_tokens || 0,
            cachedTokens: u.usage?.prompt_tokens_details?.cached_tokens || 0
          } : l = {
            model: this.model,
            inputTokens: u.usage?.input_tokens || 0,
            outputTokens: u.usage?.output_tokens || 0,
            cachedTokens: u.usage?.cache_read_input_tokens || 0
          }, this.usageLog.push(l), u;
        } catch (u) {
          if (t < 3) {
            const m = t * 1e3;
            await this._sleep(m);
            continue;
          }
          const l = c.length > 500 ? c.substring(0, 500) + "..." : c;
          throw new Error(
            `Failed to parse API response as JSON after 3 attempts. Error: ${u.message}. Response preview: ${l}`
          );
        }
      } catch (s) {
        if (a = s, t < 3) {
          const e = t * 1e3;
          await this._sleep(e);
          continue;
        }
        throw s;
      }
    throw a || new Error("API call failed after maximum retries");
  }
  _sleep(o) {
    return new Promise((a) => setTimeout(a, o));
  }
  _toolResponse(o, a) {
    return this.format === "openai" ? { role: "tool", tool_call_id: o, content: a } : { type: "tool_result", tool_use_id: o, content: a };
  }
  _isDirectStepFileWrite(o) {
    return this.stepFile ? o.includes(this.stepFile) && /(>>|>|<<|tee\s)/.test(o) : !1;
  }
  _rcmPruneMessages(o = 3) {
    const a = o * 2, n = this.messages.length - a;
    if (!(n <= 1))
      for (let t = 1; t < n; t++) {
        const s = this.messages[t];
        if (this.format === "openai") {
          if (s.role === "tool" && typeof s.content == "string") {
            const e = (s.content.match(/\n/g) || []).length + 1;
            e > 5 && (s.content = `[RCM: Archived - ${e} lines. Current captures available in step file.]`);
          }
          s.role === "assistant" && typeof s.content == "string" && s.content.length > 200 && (s.content = "[RCM: Reasoning archived.]");
        } else
          s.role === "user" && Array.isArray(s.content) && (s.content = s.content.map((e) => {
            if (e.type === "tool_result" && typeof e.content == "string") {
              const i = (e.content.match(/\n/g) || []).length + 1;
              if (i > 5)
                return {
                  ...e,
                  content: `[RCM: Archived - ${i} lines. Current captures available in step file.]`
                };
            }
            return e;
          })), s.role === "assistant" && Array.isArray(s.content) && (s.content = s.content.map((e) => e.type === "text" && e.text && e.text.length > 200 ? { ...e, text: "[RCM: Reasoning archived.]" } : e));
      }
  }
  _rcmBuildContextRefresh() {
    const o = p.join(this.cwd, this.stepFile);
    if (!d.existsSync(o))
      return "[Write successful. Step file not yet readable.]";
    const a = d.readFileSync(o, "utf-8");
    return [
      `[RCM: Write successful - ${(a.match(/\n/g) || []).length + 1} lines in ${this.stepFile}]`,
      "",
      "Previous command outputs have been archived. Your current captures:",
      "",
      "---",
      a,
      "---",
      "",
      "Continue retrieval from where you left off."
    ].join(`
`);
  }
  async _handleCapture(o, a) {
    const { command: n, file: t, notes: s, writeonly: e, readonly: i } = a || {};
    if (e && i)
      return this._toolResponse(o, "[ERROR: writeonly and readonly cannot both be true.]");
    if (e) {
      if (n) {
        if (!t)
          return this._toolResponse(o, '[ERROR: writeonly+command mode requires "file".]');
        if (this._isDirectStepFileWrite(n))
          return this._toolResponse(o, "[ERROR: Direct file writes via command not allowed. Use capture file modes instead.]");
        this.onToolCall && this.onToolCall(n, "running");
        const h = await this._executeCommand(n);
        this.onToolCall && (h.includes("[ERROR]") || h.includes("[TIMEOUT") ? this.onToolCall(n, "error") : this.onToolCall(n, "done"));
        const y = p.join(this.cwd, t), g = s ? `:::command+note
source: ${n}
---
${h}
---
${s}
:::

` : `:::command
source: ${n}
---
${h}
:::

`;
        try {
          d.appendFileSync(y, g);
        } catch (R) {
          return this._toolResponse(o, `[WARNING: Failed to append to ${t}: ${R.message}]`);
        }
        return this.messages.length > 20 && this._rcmPruneMessages(), this._toolResponse(o, `[Write successful to ${t}]`);
      }
      if (!s || !t)
        return this._toolResponse(o, '[ERROR: writeonly mode requires both "notes" and "file".]');
      const l = `[note -> ${t}]`;
      this.onToolCall && this.onToolCall(l, "running");
      const m = `:::note
---
${s}
:::

`, f = p.join(this.cwd, t);
      try {
        d.appendFileSync(f, m);
      } catch (h) {
        return this.onToolCall && this.onToolCall(l, "error"), this._toolResponse(o, `[ERROR: Failed to write to ${t}: ${h.message}]`);
      }
      return this.onToolCall && this.onToolCall(l, "done"), this.messages.length > 20 && this._rcmPruneMessages(), this._toolResponse(o, `[Write successful to ${t}]`);
    }
    if (i) {
      if (!n)
        return this._toolResponse(o, '[ERROR: readonly mode requires "command".]');
      this.onToolCall && this.onToolCall(n, "running");
      const l = await this._executeCommand(n);
      return this.onToolCall && (l.includes("[ERROR]") || l.includes("[TIMEOUT") ? this.onToolCall(n, "error") : this.onToolCall(n, "done")), this._toolResponse(o, l);
    }
    if (!n || !t)
      return this._toolResponse(o, '[ERROR: capture requires "command" and "file" (or use writeonly/readonly mode).]');
    if (this._isDirectStepFileWrite(n))
      return this._toolResponse(o, "[ERROR: Direct file writes via command not allowed. Use writeonly mode to write notes to the step file.]");
    this.onToolCall && this.onToolCall(n, "running");
    const r = await this._executeCommand(n);
    this.onToolCall && (r.includes("[ERROR]") || r.includes("[TIMEOUT") ? this.onToolCall(n, "error") : this.onToolCall(n, "done"));
    const c = p.join(this.cwd, t), u = s ? `:::command+note
source: ${n}
---
${r}
---
${s}
:::

` : `:::command
source: ${n}
---
${r}
:::

`;
    try {
      d.appendFileSync(c, u);
    } catch (l) {
      return this._toolResponse(o, `${r}

[WARNING: Failed to append to ${t}: ${l.message}]`);
    }
    return this.messages.length > 20 && this._rcmPruneMessages(), this._toolResponse(o, r);
  }
  _executeCommand(o) {
    return new Promise((a) => {
      const n = _(o, { shell: !0, cwd: this.cwd });
      this.activeChildren.add(n);
      let t = "", s = "";
      const e = setTimeout(() => {
        n.kill(), a(`[TIMEOUT after ${this.commandTimeout}ms]`);
      }, this.commandTimeout);
      n.stdout.on("data", (i) => {
        t += i;
      }), n.stderr.on("data", (i) => {
        s += i;
      }), n.on("close", (i) => {
        clearTimeout(e), this.activeChildren.delete(n);
        let r = (t + s).replace(/[^\x20-\x7E\x09\x0A\x0D]/g, "").trim();
        a(i !== 0 ? `[ERROR - Exit Code ${i}]
${r}` : r || "[Success - No Output]");
      });
    });
  }
  _killAllChildren() {
    for (const o of this.activeChildren)
      try {
        o.kill("SIGKILL");
      } catch {
      }
    this.activeChildren.clear();
  }
  async end() {
    this._killAllChildren(), this._exitHandler && (process.removeListener("exit", this._exitHandler), process.removeListener("SIGINT", this._exitHandler));
  }
}
export {
  $ as AgentSession,
  E as captureTool
};
