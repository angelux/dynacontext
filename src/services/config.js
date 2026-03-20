import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const CONFIG_DIR = '.dynacontext';
const CONFIG_FILE = 'config.json';

// System-internal defaults that are never saved to user config
// They are merged at load time
const SYSTEM_DEFAULTS = {
  intake: { systemPrompt: 'system-prompt.md' },
  assembly: { systemPrompt: 'system-prompt.md' },
  agent: { warningThreshold: 100, commandTimeout: 30000 },
  retrieval: { stepCount: 4, refinement: {} },
};

/**
 * Get the path to the global config directory (~/.dynacontext)
 * @returns {string}
 */
export function getConfigDir() {
  return path.join(os.homedir(), CONFIG_DIR);
}

/**
 * Get the full path to the config file (~/.dynacontext/config.json)
 * @returns {string}
 */
export function getConfigPath() {
  return path.join(getConfigDir(), CONFIG_FILE);
}

/**
 * Check if this is the first run (config file doesn't exist)
 * @returns {boolean}
 */
export function isFirstRun() {
  return !fs.existsSync(getConfigPath());
}

/**
 * Merge user config with system defaults
 * @param {Object} userConfig
 * @returns {Object} Merged runtime config
 */
function mergeWithDefaults(userConfig) {
  return {
    intake: {
      ...SYSTEM_DEFAULTS.intake,
      ...userConfig.intake
    },
    assembly: {
      ...SYSTEM_DEFAULTS.assembly,
      ...userConfig.assembly
    },
    agent: {
      ...SYSTEM_DEFAULTS.agent,
      ...userConfig.agent
    },
    retrieval: {
      ...SYSTEM_DEFAULTS.retrieval
    },
    output: {
      ...userConfig.output
    },
    stepFiles: {
      ...userConfig.stepFiles
    }
  };
}

/**
 * Load config from ~/.dynacontext/config.json and merge with system defaults
 * @returns {Object} Full runtime config
 * @throws {Error} If config file doesn't exist or is invalid JSON
 */
export function loadConfig() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const userConfig = JSON.parse(raw);

  return mergeWithDefaults(userConfig);
}

/**
 * Save config to ~/.dynacontext/config.json
 * Only user-configurable fields are saved (system defaults are stripped)
 * @param {Object} userConfig
 */
export function saveConfig(userConfig) {
  const configDir = getConfigDir();

  // Ensure config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Strip system-default fields that might have leaked in
  const toSave = {
    intake: {
      endpoint: userConfig.intake?.endpoint,
      model: userConfig.intake?.model,
      apiKey: userConfig.intake?.apiKey,
      format: userConfig.intake?.format
    },
    assembly: {
      endpoint: userConfig.assembly?.endpoint,
      model: userConfig.assembly?.model,
      apiKey: userConfig.assembly?.apiKey,
      format: userConfig.assembly?.format
    },
    agent: {
      endpoint: userConfig.agent?.endpoint,
      model: userConfig.agent?.model,
      apiKey: userConfig.agent?.apiKey,
      format: userConfig.agent?.format
    },
    output: {
      filenamePrefix: userConfig.output?.filenamePrefix,
      dir: userConfig.output?.dir
    },
    stepFiles: {
      cleanup: userConfig.stepFiles?.cleanup,
      reviewBeforeAssembly: userConfig.stepFiles?.reviewBeforeAssembly
    }
  };

  fs.writeFileSync(getConfigPath(), JSON.stringify(toSave, null, 2), 'utf8');
}

/**
 * Get default user config template with empty/default values
 * Used by the first-run wizard
 * @returns {Object}
 */
export function getDefaultUserConfig() {
  return {
    intake: { endpoint: '', model: '', apiKey: '', format: 'openai' },
    assembly: { endpoint: '', model: '', apiKey: '', format: 'openai' },
    agent: { endpoint: '', model: '', apiKey: '', format: 'anthropic' },
    output: { filenamePrefix: 'DYNA', dir: '.' },
    stepFiles: { cleanup: true, reviewBeforeAssembly: true }
  };
}

/**
 * Ensure global gitignore contains DynaContext session file exclusion
 * Runs silently on every launch, idempotent, fails gracefully
 */
export function ensureGlobalGitignore() {
  try {
    let gitignorePath;

    // Try to get path from git config
    try {
      const configOutput = execSync('git config --global core.excludesFile', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      if (configOutput) {
        // Expand ~ to home directory
        gitignorePath = configOutput.startsWith('~')
          ? path.join(os.homedir(), configOutput.slice(1).replace(/^\//, ''))
          : configOutput;
      }
    } catch {
      // Git config failed, will use fallback
    }

    // Fallback to XDG default if no config or empty output
    if (!gitignorePath) {
      gitignorePath = path.join(os.homedir(), '.config', 'git', 'ignore');
    }

    const entry = '**/.dynacontext/*/session.json';
    const comment = '# DynaContext session files';

    // Check if file exists and already contains the entry
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      if (content.includes(entry)) {
        return;
      }
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(gitignorePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Determine if we need a leading newline
    let prefix = '';
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      if (content.length > 0 && !content.endsWith('\n')) {
        prefix = '\n';
      } else if (content.length > 0) {
        prefix = '\n';
      }
    }

    // Append the entry
    const toAppend = `${prefix}${comment}\n${entry}\n`;
    fs.appendFileSync(gitignorePath, toAppend, 'utf8');
  } catch {
    // Silently fail - this is a convenience feature, not a requirement
  }
}

/**
 * Check if ripgrep (rg) is available in the system PATH
 * @returns {boolean} true if rg is available, false otherwise
 */
export function checkRipgrep() {
  try {
    execSync('rg --version', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return true;
  } catch {
    return false;
  }
}
