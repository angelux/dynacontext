import { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import { deleteSession } from '../../services/session.js';
import Divider from './shared/Divider.jsx';
import theme from '../theme.js';

export default function SessionMenu({ sessions: initialSessions, onSelect }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inDeleteMode, setInDeleteMode] = useState(false);

  useInput((input, key) => {
    const char = input?.toUpperCase();

    if (inDeleteMode) {
      if (char === 'Y') {
        const sessionId = sessions[selectedIndex].id;
        try {
          deleteSession(sessionId);
        } catch (err) {}

        const nextSessions = sessions.filter((_, i) => i !== selectedIndex);
        setSessions(nextSessions);

        if (nextSessions.length === 0) {
          onSelect({ action: 'new' });
        } else {
          setSelectedIndex(Math.min(selectedIndex, nextSessions.length - 1));
          setInDeleteMode(false);
        }
      } else if (char === 'N') {
        setInDeleteMode(false);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(sessions.length - 1, selectedIndex + 1));
    } else if (key.return) {
      onSelect({ action: 'resume', id: sessions[selectedIndex].id });
    } else if (char === 'N') {
      onSelect({ action: 'new' });
    } else if (char === 'S') {
      onSelect({ action: 'settings' });
    } else if (char === 'D') {
      setInDeleteMode(true);
    }
  });

  const getPhaseColor = (phase) => theme.phase[phase] || theme.phase.default;

  return (
    <Box flexDirection="column">
      <Box marginTop={1} marginBottom={1} marginLeft={2}>
        <Text color={theme.status.info}>SYS</Text>
        <Text bold>  Active Sessions</Text>
      </Box>
      <Divider />
      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        {sessions.map((session, i) => {
          const isSelected = i === selectedIndex;
          const prefix = isSelected ? <Text color={theme.ui.accent}>❯</Text> : <Text> </Text>;
          const phaseColor = getPhaseColor(session.phase);

          let displayName = session.displayName;
          const maxNameLength = 36;
          if (displayName.length > maxNameLength) {
            displayName = displayName.slice(0, maxNameLength - 1) + '…';
          }

          return (
            <Box key={session.id} marginLeft={2}>
              {prefix}
              <Text>{` ${displayName.padEnd(38)} `}</Text>
              <Text color={phaseColor}>{session.phase}</Text>
            </Box>
          );
        })}
      </Box>
      {inDeleteMode ? (
        <Box marginBottom={2} marginLeft={2}>
          <Text color={theme.status.info}>QUERY</Text>
          <Text color={theme.status.error}>{`  Delete "${sessions[selectedIndex].displayName.slice(0, 30)}"? [Y/N]`}</Text>
        </Box>
      ) : (
        <Box marginBottom={2} marginLeft={2}>
          <Text dimColor>{`[↑↓] Navigate   [Enter] Resume   [N] New   [S] Settings   [D] Delete`}</Text>
        </Box>
      )}
    </Box>
  );
}
