#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { render } from 'ink';
import { isFirstRun, loadConfig, ensureGlobalGitignore, checkRipgrep } from './services/config.js';
import { validateApiKeys } from './services/provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, '..');

// Handle --version flag before anything else
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  console.log(`dynacontext v${pkg.version}`);
  process.exit(0);
}

/**
 * Validate that required prompt files exist in the package
 */
function validatePrompts(config) {
  const promptsDir = path.join(packageRoot, 'prompts');
  const requiredPrompts = [
    config.intake.systemPrompt,
    config.assembly.systemPrompt,
    'intake.md',
    'assembly.md',
    'retrieval-steps.md',
    'retrieval-refinement-1b.md',
    'retrieval-refinement-2.md'
  ];
  for (const promptFile of requiredPrompts) {
    const p = path.join(promptsDir, promptFile);
    if (!fs.existsSync(p)) {
      throw new Error(`Prompt file not found: ${promptFile}`);
    }
  }
}

/**
 * Validate config and return array of errors
 */
function validateConfig(config) {
  const errors = validateApiKeys(config);
  if (errors.length > 0) {
    return errors;
  }
  try {
    validatePrompts(config);
  } catch (e) {
    return [e.message];
  }
  return [];
}

async function main() {
  try {
    let config = null;
    let needsWizard = false;

    if (isFirstRun()) {
      needsWizard = true;
    } else {
      config = loadConfig();

      // Validate API keys
      const apiKeyErrors = validateApiKeys(config);
      if (apiKeyErrors.length > 0) {
        throw new Error(apiKeyErrors.join('\n  '));
      }

      // Validate prompt files
      validatePrompts(config);
    }

    // Silent environment setup (runs every launch, idempotent)
    ensureGlobalGitignore();

    // Check for ripgrep availability
    if (!checkRipgrep()) {
      const warning = `
⚠  ripgrep (rg) not found

DynaContext uses ripgrep for fast codebase search during retrieval.
Without it, the retrieval phase will not work correctly.

Install ripgrep:
  macOS:    brew install ripgrep
  Ubuntu:   sudo apt install ripgrep
  Windows:  choco install ripgrep  OR  scoop install ripgrep
  Other:    https://github.com/BurntSushi/ripgrep#installation

`;
      process.stderr.write(warning);
    }

    // Launch Ink app
    const { default: App } = await import('./ui/app.jsx');
    const { waitUntilExit } = render(
      <App
        initialConfig={config}
        needsWizard={needsWizard}
        onValidateConfig={validateConfig}
      />
    );
    await waitUntilExit();

  } catch (error) {
    console.error(`\n  ✗ [INIT] ${error.message}`);
    process.exit(1);
  }
}

main();
