import fs from 'fs';
import { spawn } from 'child_process';
import { AgentSession, captureTool } from '../services/agent.js';
import { callLLM } from '../services/llm.js';
import { composeRetrievalStepPrompts, loadStepHeader, loadPrompt } from '../services/prompts.js';
import { resolveProvider } from '../services/provider.js';

/**
 * Execute a single shell command using spawn and return its output.
 * Mirrors the behavior of _executeCommand in agent.js.
 */
function executeCommandAsync(command, { cwd = process.cwd(), timeout = 30000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, cwd });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill();
      resolve(`[TIMEOUT after ${timeout}ms]`);
    }, timeout);

    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      let output = (stdout + stderr).replace(/[^\x20-\x7E\x09\x0A\x0D]/g, '').trim();

      if (code !== 0) {
        resolve(`[ERROR - Exit Code ${code}]\n${output}`);
      } else {
        resolve(output || '[Success - No Output]');
      }
    });
  });
}

/**
 * Execute a list of capture commands and write results to target files.
 * Replaces executeBridgeCommands with spawn-based execution.
 */
async function executeCaptureCommands(commands, { defaultFile, onCommand } = {}) {
  for (const entry of commands) {
    if (!entry || !entry.command) continue;

    if (onCommand) onCommand(entry.command, 'running');

    const result = await executeCommandAsync(entry.command);

    const targetFile = entry.file || defaultFile;
    if (targetFile) {
      const section = [
        ':::command+note',
        `source: ${entry.command}`,
        '---',
        result,
        '---',
        entry.notes || 'No justification provided.',
        ':::',
        ''
      ].join('\n');

      fs.appendFileSync(targetFile, section);
    }

    if (onCommand) {
      if (result.includes('[ERROR') || result.includes('[TIMEOUT')) {
        onCommand(entry.command, 'error');
      } else {
        onCommand(entry.command, 'done');
      }
    }
  }
}

/**
 * Parse JSON from an LLM response.
 */
function parseLLMJson(content) {
  const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : content.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    const repaired = repairInvalidJsonEscapes(jsonStr);
    if (repaired !== jsonStr) {
      try {
        return JSON.parse(repaired);
      } catch {
      }
    }
    throw new Error(`Failed to parse LLM JSON output: ${err.message}\nContent preview: ${jsonStr.substring(0, 200)}`);
  }
}

function repairInvalidJsonEscapes(input) {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (!inString) {
      out += ch;
      if (ch === '"') {
        inString = true;
      }
      continue;
    }

    if (escaped) {
      const isValidEscape = ch === '"' || ch === '\\' || ch === '/' || ch === 'b' || ch === 'f' || ch === 'n' || ch === 'r' || ch === 't' || ch === 'u';
      if (isValidEscape) {
        out += ch;
      } else {
        out += `\\${ch}`;
      }
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }

    out += ch;
    if (ch === '"') {
      inString = false;
    }
  }

  return out;
}

/**
 * Run a single agentic retrieval step.
 */
async function runAgenticStep({
  session,
  stepIndex,
  stepLabel,
  stepTitle,
  stepPrompt,
  priorStepIndices,
  tools,
  stepFile,
  skipFileInit = false,
  priorContext,
  callbacks = {}
}) {
  if (callbacks.onStepStart) callbacks.onStepStart(stepLabel, stepTitle);
  session.retrieval._cmdCount = 0;

  let success = false;
  let attempts = 0;

  while (!success && attempts < 2) {
    if (!skipFileInit) {
      const header = loadStepHeader(stepIndex + 1);
      fs.writeFileSync(stepFile, header);
    }

    let priorStepContext = '';
    if (priorStepIndices.length > 0) {
      const sections = ['---', '## Previous Step Output', ''];
      for (const idx of priorStepIndices) {
        sections.push(`### Step ${idx + 1} Output`, '', session.retrieval.steps[idx] || '', '');
      }
      priorStepContext = sections.join('\n');
    }

    const customContext = priorContext ? priorContext() : '';

    let stepFileState = '';
    if (!skipFileInit) {
      const currentContent = fs.existsSync(stepFile) ? fs.readFileSync(stepFile, 'utf8') : '';
      stepFileState = [
        '---',
        '## Current Step File State',
        '',
        `Your step file (${stepFile}) has been initialized. Its current contents:`,
        '',
        currentContent,
        '',
        '---',
        '',
        'Continue from here. Your first write should append to this file using the capture tool.'
      ].join('\n');
    }

    const composedMessage = [
      stepPrompt,
      priorStepContext,
      customContext || stepFileState
    ].filter(Boolean).join('\n');

    const agentProvider = resolveProvider(session.config.agent);

    const agent = new AgentSession({
      endpoint: agentProvider.endpoint,
      model: agentProvider.model,
      apiKey: agentProvider.apiKey,
      format: agentProvider.format,
      stepFile,
      tools,
      warningThreshold: session.config.agent.warningThreshold,
      commandTimeout: session.config.agent.commandTimeout,
      onTurnWarning: (turn) => {
        if (callbacks.onTurnWarning) callbacks.onTurnWarning(turn);
      },
      onToolCall: (command, status) => {
        if (status === 'running') {
          session.retrieval._cmdCount = (session.retrieval._cmdCount || 0) + 1;
        }
        if (callbacks.onToolCall) callbacks.onToolCall(command, status);
      }
    });

    try {
      await agent.chat(composedMessage);

      if (agent.usageLog && agent.usageLog.length > 0) {
        session.stats.retrieval.push(...agent.usageLog);
      }

      if (fs.existsSync(stepFile)) {
        session.retrieval.steps[stepIndex] = fs.readFileSync(stepFile, 'utf8');
      } else {
        session.retrieval.steps[stepIndex] = '';
      }

      if (callbacks.onStepComplete) callbacks.onStepComplete(stepLabel, session.retrieval._cmdCount);
      success = true;
    } catch (error) {
      attempts++;
      if (attempts >= 2) {
        throw error;
      }
    } finally {
      await agent.end();
    }
  }
}

export async function runRetrieval(session, callbacks = {}) {
  if (callbacks.onHeader) callbacks.onHeader();

  const stepPrompts = composeRetrievalStepPrompts({
    taskSummary: session.intake.summary,
    taskType: session.intake.taskType,
    config: session.config
  });

  const refinementConfig = session.config.retrieval.refinement || {};
  const hasRefinementConfig = refinementConfig.endpoint && refinementConfig.apiKey;
  const refinementProvider = hasRefinementConfig
    ? resolveProvider(refinementConfig)
    : resolveProvider(session.config.agent);
  const step1bModel = refinementConfig.step1b?.model || refinementProvider.model;
  const step2Model = refinementConfig.step2?.model || refinementProvider.model;

  const startStep = session.retrieval.failedStep ?? 0;
  let failedStepCandidate = null;

  try {
    if (startStep <= 0) {
      failedStepCandidate = 0;
      if (callbacks.onStepStart) callbacks.onStepStart('0', 'Pattern Execution');
      session.retrieval._cmdCount = 0;

      fs.writeFileSync('retrieval-patterns.md', '# Retrieval Patterns - Exploration Log\n\n');

      const patterns = session.intake.searchPatterns || [];
      if (patterns.length === 0 && session.intake.assessment === 'READY') {
        console.warn('[retrieval] Warning: READY assessment but no search patterns found');
      }
      if (patterns.length > 0) {
        const captures = patterns.map(p => ({ command: p.command, notes: p.notes }));
        await executeCaptureCommands(captures, {
          defaultFile: 'retrieval-patterns.md',
          onCommand: (cmd, status) => {
            if (status === 'running') {
              session.retrieval._cmdCount = (session.retrieval._cmdCount || 0) + 1;
            }
            if (callbacks.onToolCall) callbacks.onToolCall(cmd, status);
          }
        });
      }

      if (callbacks.onStepComplete) callbacks.onStepComplete('0', session.retrieval._cmdCount || 0);
    }

    if (startStep <= 1) {
      failedStepCandidate = 1;
      await runAgenticStep({
        session,
        stepIndex: 0,
        stepLabel: '1a',
        stepTitle: 'Pattern Exploration',
        stepPrompt: stepPrompts[0],
        priorStepIndices: [],
        tools: [captureTool],
        stepFile: 'retrieval-patterns.md',
        skipFileInit: true,
        priorContext: () => {
          const patternsContent = fs.existsSync('retrieval-patterns.md')
            ? fs.readFileSync('retrieval-patterns.md', 'utf8')
            : '';
          return [
            '---',
            '## Current Exploration File State',
            '',
            'Your exploration file (retrieval-patterns.md) has been seeded with initial pattern results. Its current contents:',
            '',
            patternsContent,
            '',
            '---',
            '',
            'Review the initial findings above and explore further using capture. Follow threads, try variants, expand coverage. When you have thoroughly explored the task-relevant patterns, signal completion.'
          ].join('\n');
        },
        callbacks
      });

      session.retrieval.patterns = fs.existsSync('retrieval-patterns.md')
        ? fs.readFileSync('retrieval-patterns.md', 'utf8')
        : '';
    }

    if (startStep <= 2) {
      failedStepCandidate = 2;
      if (callbacks.onStepStart) callbacks.onStepStart('1b', 'Pattern Refinement');
      session.retrieval._cmdCount = 0;

      const patternsContent = session.retrieval.patterns ||
        (fs.existsSync('retrieval-patterns.md')
          ? fs.readFileSync('retrieval-patterns.md', 'utf8')
          : '');

      const refinementPrompt = loadPrompt('retrieval-refinement-1b.md')
        .replace(/{{TASK_SUMMARY}}/g, session.intake.summary)
        .replace(/{{EXPLORATION_CONTENT}}/g, patternsContent);

      const { content: step1bContent, usage: step1bUsage } = await callLLM({
        messages: [{ role: 'user', content: 'Analyze the exploration results and produce refined search commands.' }],
        systemPrompt: refinementPrompt,
        endpoint: refinementProvider.endpoint,
        model: step1bModel,
        apiKey: refinementProvider.apiKey,
        format: refinementProvider.format,
        cache: false
      });

      session.stats.retrieval.push(step1bUsage);

      const step1bJson = parseLLMJson(step1bContent);
      const captures = step1bJson.captures || [];

      const step1Header = loadStepHeader(1);
      fs.writeFileSync('retrieval-step1.md', step1Header);

      await executeCaptureCommands(captures, {
        defaultFile: 'retrieval-step1.md',
        onCommand: (cmd, status) => {
          if (status === 'running') {
            session.retrieval._cmdCount = (session.retrieval._cmdCount || 0) + 1;
          }
          if (callbacks.onToolCall) callbacks.onToolCall(cmd, status);
        }
      });

      session.retrieval.steps[0] = fs.readFileSync('retrieval-step1.md', 'utf8');
      if (callbacks.onStepComplete) callbacks.onStepComplete('1b', session.retrieval._cmdCount || 0);
    }

    if (startStep <= 3) {
      failedStepCandidate = 3;
      if (callbacks.onStepStart) callbacks.onStepStart('2', 'Structural Selection');
      session.retrieval._cmdCount = 0;

      const fileListing = await executeCommandAsync('rg --files | sort');

      const step1Content = session.retrieval.steps[0] ||
        (fs.existsSync('retrieval-step1.md')
          ? fs.readFileSync('retrieval-step1.md', 'utf8')
          : '');

      const structuralPrompt = loadPrompt('retrieval-refinement-2.md')
        .replace(/{{TASK_SUMMARY}}/g, session.intake.summary)
        .replace(/{{FILE_LISTING}}/g, fileListing)
        .replace(/{{STEP1_CONTENT}}/g, step1Content);

      const { content: step2Content, usage: step2Usage } = await callLLM({
        messages: [{ role: 'user', content: 'Analyze the file landscape and search results, then produce structural commands.' }],
        systemPrompt: structuralPrompt,
        endpoint: refinementProvider.endpoint,
        model: step2Model,
        apiKey: refinementProvider.apiKey,
        format: refinementProvider.format,
        cache: false
      });

      session.stats.retrieval.push(step2Usage);

      const step2Json = parseLLMJson(step2Content);
      const captures = step2Json.captures || [];

      const step2Header = loadStepHeader(2);
      fs.writeFileSync('retrieval-step2.md', step2Header);

      await executeCaptureCommands(captures, {
        defaultFile: 'retrieval-step2.md',
        onCommand: (cmd, status) => {
          if (status === 'running') {
            session.retrieval._cmdCount = (session.retrieval._cmdCount || 0) + 1;
          }
          if (callbacks.onToolCall) callbacks.onToolCall(cmd, status);
        }
      });

      session.retrieval.steps[1] = fs.readFileSync('retrieval-step2.md', 'utf8');
      if (callbacks.onStepComplete) callbacks.onStepComplete('2', session.retrieval._cmdCount || 0);
    }

    if (startStep <= 4) {
      failedStepCandidate = 4;
      await runAgenticStep({
        session,
        stepIndex: 2,
        stepLabel: '3',
        stepTitle: 'Content Capture',
        stepPrompt: stepPrompts[2],
        priorStepIndices: [0, 1],
        tools: [captureTool],
        stepFile: 'retrieval-step3.md',
        callbacks
      });
    }

    if (startStep <= 5) {
      failedStepCandidate = 5;
      await runAgenticStep({
        session,
        stepIndex: 3,
        stepLabel: '4',
        stepTitle: 'Gap Analysis',
        stepPrompt: stepPrompts[3],
        priorStepIndices: [0, 1, 2],
        tools: [captureTool],
        stepFile: 'retrieval-step4.md',
        callbacks
      });
    }
  } catch (error) {
    if (failedStepCandidate !== null) {
      session.retrieval.failedStep = failedStepCandidate;
    }
    throw error;
  }

  session.retrieval.failedStep = null;

  if (callbacks.onFooter) callbacks.onFooter();

  return 'ASSEMBLY';
}
