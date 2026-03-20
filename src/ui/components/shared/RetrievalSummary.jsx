import { Text, Box } from 'ink';
import Divider from './Divider.jsx';
import theme from '../../theme.js';

export default function RetrievalSummary() {
  return (
    <Box flexDirection="column">
      <Divider />
      <Box flexDirection="row" justifyContent="space-between" marginLeft={2} marginRight={2}>
        <Text>{'\u25B8 RETRIEVAL'}</Text>
        <Text color={theme.status.success}>complete</Text>
      </Box>
      <Divider />
    </Box>
  );
}
