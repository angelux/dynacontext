import { Text, Box } from 'ink';
import Divider from './Divider.jsx';
import theme from '../../theme.js';

export default function IntakeSummary({ data }) {
  const { summary, assessment, taskType, biasing } = data;

  // Extract Task: line via regex, fallback to first non-empty line
  const taskMatch = summary?.match(/^Task:\s+(.+)$/m);
  let taskDescription = taskMatch ? taskMatch[1] : '';

  if (!taskDescription && summary) {
    const lines = summary.split('\n').filter(line => line.trim() !== '');
    taskDescription = lines[0] || '';
  }

  // Truncate if needed (120 chars for better visibility)
  if (taskDescription.length > 120) {
    taskDescription = taskDescription.slice(0, 117) + '...';
  }

  const assessmentColor = assessment === 'READY' ? theme.status.success : theme.status.warning;
  const hasDirectives = biasing && biasing.trim() !== '';

  return (
    <Box flexDirection="column">
      <Divider />
      <Box flexDirection="row" justifyContent="space-between" marginLeft={2} marginRight={2}>
        <Text>{'\u25B8 INTAKE'}</Text>
        <Text color={assessmentColor}>{`[${assessment}]`}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color={theme.status.info}>SYS</Text>
        <Text>{`   Task: ${taskDescription}`}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color={theme.status.info}>SYS</Text>
        <Text>{`   Type: ${taskType}${hasDirectives ? ' | Biasing: yes' : ''}`}</Text>
      </Box>
      <Divider />
    </Box>
  );
}
