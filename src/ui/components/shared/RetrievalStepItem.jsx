import { Text, Box } from 'ink';
import theme from '../../theme.js';

export default function RetrievalStepItem({ data }) {
  const { label, title, count } = data;
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginLeft={2}>
        <Text>{`STEP ${label}: ${title}`}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color={theme.status.success}>✓</Text>
        <Text>{` Complete — ${count} commands executed`}</Text>
      </Box>
    </Box>
  );
}
