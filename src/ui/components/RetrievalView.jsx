import { useState, useEffect, useRef } from 'react';
import { Text, Box } from 'ink';
import Divider from './shared/Divider.jsx';
import PhaseHeader from './shared/PhaseHeader.jsx';
import ErrorRecovery from './ErrorRecovery.jsx';
import theme from '../theme.js';
import { runRetrieval } from '../../phases/retrieval.js';

export default function RetrievalView({ session, config, onPhaseComplete, onStaticAdd }) {
  const [currentStep, setCurrentStep] = useState(null);
  const currentStepRef = useRef(null);
  const [currentCommand, setCurrentCommand] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const seenStepsRef = useRef(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {

    const startRetrieval = async () => {
      try {
        const nextPhase = await runRetrieval(session, {
          onHeader: () => {
            // Header is handled by static rendering if needed, or just skip
          },
          onStepStart: (label, title) => {
            if (isMountedRef.current) {
              const stepData = { label, title };
              setCurrentStep(stepData);
              currentStepRef.current = stepData;
              setCurrentCommand(null);
            }
          },
          onToolCall: (command, status) => {
            if (isMountedRef.current) {
              setCurrentCommand({ command, status });
            }
          },
          onStepComplete: (label, count) => {
            if (isMountedRef.current) {
              // Prevent duplicate steps using ref-based tracking
              if (seenStepsRef.current.has(label)) return;
              seenStepsRef.current.add(label);
              const completedTitle = currentStepRef.current?.title;
              onStaticAdd({ type: 'RETRIEVAL_STEP', data: { label, count, title: completedTitle } });
              setCurrentStep(null);
              setCurrentCommand(null);
            }
          },
          onTurnWarning: (turn) => {
            if (isMountedRef.current) setWarning(turn);
          },
          onFooter: () => {
            // Footer handled by transition
          }
        });
        if (isMountedRef.current) onPhaseComplete(nextPhase);
      } catch (err) {
        if (isMountedRef.current) setError(err.message);
      }
    };

    startRetrieval();

  }, [retryCount]);

  const handleErrorAction = (action) => {
    if (action === 'R') {
      setError(null);
      setRetryCount(r => r + 1);
    } else if (action === 'F') {
      session.retrieval.failedStep = 0;
      seenStepsRef.current.clear();
      setError(null);
      setRetryCount(r => r + 1);
    } else if (action === 'Q') {
      onPhaseComplete('DONE');
    }
  };

  if (error) {
    return (
      <ErrorRecovery
        phase="RETRIEVAL"
        errorMessage={error}
        onAction={handleErrorAction}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <PhaseHeader phase="RETRIEVAL" title="RETRIEVAL ENGINE" />

      {currentStep && (
        <Box flexDirection="column">
          <Box marginLeft={2}>
            <Text>{`STEP ${currentStep.label}: ${currentStep.title}`}</Text>
          </Box>
          {currentCommand && (
            <Box marginLeft={3}>
              {currentCommand.status === 'error' ? (
                <Text color={theme.status.error}>✗ </Text>
              ) : (
                <Text color={theme.ui.accent}>⊹ </Text>
              )}
              <Text dimColor>
                {currentCommand.command.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()}
              </Text>
            </Box>
          )}
          {warning && (
            <Box marginLeft={2}>
              <Text color={theme.status.warning}>{`⚠ WARN  Agent turn ${warning} reached threshold`}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
