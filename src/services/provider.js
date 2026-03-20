/**
 * Resolve provider settings from a config section.
 * Supports both environment variable names (e.g., "OPENROUTER_API_KEY") and
 * literal API key values. Tries env var lookup first, falls back to literal.
 *
 * @param {Object} configSection
 * @returns {{ endpoint: string, model: string, apiKey: string, format: string }}
 */
export function resolveProvider(configSection = {}) {
  const apiKeyValue = configSection.apiKey;

  // Try env var lookup first, fall back to literal value
  const apiKey = process.env[apiKeyValue] || apiKeyValue;

  if (!apiKey) {
    throw new Error(
      `API key is not configured for this provider. ` +
      `Check your settings in ~/.dynacontext/config.json.`
    );
  }

  return {
    endpoint: configSection.endpoint,
    model: configSection.model,
    apiKey,
    format: configSection.format || 'openai'
  };
}

/**
 * Pattern for detecting environment variable names (ALL_CAPS_WITH_UNDERSCORES)
 */
const ENV_VAR_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Validate API keys across all provider config sections.
 * Returns an array of error messages (empty if all valid).
 *
 * For values that look like env var names (match ENV_VAR_PATTERN),
 * verifies that the environment variable is set.
 * For literal key values (don't match pattern), no validation needed.
 *
 * @param {Object} config
 * @returns {string[]} Array of error messages
 */
export function validateApiKeys(config) {
  const errors = [];
  const sections = [
    { name: 'intake', section: config.intake },
    { name: 'assembly', section: config.assembly },
    { name: 'agent', section: config.agent },
  ];

  for (const { name, section } of sections) {
    if (!section?.apiKey) {
      errors.push(`No API key configured for ${name}.`);
      continue;
    }

    const value = section.apiKey;

    // If it looks like an env var name, verify it resolves
    if (ENV_VAR_PATTERN.test(value) && !process.env[value]) {
      errors.push(
        `Environment variable "${value}" (used by ${name}) is not set.`
      );
    }
    // If it doesn't match the env var pattern, it's treated as a literal key — no validation needed
  }

  return errors;
}
