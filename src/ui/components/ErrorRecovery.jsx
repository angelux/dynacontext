import { Text, Box } from 'ink';
import KeyMenu from './shared/KeyMenu.jsx';
import Divider from './shared/Divider.jsx';
import theme from '../theme.js';

export default function ErrorRecovery({ phase, errorMessage, onAction }) {
  const options = phase === 'ASSEMBLY' ? [
    { key: 'R', label: 'Retry' },
    { key: 'E', label: 'Re-run retrieval' },
    { key: 'Q', label: 'Quit' }
  ] : [
    { key: 'R', label: 'Retry from failure' },
    { key: 'F', label: 'Full restart' },
    { key: 'Q', label: 'Quit' }
  ];

  return (
    <Box flexDirection="column" marginTop={1}>
      <Divider />
      <Box marginTop={1} marginBottom={1}>
        <Text color={theme.status.error} bold>{`  ✗ Error in ${phase}: `}</Text>
        <Text>{errorMessage}</Text>
      </Box>
      <KeyMenu options={options} onSelect={onAction} />
    </Box>
  );
}
