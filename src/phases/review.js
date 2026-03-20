import fs from 'fs';
import path from 'path';
import { AgentSession } from '../services/agent.js';
import { resolveProvider } from '../services/provider.js';

export function saveAssemblyOutput(session) {
  const counter = String(++session.assembly.saveCount).padStart(2, '0');

  let title = session.intake.summary;
  const titleMatch = session.assembly.content.match(/^# (.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }

  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  const prefix = session.config.output.filenamePrefix;
  const filename = `${prefix}_${counter}-${slug}.md`;
  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, session.assembly.content);

  const statsFilename = `${prefix}_${counter}-stats.md`;
  const statsPath = path.join(process.cwd(), statsFilename);
  const statsContent = formatStats(session.stats);
  fs.writeFileSync(statsPath, statsContent);

  return { filename, statsFilename };
}

export function cleanupStepFiles(config) {
  if (config.stepFiles?.cleanup !== false) {
    for (let i = 1; i <= 4; i++) {
      const f = `retrieval-step${i}.md`;
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    const patternsFile = 'retrieval-patterns.md';
    if (fs.existsSync(patternsFile)) fs.unlinkSync(patternsFile);
  }
}

export async function runRetrievalExpansion(session, expansionRequest, callbacks = {}) {
  const expandIndex = session.retrieval.expandedSteps.length + 1;
  const expandFile = `retrieval-expand-${expandIndex}.md`;
  const agentProvider = resolveProvider(session.config.agent);

  const agent = new AgentSession({
    endpoint: agentProvider.endpoint,
    model: agentProvider.model,
    apiKey: agentProvider.apiKey,
    format: agentProvider.format,
    stepFile: expandFile,
    warningThreshold: session.config.agent.warningThreshold,
    onTurnWarning: (turn) => { if (callbacks.onTurnWarning) callbacks.onTurnWarning(turn); },
    onToolCall: (command, status) => {
      if (status === 'running') {
        session.retrieval._expandCmdCount = (session.retrieval._expandCmdCount || 0) + 1;
      }
      if (callbacks.onToolCall) callbacks.onToolCall(command, status);
    }
  });

  const expandPrompt = `You are a retrieval agent gathering additional codebase context.\n\n` +
    `## Original Task\n${session.intake.summary}\n\n` +
    `## What Has Already Been Retrieved\nSteps 1-4 have already gathered pattern results, structural mapping, content captures, and gap analysis.\n\n` +
    `## What To Gather Now\n${expansionRequest}\n\n` +
    `Run targeted shell commands to gather the requested information.\n` +
    `Write all results to ${expandFile}.\n`;

  session.retrieval._expandCmdCount = 0;
  fs.writeFileSync(expandFile, '');
  await agent.chat(expandPrompt);

  if (agent.usageLog && agent.usageLog.length > 0) {
    session.stats.retrieval.push(...agent.usageLog);
  }

  if (fs.existsSync(expandFile)) {
    session.retrieval.expandedSteps.push(fs.readFileSync(expandFile, 'utf8'));
    fs.unlinkSync(expandFile);
  }

  if (callbacks.onStepComplete) callbacks.onStepComplete('EXPAND', session.retrieval._expandCmdCount);
}

export function formatStats(stats) {
  const lines = [];
  lines.push('# Token Usage Report');
  lines.push('');

  let grandInput = 0;
  let grandOutput = 0;
  let grandCached = 0;

  // Intake
  lines.push('## Intake');
  if (stats.intake.length === 0) {
    lines.push('No API calls recorded.');
    lines.push('');
  } else {
    lines.push('| Call # | Model | Input Tokens | Output Tokens | Cached Tokens |');
    lines.push('|--------|-------|--------------|---------------|---------------|');
    let phaseInput = 0;
    let phaseOutput = 0;
    let phaseCached = 0;
    stats.intake.forEach((entry, idx) => {
      lines.push(`| ${idx + 1} | ${entry.model} | ${entry.inputTokens} | ${entry.outputTokens} | ${entry.cachedTokens} |`);
      phaseInput += entry.inputTokens;
      phaseOutput += entry.outputTokens;
      phaseCached += entry.cachedTokens;
    });
    lines.push(`| **Totals** | | **${phaseInput}** | **${phaseOutput}** | **${phaseCached}** |`);
    lines.push('');
    grandInput += phaseInput;
    grandOutput += phaseOutput;
    grandCached += phaseCached;
  }

  // Retrieval
  lines.push('## Retrieval');
  if (stats.retrieval.length === 0) {
    lines.push('No API calls recorded.');
    lines.push('');
  } else {
    lines.push('| Call # | Model | Input Tokens | Output Tokens | Cached Tokens |');
    lines.push('|--------|-------|--------------|---------------|---------------|');
    let phaseInput = 0;
    let phaseOutput = 0;
    let phaseCached = 0;
    stats.retrieval.forEach((entry, idx) => {
      lines.push(`| ${idx + 1} | ${entry.model} | ${entry.inputTokens} | ${entry.outputTokens} | ${entry.cachedTokens} |`);
      phaseInput += entry.inputTokens;
      phaseOutput += entry.outputTokens;
      phaseCached += entry.cachedTokens;
    });
    lines.push(`| **Totals** | | **${phaseInput}** | **${phaseOutput}** | **${phaseCached}** |`);
    lines.push('');
    grandInput += phaseInput;
    grandOutput += phaseOutput;
    grandCached += phaseCached;
  }

  // Assembly
  lines.push('## Assembly');
  if (stats.assembly.length === 0) {
    lines.push('No API calls recorded.');
    lines.push('');
  } else {
    lines.push('| Call # | Model | Input Tokens | Output Tokens | Cached Tokens |');
    lines.push('|--------|-------|--------------|---------------|---------------|');
    let phaseInput = 0;
    let phaseOutput = 0;
    let phaseCached = 0;
    stats.assembly.forEach((entry, idx) => {
      lines.push(`| ${idx + 1} | ${entry.model} | ${entry.inputTokens} | ${entry.outputTokens} | ${entry.cachedTokens} |`);
      phaseInput += entry.inputTokens;
      phaseOutput += entry.outputTokens;
      phaseCached += entry.cachedTokens;
    });
    lines.push(`| **Totals** | | **${phaseInput}** | **${phaseOutput}** | **${phaseCached}** |`);
    lines.push('');
    grandInput += phaseInput;
    grandOutput += phaseOutput;
    grandCached += phaseCached;
  }

  lines.push('## Totals');
  lines.push('| Input Tokens | Output Tokens | Cached Tokens |');
  lines.push('|--------------|---------------|---------------|');
  lines.push(`| ${grandInput} | ${grandOutput} | ${grandCached} |`);
  lines.push('');

  return lines.join('\n');
}
