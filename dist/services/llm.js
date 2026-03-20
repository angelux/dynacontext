async function _({ messages: s, systemPrompt: u, endpoint: d, model: i, apiKey: k, format: h = "openai", cache: x = !0 }) {
  const y = { type: "text", text: u };
  x && (y.cache_control = { type: "ephemeral" });
  const g = s.map((t, n) => {
    const o = n === s.length - 1, c = n === s.length - 3;
    if (x && (o || c)) {
      if (typeof t.content == "string")
        return {
          role: t.role,
          content: [
            { type: "text", text: t.content, cache_control: { type: "ephemeral" } }
          ]
        };
      if (Array.isArray(t.content) && t.content.length > 0) {
        const e = [...t.content], r = { ...e[e.length - 1] };
        return r.cache_control = { type: "ephemeral" }, e[e.length - 1] = r, {
          role: t.role,
          content: e
        };
      }
    }
    return t;
  });
  let f;
  h === "anthropic" ? f = {
    model: i,
    max_tokens: 16384,
    system: [y],
    messages: g
  } : f = {
    model: i,
    max_tokens: 16384,
    messages: [{
      role: "system",
      content: [y]
    }, ...g]
  };
  const a = 3;
  let w;
  for (let t = 1; t <= a; t++)
    try {
      const n = {
        "Content-Type": "application/json"
      };
      h === "anthropic" ? (n["x-api-key"] = k, n["anthropic-version"] = "2023-06-01") : (n.Authorization = `Bearer ${k}`, n["HTTP-Referer"] = "https://github.com/dynacontext/dynacontext", n["X-Title"] = "DynaContext");
      const o = await fetch(d, {
        method: "POST",
        headers: n,
        body: JSON.stringify(f)
      });
      if (!o.ok) {
        const l = await o.text();
        if ((o.status >= 500 || o.status === 429) && t < a) {
          await p(t * 1e3);
          continue;
        }
        throw new Error(`LLM API Error (${o.status}): ${l}`);
      }
      const c = await o.text();
      if (!c || c.trim().length === 0) {
        if (t < a) {
          await p(t * 1e3);
          continue;
        }
        throw new Error("LLM API returned an empty response after multiple retries.");
      }
      let e;
      try {
        e = JSON.parse(c);
      } catch (l) {
        if (t < a) {
          await p(t * 1e3);
          continue;
        }
        throw new Error(`Failed to parse LLM API response as JSON: ${l.message}`);
      }
      let r, m;
      return h === "anthropic" ? (r = e.content?.find((T) => T.type === "text")?.text || "", m = {
        model: i,
        inputTokens: e.usage?.input_tokens || 0,
        outputTokens: e.usage?.output_tokens || 0,
        cachedTokens: e.usage?.cache_read_input_tokens || 0
      }) : (r = e.choices?.[0]?.message?.content || "", m = {
        model: i,
        inputTokens: e.usage?.prompt_tokens || 0,
        outputTokens: e.usage?.completion_tokens || 0,
        cachedTokens: e.usage?.prompt_tokens_details?.cached_tokens || 0
      }), r = String(r).replace(/<internal-framing>[\s\S]*?<\/internal-framing>\s*/gi, "").trim(), { content: r, usage: m };
    } catch (n) {
      if (w = n, t < a) {
        await p(t * 1e3);
        continue;
      }
      throw n;
    }
  throw w || new Error("LLM API call failed after maximum retries");
}
function p(s) {
  return new Promise((u) => setTimeout(u, s));
}
export {
  _ as callLLM
};
