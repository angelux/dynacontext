function a(e = {}) {
  const n = e.apiKey, o = process.env[n] || n;
  if (!o)
    throw new Error(
      "API key is not configured for this provider. Check your settings in ~/.dynacontext/config.json."
    );
  return {
    endpoint: e.endpoint,
    model: e.model,
    apiKey: o,
    format: e.format || "openai"
  };
}
const i = /^[A-Z][A-Z0-9_]*$/;
function p(e) {
  const n = [], o = [
    { name: "intake", section: e.intake },
    { name: "assembly", section: e.assembly },
    { name: "agent", section: e.agent }
  ];
  for (const { name: s, section: r } of o) {
    if (!r?.apiKey) {
      n.push(`No API key configured for ${s}.`);
      continue;
    }
    const t = r.apiKey;
    i.test(t) && !process.env[t] && n.push(
      `Environment variable "${t}" (used by ${s}) is not set.`
    );
  }
  return n;
}
export {
  a as resolveProvider,
  p as validateApiKeys
};
