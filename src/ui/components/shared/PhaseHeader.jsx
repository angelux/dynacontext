import { Text, Box } from 'ink';
import Divider from './Divider.jsx';
import theme from '../../theme.js';

const PHASE_ORDER = ['INTAKE', 'RETRIEVAL', 'ASSEMBLY', 'REVIEW'];

export default function PhaseHeader({ phase, title }) {
  const currentIndex = PHASE_ORDER.indexOf(phase);

  const indicators = PHASE_ORDER.map((_, i) => {
    if (i < currentIndex) return { symbol: '●', color: theme.status.success };
    if (i === currentIndex) return { symbol: '◆', color: theme.ui.accent };
    return { symbol: '○', color: theme.ui.muted };
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Divider />
      <Box flexDirection="row" justifyContent="space-between" marginLeft={2} marginRight={2}>
        <Text bold>{title}</Text>
        <Box flexDirection="row">
          {indicators.map((ind, i) => (
            <Text key={i} color={ind.color}>{i > 0 ? ` ${ind.symbol}` : ind.symbol}</Text>
          ))}
        </Box>
      </Box>
      <Divider />
    </Box>
  );
}
