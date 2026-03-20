import { Text, Box } from 'ink';
import Divider from './Divider.jsx';
import theme from '../../theme.js';

export default function ResumeSummary({ data }) {
  const { summary, assessment, taskType, biasing, phase, sessionId } = data;

  // Extract Task: line via regex, fallback to first non-empty line
  const taskMatch = summary?.match(/^Task:\s+(.+)$/m);
  let taskDescription = taskMatch ? taskMatch[1] : '';

  if (!taskDescription && summary) {
    const lines = summary.split('\n').filter(line => line.trim() !== '');
    taskDescription = lines[0] || '';
  }

  // Truncate if needed (120 chars for consistency with IntakeSummary)
  if (taskDescription.length > 120) {
    taskDescription = taskDescription.slice(0, 117) + '...';
  }

  // Handle empty data gracefully
  const displayTask = taskDescription || 'No task description available';
  const displayType = taskType || 'unknown';
  const displayAssessment = assessment || 'UNKNOWN';

  // Format session timestamp if available
  const sessionTimestamp = sessionId
    ? new Date(Number(sessionId)).toLocaleString()
    : null;

  const assessmentColor = displayAssessment === 'READY'
    ? theme.status.success
    : theme.status.warning;
  const phaseColor = theme.ui.accent;

  return (
    <Box flexDirection="column">
      <Divider />
      <Box flexDirection="row" justifyContent="space-between" marginLeft={2} marginRight={2}>
        <Text>{'\u25B8 RESUME'}</Text>
        <Text color={phaseColor}>{`[${phase}]`}</Text>
      </Box>
      {sessionTimestamp && (
        <Box marginLeft={2}>
          <Text color={theme.status.info}>SYS</Text>
          <Text>{`   Session: ${sessionTimestamp}`}</Text>
        </Box>
      )}
      <Box marginLeft={2}>
        <Text color={theme.status.info}>SYS</Text>
        <Text>{`   Task: ${displayTask}`}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color={theme.status.info}>SYS</Text>
        <Text>{`   Type: ${displayType} | Assessment: `}</Text>
        <Text color={assessmentColor}>{displayAssessment}</Text>
      </Box>
      <Divider />
    </Box>
  );
}
