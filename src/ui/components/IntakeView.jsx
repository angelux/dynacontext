import { useState, useEffect, useRef } from 'react';
import { Text, Box } from 'ink';
import TextInput from './shared/TextInput.jsx';
import WorkingIndicator from './shared/WorkingIndicator.jsx';
import KeyMenu from './shared/KeyMenu.jsx';
import Divider from './shared/Divider.jsx';
import PhaseHeader from './shared/PhaseHeader.jsx';
import StatusMessage from './shared/StatusMessage.jsx';
import theme from '../theme.js';
import { processIntakeMessage, finalizeIntake, hasStructuredSummary } from '../../phases/intake.js';

export default function IntakeView({ session, config, onPhaseComplete, onSettingsRequested }) {
  // States: 'welcome' | 'processing' | 'assessment' | 'adding' | 'revising' | 'finalizing' | 'biasing'
  const [viewState, setViewState] = useState(
    session.intake.messages.length > 0 ? 'assessment' : 'welcome'
  );
  const [error, setError] = useState(null);

  // Ref for tracking mounted status
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleInitialSubmit = async (text) => {
    if (text.trim().toLowerCase() === '/settings') {
      onSettingsRequested();
      return;
    }
    session.intake.messages.push({ role: 'user', content: text });
    setViewState('processing');
    try {
      await processIntakeMessage(session);
      if (isMountedRef.current) setViewState('assessment');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
        setViewState('assessment'); // Show assessment view with error
      }
    }
  };

  const handleMenuSelect = async (action) => {
    if (action === 'P') {
      if (!hasStructuredSummary(session.intake.summary)) {
        setViewState('finalizing');
        try {
          await finalizeIntake(session);
        } catch (err) {
          if (isMountedRef.current) setError(err.message);
        }
      }
      if (isMountedRef.current) setViewState('biasing');
    } else if (action === 'A') {
      setViewState('adding');
    } else if (action === 'R') {
      setViewState('revising');
    }
  };

  const handleAdditionalSubmit = async (text) => {
    session.intake.messages.push({ role: 'user', content: text });
    setViewState('processing');
    try {
      await processIntakeMessage(session);
      if (isMountedRef.current) setViewState('assessment');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
        setViewState('assessment');
      }
    }
  };

  const handleBiasingSubmit = (text) => {
    session.intake.biasing = text;
    onPhaseComplete('RETRIEVAL');
  };

  const handleBiasingChoice = (choice) => {
    if (choice === 'Y') {
      setViewState('biasing_input');
    } else {
      session.intake.biasing = '';
      onPhaseComplete('RETRIEVAL');
    }
  };

  return (
    <Box flexDirection="column">
      <PhaseHeader phase="INTAKE" title="INTAKE" />

      {viewState === 'welcome' && (
        <Box flexDirection="column">
          <Box marginLeft={2}>
            <Text color={theme.status.info}>AWAITING INPUT</Text>
            <Text>  Describe task parameters. Terminate with </Text>
            <Text bold>END</Text>
            <Text>.</Text>
          </Box>
          <Box marginLeft={2} marginTop={1}>
            <Text dimColor>Type /settings to configure.</Text>
          </Box>
          <Box marginTop={1}>
            <TextInput
              onSubmit={handleInitialSubmit}
              immediateSubmit={(text) => {
                if (text.length > 20 || text[0] !== '/') return false;
                return text.toLowerCase() === '/settings';
              }}
            />
          </Box>
        </Box>
      )}

      {viewState === 'processing' && (
        <WorkingIndicator
          label={session.intake.messages.length <= 1 ? 'PROC  Analyzing task description' : 'PROC  Processing additional context'}
        />
      )}

      {(viewState === 'assessment' || viewState === 'adding' || viewState === 'revising' || viewState === 'finalizing') && (
        <Box flexDirection="column">
          <Box marginTop={1} marginBottom={1} marginLeft={2}>
            <Text>{session.intake.summary}</Text>
          </Box>
          <Divider />
          <Box marginTop={1} marginBottom={1} marginLeft={2}>
            <Text color={theme.status.info}>STATUS</Text>
            <Text>  Assessment: </Text>
            <Text color={session.intake.assessment === 'READY' ? theme.status.success : theme.status.warning}>
              {`[${session.intake.assessment}]`}
            </Text>
          </Box>
          {error && <StatusMessage type="error">{error}</StatusMessage>}

          {viewState === 'assessment' && (
            <Box flexDirection="column">
              <Divider />
              <KeyMenu
                options={[
                  { key: 'P', label: 'Proceed', color: session.intake.assessment === 'READY' ? theme.ui.active : theme.ui.muted },
                  { key: 'A', label: 'Add details' },
                  { key: 'R', label: 'Revise' }
                ]}
                onSelect={handleMenuSelect}
              />
            </Box>
          )}

          {viewState === 'adding' && (
            <Box marginTop={1}>
              <TextInput promptLabel="Add details" onSubmit={handleAdditionalSubmit} />
            </Box>
          )}

          {viewState === 'revising' && (
            <Box marginTop={1}>
              <TextInput promptLabel="Revise understanding" onSubmit={handleAdditionalSubmit} />
            </Box>
          )}

          {viewState === 'finalizing' && (
            <WorkingIndicator label="PROC  Finalizing task summary" />
          )}
        </Box>
      )}

      {(viewState === 'biasing' || viewState === 'biasing_input') && (
        <Box flexDirection="column">
          {viewState === 'biasing' ? (
            <Box flexDirection="column">
              <Box marginLeft={2}>
                <Text color={theme.status.info}>QUERY</Text>
                <Text>  Apply biasing? Add guidance to shape assembly output.</Text>
              </Box>
              <Box marginLeft={2}>
                <Text color={theme.status.info}>SYS</Text>
                <Text>    Example: "Focus on migration steps" or "Include rollback plan"</Text>
              </Box>
              <Divider />
              <KeyMenu
                options={[
                  { key: 'Y', label: 'Add biasing' },
                  { key: 'N', label: 'Skip' }
                ]}
                onSelect={handleBiasingChoice}
              />
            </Box>
          ) : (
            <Box marginTop={1}>
              <TextInput promptLabel="Biasing guidance" onSubmit={handleBiasingSubmit} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
