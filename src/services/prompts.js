import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// src/services/prompts.js -> ../../ -> package root
const packageRoot = path.join(__dirname, '..', '..');

export function loadPrompt(filename) {
  const p = path.join(packageRoot, 'prompts', filename);
  if (!fs.existsSync(p)) {
    throw new Error(`Prompt file not found: ${filename}`);
  }
  return fs.readFileSync(p, 'utf8');
}

export function loadStepHeader(stepNumber) {
  return loadPrompt(`step-headers/step${stepNumber}.md`);
}

export function composeIntakePrompt(config) {
  const systemPromptTemplate = loadPrompt(config.intake.systemPrompt);
  const intakeInstructions = loadPrompt('intake.md');

  let composed = systemPromptTemplate.replace('{{PHASE_INSTRUCTIONS}}', intakeInstructions);
  composed += '\n\n';

  return composed;
}

export function composeAssemblyPrompt(config) {
  const systemPromptTemplate = loadPrompt(config.assembly.systemPrompt);
  const assemblyInstructions = loadPrompt('assembly.md');

  let composed = systemPromptTemplate.replace('{{PHASE_INSTRUCTIONS}}', assemblyInstructions);
  composed += '\n\n';

  return composed;
}

export function composeRetrievalStepPrompts({ taskSummary, taskType, config }) {
  const stepsTemplate = loadPrompt('retrieval-steps.md');
  const steps = stepsTemplate.split(/---STEP_\d+---/).filter(s => s.trim().length > 0);

  const preamblePath = `preambles/${taskType}.md`;
  let preamble = '';
  try {
    preamble = loadPrompt(preamblePath);
  } catch (e) {
    // If preamble for taskType doesn't exist, use empty
  }

  return steps.map((step, index) => {
    let composed = step
      .replace(/{{TASK_SUMMARY}}/g, taskSummary)
      .replace(/{{TASK_TYPE_PREAMBLE}}/g, preamble);

    return composed;
  });
}
