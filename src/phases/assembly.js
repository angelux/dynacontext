import fs from 'fs';
import path from 'path';
import { callLLM } from '../services/llm.js';
import { composeAssemblyPrompt } from '../services/prompts.js';
import { AgentSession } from '../services/agent.js';
import { resolveProvider } from '../services/provider.js';

export function parseRetrievalRequest(content) {
  const blockRegex = /\[ASSEMBLY_RETRIEVAL_REQUEST\]([\s\S]*?)\[\/ASSEMBLY_RETRIEVAL_REQUEST\]/;
  const match = content.match(blockRegex);

  if (!match) return null;

  const blockContent = match[1];
  const request = { directReads: [], targetedSearch: null };

  const directReadsMatch = blockContent.match(/## Direct Reads\n([\s\S]*?)(?=##|$)/);
  if (directReadsMatch) {
    const lines = directReadsMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        const parts = trimmed.substring(2).split('|').map(s => s.trim());
        if (parts.length >= 1) {
          request.directReads.push({
            path: parts[0],
            reason: parts[1] || 'No reason provided'
          });
        }
      }
    }
  }

  const targetedSearchMatch = blockContent.match(/## Targeted Search\n([\s\S]*?)(?=##|$)/);
  if (targetedSearchMatch) {
    request.targetedSearch = targetedSearchMatch[1].trim();
  }

  return request;
}

export function executeDirectReads(directReads, cwd) {
  const results = [];
  for (const item of directReads) {
    const filePath = path.resolve(cwd, item.path);
    if (!filePath.startsWith(path.resolve(cwd))) {
      results.push(`<!-- Skipped ${item.path}: Path outside project directory -->`);
      continue;
    }
    if (!fs.existsSync(filePath)) {
      results.push(`<!-- File not found: ${item.path} -->`);
      continue;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;
      let fileHeader = `### ${item.path}\n\n`;
      if (lineCount > 500) fileHeader += `<!-- Note: Large file (${lineCount} lines). Assembly requested this file specifically. -->\n\n`;
      results.push(`${fileHeader}\`\`\`\n${content}\n\`\`\``);
    } catch (error) {
      results.push(`<!-- Error reading ${item.path}: ${error.message} -->`);
    }
  }
  return results.join('\n\n');
}

export async function executeTargetedSearch(searchDescription, session, callbacks = {}) {
  const expandIndex = session.retrieval.expandedSteps.length + 1;
  const agentProvider = resolveProvider(session.config.agent);

  const agent = new AgentSession({
    endpoint: agentProvider.endpoint,
    model: agentProvider.model,
    apiKey: agentProvider.apiKey,
    format: agentProvider.format,
    cwd: session.cwd,
    stepFile: `retrieval-expand-${expandIndex}.md`,
    warningThreshold: session.config.agent.warningThreshold,
    onTurnWarning: (turn) => { if (callbacks.onTurnWarning) callbacks.onTurnWarning(turn); },
    onToolCall: (command, status) => {
      if (status === 'running') {
        session.retrieval._assemblyExpandCmdCount = (session.retrieval._assemblyExpandCmdCount || 0) + 1;
      }
      if (callbacks.onToolCall) callbacks.onToolCall(command, status);
    }
  });

  const expandPrompt = `You are a retrieval agent gathering additional codebase context for assembly.\n\n` +
    `## Original Task\n${session.intake.summary}\n\n` +
    `## What Has Already Been Retrieved\nSteps 1-4 have already gathered pattern results, structural mapping, content captures, and gap analysis.\n\n` +
    `## What To Gather Now\n${searchDescription}\n\n` +
    `Use ripgrep (rg) for searching when possible. Run targeted shell commands to gather the requested information.\n` +
    `Write all results to retrieval-expand-${expandIndex}.md.\n`;

  session.retrieval._assemblyExpandCmdCount = 0;
  await agent.chat(expandPrompt);

  if (agent.usageLog && agent.usageLog.length > 0) {
    session.stats.retrieval.push(...agent.usageLog);
  }

  const expandFile = `retrieval-expand-${expandIndex}.md`;
  let content = '';
  if (fs.existsSync(expandFile)) {
    content = fs.readFileSync(expandFile, 'utf-8');
    fs.unlinkSync(expandFile);
  }

  if (callbacks.onStepComplete) callbacks.onStepComplete('EXPAND', session.retrieval._assemblyExpandCmdCount);

  return `### Targeted Search Results\n\n${content || '<!-- No results returned -->'}`;
}

export function buildUserContent(session) {
  const formattedMessages = session.intake.messages
    .map(m => `**${m.role.toUpperCase()}**: ${m.content}`)
    .join('\n\n');

  let userContent = `## Structured Task Summary\n\n${session.intake.summary}\n\n` +
    `## Full Intake Conversation\n\n${formattedMessages}\n\n` +
    `## Retrieval Results\n\n${session.retrieval.steps.join('\n\n')}\n\n`;

  if (session.retrieval.expandedSteps.length > 0) {
    userContent += `## Additional Retrieval Results\n\n${session.retrieval.expandedSteps.join('\n\n')}\n\n`;
  }

  if (session.intake.biasing) {
    userContent += `## User Biasing Guidance\n\n` +
      `The following additional guidance comes directly from the user and should be seen as a complementary lens to influence your output.` + `\n\n${session.intake.biasing}\n\n`;
  }

  if (session.assembly.revisionFeedback) {
    userContent += `## Revision Request\n\nPrevious version is below. The user has requested these changes:\n\n` +
      `${session.assembly.revisionFeedback}\n\n` +
      `## Previous Context Package\n\n${session.assembly.content}\n`;
  }

  return userContent;
}

export async function callAssemblyLLM(session) {
  const systemPrompt = composeAssemblyPrompt(session.config);
  const userContent = buildUserContent(session);
  const assemblyProvider = resolveProvider(session.config.assembly);

  const result = await callLLM({
    messages: [{ role: 'user', content: userContent }],
    systemPrompt,
    endpoint: assemblyProvider.endpoint,
    model: assemblyProvider.model,
    apiKey: assemblyProvider.apiKey,
    format: assemblyProvider.format,
    cache: false
  });

  session.stats.assembly.push(result.usage);
  const retrievalRequest = parseRetrievalRequest(result.content);
  return { content: result.content, retrievalRequest };
}

export async function reassembleWithDenial(session) {
  const systemPrompt = composeAssemblyPrompt(session.config);
  const userContent = buildUserContent(session) +
      `\n\n## Revision Request\n\nYour retrieval request was denied by the user. ` +
      `Proceed with the complete output using only the context available.\n\n`;
  const assemblyProvider = resolveProvider(session.config.assembly);

  const result = await callLLM({
    messages: [{ role: 'user', content: userContent }],
    systemPrompt,
    endpoint: assemblyProvider.endpoint,
    model: assemblyProvider.model,
    apiKey: assemblyProvider.apiKey,
    format: assemblyProvider.format,
    cache: false
  });
  session.stats.assembly.push(result.usage);
  return result.content;
}

export async function executeRetrievalAndReassemble(session, request, callbacks = {}) {
  const acquisitionResults = [];

  if (request.directReads.length > 0) {
    const directContent = executeDirectReads(request.directReads, session.cwd);
    if (directContent) acquisitionResults.push(directContent);
  }

  if (request.targetedSearch) {
    const searchContent = await executeTargetedSearch(request.targetedSearch, session, callbacks);
    acquisitionResults.push(searchContent);
  }

  session.assembly.retrievalRequested = true;
  if (acquisitionResults.length > 0) {
    session.retrieval.expandedSteps.push(acquisitionResults.join('\n\n---\n\n'));
  }

  const reentryContent = buildUserContent(session) +
    `\n\n## Revision Request\n\nAdditional context has been provided in response to your retrieval request. ` +
    `Proceed directly to producing the complete output using all available information.\n\n`;

  const systemPrompt = composeAssemblyPrompt(session.config);
  const assemblyProvider = resolveProvider(session.config.assembly);

  const result = await callLLM({
    messages: [{ role: 'user', content: reentryContent }],
    systemPrompt,
    endpoint: assemblyProvider.endpoint,
    model: assemblyProvider.model,
    apiKey: assemblyProvider.apiKey,
    format: assemblyProvider.format,
    cache: false
  });
  session.stats.assembly.push(result.usage);
  return result.content;
}
