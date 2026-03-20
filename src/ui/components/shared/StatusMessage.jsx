import { Text, Box } from 'ink';
import theme from '../../theme.js';

export default function StatusMessage({ type, children }) {
  let icon = '';
  let color = undefined;

  switch (type) {
    case 'success': icon = '✓ '; color = theme.status.success; break;
    case 'warning': icon = '⚠ '; color = theme.status.warning; break;
    case 'error': icon = '✗ '; color = theme.status.error; break;
    case 'info': icon = 'SYS '; color = theme.status.info; break;
    default: break;
  }

  return (
    <Box>
      <Text>  </Text>
      <Text color={color}>{icon}</Text>
      <Text>{children}</Text>
    </Box>
  );
}
