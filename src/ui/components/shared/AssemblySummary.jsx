import { Text, Box } from 'ink';
import Divider from './Divider.jsx';
import theme from '../../theme.js';

export default function AssemblySummary({ data }) {
  const { retrievalRequested } = data;

  return (
    <Box flexDirection="column">
      <Divider />
      <Box flexDirection="row" justifyContent="space-between" marginLeft={2} marginRight={2}>
        <Text>{'\u25B8 ASSEMBLY'}</Text>
        <Text color={theme.status.success}>complete</Text>
      </Box>
      {retrievalRequested && (
        <Box marginLeft={2}>
          <Text color={theme.status.info}>SYS</Text>
          <Text>  Retrieval expansion: yes</Text>
        </Box>
      )}
      <Divider />
    </Box>
  );
}
