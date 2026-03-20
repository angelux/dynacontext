import { useState, useEffect, useRef } from 'react';
import { Text, Box, useInput } from 'ink';
import Divider from './shared/Divider.jsx';
import PhaseHeader from './shared/PhaseHeader.jsx';
import KeyMenu from './shared/KeyMenu.jsx';
import MarkdownRenderer from './shared/MarkdownRenderer.jsx';
import TextInput from './shared/TextInput.jsx';
import StatusMessage from './shared/StatusMessage.jsx';
import WorkingIndicator from './shared/WorkingIndicator.jsx';
import theme from '../theme.js';
import { saveAssemblyOutput, cleanupStepFiles, runRetrievalExpansion } from '../../phases/review.js';

export default function ReviewView({ session, config, onPhaseComplete }) {
  // States: 'menu' | 'revising' | 'expanding' | 'history' | 'saved'
  const [viewState, setViewState] = useState('menu');
  const [saveInfo, setSaveInfo] = useState(null);
  const [historyIndex, setHistoryIndex] = useState(session.assembly.revisionHistory.length);
  const [currentCommand, setCurrentCommand] = useState(null);
  const [warning, setWarning] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const history = [...session.assembly.revisionHistory, session.assembly.content];

  useEffect(() => {
    let timeout;
    if (viewState === 'saved') {
      timeout = setTimeout(() => {
        if (isMountedRef.current) setViewState('menu');
      }, 3000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [viewState]);

  const handleMenuSelect = (action) => {
    if (action === 'S') {
      const info = saveAssemblyOutput(session);
      setSaveInfo(info);
      setViewState('saved');
    } else if (action === 'X') {
      saveAssemblyOutput(session);
      cleanupStepFiles(config);
      onPhaseComplete('DONE');
    } else if (action === 'R') {
      setViewState('revising');
    } else if (action === 'E') {
      setViewState('expanding_input');
    } else if (action === 'H') {
      setViewState('history');
      setHistoryIndex(history.length - 1);
    }
  };

  const handleRevisionSubmit = (text) => {
    session.assembly.revisionHistory.push(session.assembly.content);
    session.assembly.revisionFeedback = text;
    onPhaseComplete('ASSEMBLY');
  };

  const handleExpansionSubmit = async (text) => {
    setViewState('expanding_running');
    try {
      await runRetrievalExpansion(session, text, {
        onToolCall: (cmd, status) => {
          if (!isMountedRef.current) return;
          setCurrentCommand({ cmd, status });
        },
        onTurnWarning: (turn) => {
          if (!isMountedRef.current) return;
          setWarning(turn);
        }
      });
      if (!isMountedRef.current) return;
      session.assembly.revisionHistory.push(session.assembly.content);
      onPhaseComplete('ASSEMBLY');
    } catch (err) {
      if (!isMountedRef.current) return;
      // Handle error? For now just go back to menu
      setViewState('menu');
    }
  };

  // History navigation input
  useInput((input, key) => {
    if (viewState !== 'history') return;

    if (key.leftArrow) {
      setHistoryIndex(Math.max(0, historyIndex - 1));
    } else if (key.rightArrow) {
      setHistoryIndex(Math.min(history.length - 1, historyIndex + 1));
    }
  });

  const handleHistoryAction = (action) => {
    if (action === 'C') {
      setViewState('menu');
    } else if (action === 'M') {
      setViewState('confirming_make_head');
    }
  };

  const handleHistoryConfirm = (choice) => {
    if (choice === 'Y') {
      session.assembly.content = history[historyIndex];
      session.assembly.revisionHistory = history.slice(0, historyIndex);
      session.assembly.revisionFeedback = '';
      session.assembly.retrievalRequested = false;
      setViewState('menu');
    } else {
      setViewState('history');
    }
  };

  return (
    <Box flexDirection="column">
      <PhaseHeader phase="REVIEW" title="REVIEW" />

      {(viewState !== 'history' && viewState !== 'confirming_make_head') && (
        <Box flexDirection="column">
          <MarkdownRenderer content={session.assembly.content} />
          <Divider />

          {viewState === 'menu' && (
            <KeyMenu
              options={[
                { key: 'S', label: 'Save' },
                { key: 'X', label: 'Save & Exit' },
                { key: 'R', label: 'Revise' },
                { key: 'E', label: 'Expand retrieval' },
                { key: 'H', label: 'History', disabled: session.assembly.revisionHistory.length === 0 }
              ]}
              onSelect={handleMenuSelect}
            />
          )}

          {viewState === 'saved' && saveInfo && (
            <StatusMessage type="success">
              {`Output committed: ${saveInfo.filename}`}
            </StatusMessage>
          )}

          {viewState === 'revising' && (
            <Box flexDirection="column">
              <Divider />
              <Box marginTop={1}>
                <TextInput
                  promptLabel="Revision instructions"
                  onSubmit={handleRevisionSubmit}
                />
              </Box>
            </Box>
          )}

          {viewState === 'expanding_input' && (
            <Box flexDirection="column">
              <Divider />
              <Box marginTop={1}>
                <TextInput
                  promptLabel="Describe additional context to retrieve"
                  onSubmit={handleExpansionSubmit}
                />
              </Box>
            </Box>
          )}

          {viewState === 'expanding_running' && (
            <Box flexDirection="column">
              <Box marginLeft={2}>
                <Text color={theme.status.info}>PROC</Text>
                <Text>  Expanding retrieval</Text>
              </Box>
              {currentCommand && (
                <Box marginLeft={3}>
                  <Text color={currentCommand.status === 'error' ? theme.status.error : theme.ui.accent}>⊹ </Text>
                  <Text dimColor>{currentCommand.cmd}</Text>
                </Box>
              )}
              {warning && (
                <Box marginLeft={2}>
                  <Text color={theme.status.warning}>{`⚠ WARN  Agent turn ${warning} reached threshold`}</Text>
                </Box>
              )}
              <WorkingIndicator />
            </Box>
          )}
        </Box>
      )}

      {(viewState === 'history' || viewState === 'confirming_make_head') && (
        <Box flexDirection="column">
          <Box marginBottom={1} marginLeft={2}>
            <Text bold color={theme.ui.accent}>{`REVISION HISTORY [${historyIndex + 1}/${history.length}]`}</Text>
            <Box marginLeft={2}>
              <Text dimColor>(Use ←/→ to navigate)</Text>
            </Box>
          </Box>
          <MarkdownRenderer content={history[historyIndex]} />
          <Divider />
          {viewState === 'history' ? (
            <KeyMenu
              options={[
                { key: 'M', label: 'Restore this version' },
                { key: 'C', label: 'Cancel' }
              ]}
              onSelect={handleHistoryAction}
            />
          ) : (
            <Box flexDirection="column">
              <Box marginLeft={2}>
                <Text color={theme.status.info}>QUERY</Text>
                <Text color={theme.status.warning} bold>  Restore this version? Future history will be truncated.</Text>
              </Box>
              <KeyMenu
                options={[
                  { key: 'Y', label: 'Yes' },
                  { key: 'N', label: 'No' }
                ]}
                onSelect={handleHistoryConfirm}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
