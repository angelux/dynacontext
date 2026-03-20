import { useState, useEffect, useRef } from 'react';
import { Text, Box } from 'ink';
import Divider from './shared/Divider.jsx';
import PhaseHeader from './shared/PhaseHeader.jsx';
import WorkingIndicator from './shared/WorkingIndicator.jsx';
import KeyMenu from './shared/KeyMenu.jsx';
import TextInput from './shared/TextInput.jsx';
import ErrorRecovery from './ErrorRecovery.jsx';
import StatusMessage from './shared/StatusMessage.jsx';
import theme from '../theme.js';
import {
  callAssemblyLLM,
  reassembleWithDenial,
  executeRetrievalAndReassemble
} from '../../phases/assembly.js';
import { notify } from '../../services/notify.js';

export default function AssemblyView({ session, config, onPhaseComplete }) {
  // States: 'processing' | 'gate' | 'modifying' | 'expanding' | 'error'
  const [viewState, setViewState] = useState('processing');
  const [error, setError] = useState(null);
  const [retrievalRequest, setRetrievalRequest] = useState(null);
  const [currentCommand, setCurrentCommand] = useState(null);
  const [warning, setWarning] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (viewState === 'processing') {
      const runAssembly = async () => {
        try {
          const { content, retrievalRequest: request } = await callAssemblyLLM(session);

          if (!isMountedRef.current) return;

          if (!request || session.assembly.retrievalRequested) {
            session.assembly.content = content.replace(/\[ASSEMBLY_RETRIEVAL_REQUEST\][\s\S]*?\[\/ASSEMBLY_RETRIEVAL_REQUEST\]/, '').trim();
            onPhaseComplete('REVIEW');
          } else {
            setRetrievalRequest(request);
            setViewState('gate');
            notify('DynaContext', 'Assembly requesting additional files.');
          }
        } catch (err) {
          if (!isMountedRef.current) return;
          setError(err.message);
          setViewState('error');
        }
      };
      runAssembly();
    }
  }, [viewState]);

  const handleGateSelect = async (action) => {
    if (action === 'D') {
      setViewState('processing_denial');
      try {
        const content = await reassembleWithDenial(session);
        if (!isMountedRef.current) return;
        session.assembly.content = content;
        onPhaseComplete('REVIEW');
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err.message);
        setViewState('error');
      }
    } else if (action === 'A') {
      startExpansion(retrievalRequest);
    } else if (action === 'M') {
      setViewState('modifying');
    }
  };

  const startExpansion = async (request) => {
    setViewState('expanding');
    try {
      const content = await executeRetrievalAndReassemble(session, request, {
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
      session.assembly.content = content;
      onPhaseComplete('REVIEW');
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message);
      setViewState('error');
    }
  };

  const handleModifySubmit = (text) => {
    // Basic modification: just update targetedSearch with the new text
    const modifiedRequest = { ...retrievalRequest, targetedSearch: text };
    startExpansion(modifiedRequest);
  };

  const handleErrorAction = (action) => {
    if (action === 'R') {
      setViewState('processing');
      setError(null);
    } else if (action === 'E') {
      onPhaseComplete('RETRIEVAL');
    } else if (action === 'Q') {
      onPhaseComplete('DONE');
    }
  };

  return (
    <Box flexDirection="column">
      <PhaseHeader phase="ASSEMBLY" title="CONTEXT ASSEMBLY" />

      {viewState === 'processing' && (
        <WorkingIndicator
          label="PROC  Assembling context package"
          detail={`SYS   Model: ${config.assembly.model}`}
        />
      )}

      {viewState === 'processing_denial' && (
        <WorkingIndicator label="PROC  Reassembling with current context" />
      )}

      {viewState === 'error' && (
        <ErrorRecovery
          phase="ASSEMBLY"
          errorMessage={error}
          onAction={handleErrorAction}
        />
      )}

      {viewState === 'gate' && (
        <Box flexDirection="column">
          <Box marginBottom={1} marginLeft={2}>
            <Text bold>RETRIEVAL REQUEST</Text>
          </Box>
          {retrievalRequest.directReads.length > 0 && (
            <Box flexDirection="column" marginBottom={1} marginLeft={2}>
              <Text dimColor>Direct Reads:</Text>
              {retrievalRequest.directReads.map((r, i) => (
                <Box key={i} marginLeft={2}>
                  <Text>{`- ${r.path} (${r.reason})`}</Text>
                </Box>
              ))}
            </Box>
          )}
          {retrievalRequest.targetedSearch && (
            <Box flexDirection="column" marginBottom={1} marginLeft={2}>
              <Text dimColor>Targeted Search:</Text>
              <Box marginLeft={2}>
                <Text>{retrievalRequest.targetedSearch}</Text>
              </Box>
            </Box>
          )}
          <Divider />
          <KeyMenu
            options={[
              { key: 'A', label: 'Approve' },
              { key: 'D', label: 'Deny' },
              { key: 'M', label: 'Modify' }
            ]}
            onSelect={handleGateSelect}
          />
        </Box>
      )}

      {viewState === 'modifying' && (
        <Box flexDirection="column">
          <Divider />
          <Box marginTop={1}>
            <TextInput
              promptLabel="Modify targeted search"
              onSubmit={handleModifySubmit}
            />
          </Box>
        </Box>
      )}

      {viewState === 'expanding' && (
        <Box flexDirection="column">
          <Box marginLeft={2}>
            <Text color={theme.status.info}>PROC</Text>
            <Text>  Executing targeted retrieval</Text>
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
  );
}
