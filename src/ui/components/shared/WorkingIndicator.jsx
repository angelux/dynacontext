import { useState, useEffect, useRef } from 'react';
import { Text, Box } from 'ink';
import theme from '../../theme.js';

const BAR_WIDTH = 32;
const CYCLE_MS = 10000;
const UPDATE_INTERVAL = 250;

export default function WorkingIndicator({ label, detail }) {
  const startTimeRef = useRef(Date.now());
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) % CYCLE_MS;
      const filledCount = Math.min(Math.floor(elapsed / CYCLE_MS * (BAR_WIDTH + 1)), BAR_WIDTH);
      setFilled(filledCount);
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const filledChars = '█'.repeat(filled);
  const unfilledChars = '░'.repeat(BAR_WIDTH - filled);

  return (
    <Box flexDirection="column" marginLeft={2}>
      {label && <Text>{label}</Text>}
      {detail && <Text dimColor>{detail}</Text>}
      <Box>
        <Text color={theme.ui.accent}>{filledChars}</Text>
        <Text dimColor>{unfilledChars}</Text>
      </Box>
    </Box>
  );
}
