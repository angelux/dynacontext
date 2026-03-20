import { callLLM } from '../services/llm.js';
import { composeIntakePrompt } from '../services/prompts.js';
import { resolveProvider } from '../services/provider.js';

/**
 * Process the current intake conversation through the LLM.
 * Mutates session.intake with parsed data.
 * Returns { displayContent, assessment } for UI rendering.
 */
export async function processIntakeMessage(session) {
  const systemPrompt = composeIntakePrompt(session.config);
  const intakeProvider = resolveProvider(session.config.intake);
  
  const { content, usage } = await callLLM({
    messages: session.intake.messages,
    systemPrompt,
    endpoint: intakeProvider.endpoint,
    model: intakeProvider.model,
    apiKey: intakeProvider.apiKey,
    format: intakeProvider.format
  });

  // Track token usage
  session.stats.intake.push(usage);

  // Parse assessment
  const assessmentMatch = content.match(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/i);
  const assessment = assessmentMatch ? assessmentMatch[1].toUpperCase() : 'NEEDS_INFO';
  session.intake.assessment = assessment;

  // Extract task type
  const typeMatch = content.match(/Type:\s*([a-zA-Z-]+)/i);
  session.intake.taskType = typeMatch ? typeMatch[1].toLowerCase() : 'modification';

  // Extract search patterns
  const patternsMatch = content.match(/```search_patterns\s*\n([\s\S]*?)\n```/);
  if (patternsMatch) {
    try {
      const parsed = JSON.parse(patternsMatch[1].trim());
      session.intake.searchPatterns = parsed.captures || [];
    } catch (e) {
      session.intake.searchPatterns = [];
    }
  } else {
    session.intake.searchPatterns = [];
  }

  // Extract references
  const refMatch = content.match(/References:\s*(.*)/i);
  session.intake.references = refMatch ? refMatch[1].split(',').map(r => r.trim()) : [];

  // Strip markers for display
  const cleanDisplayContent = content
    .replace(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/gi, '')
    .replace(/```search_patterns\s*\n[\s\S]*?\n```/g, '')
    .trim();
  
  session.intake.summary = cleanDisplayContent;
  session.intake.messages.push({ role: 'assistant', content });

  return { displayContent: cleanDisplayContent, assessment };
}

/**
 * Finalize intake when user proceeds without a structured summary.
 * Generates a summary from conversation context.
 */
export async function finalizeIntake(session) {
  const finalizationMessage = 'The user has initiated retrieval. Based on everything discussed so far, produce your best structured task summary now. Use the standard format (Task, Component, Feature, Stack, Constraint, Type, Pattern, Hook, References). Include [ASSESSMENT: READY] or [ASSESSMENT: NEEDS_INFO] as appropriate. Work with whatever information you have — do not ask further questions.';
  
  session.intake.messages.push({ role: 'user', content: finalizationMessage });

  const systemPrompt = composeIntakePrompt(session.config);
  const intakeProvider = resolveProvider(session.config.intake);

  const { content: finalContent, usage: finalUsage } = await callLLM({
    messages: session.intake.messages,
    systemPrompt,
    endpoint: intakeProvider.endpoint,
    model: intakeProvider.model,
    apiKey: intakeProvider.apiKey,
    format: intakeProvider.format
  });

  // Track token usage
  session.stats.intake.push(finalUsage);
  session.intake.messages.push({ role: 'assistant', content: finalContent });
  
  // Re-parse the finalized response
  const finalAssessmentMatch = finalContent.match(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/i);
  if (finalAssessmentMatch) {
    session.intake.assessment = finalAssessmentMatch[1].toUpperCase();
  }
  
  const finalTypeMatch = finalContent.match(/Type:\s*([a-zA-Z-]+)/i);
  if (finalTypeMatch) {
    session.intake.taskType = finalTypeMatch[1].toLowerCase();
  }
  
  const finalRefMatch = finalContent.match(/References:\s*(.*)/i);
  if (finalRefMatch) {
    session.intake.references = finalRefMatch[1].split(',').map(r => r.trim());
  }

  const finalPatternsMatch = finalContent.match(/```search_patterns\s*\n([\s\S]*?)\n```/);
  if (finalPatternsMatch) {
    try {
      const parsed = JSON.parse(finalPatternsMatch[1].trim());
      session.intake.searchPatterns = parsed.captures || [];
    } catch (e) {
      session.intake.searchPatterns = [];
    }
  } else {
    session.intake.searchPatterns = [];
  }
  
  const cleanFinalContent = finalContent
    .replace(/\[ASSESSMENT:\s*(READY|NEEDS_INFO)\]/gi, '')
    .replace(/```search_patterns\s*\n[\s\S]*?\n```/g, '')
    .trim();
  
  session.intake.summary = cleanFinalContent;
  return cleanFinalContent;
}

export function hasStructuredSummary(summary) {
  return /^Task:\s+.+/m.test(summary) && /^Type:\s+.+/m.test(summary);
}
