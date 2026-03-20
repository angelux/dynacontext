import { Text, Box, useInput } from 'ink';
import theme from '../../theme.js';

export default function KeyMenu({ options, onSelect }) {
  useInput((input, key) => {
    const char = input?.toUpperCase();
    if (!char) return;
    const option = options.find(opt => opt.key.toUpperCase() === char && !opt.disabled);
    if (option) {
      onSelect(char);
    }
  });

  return (
    <Box flexDirection="row" marginLeft={2}>
      {options.map((opt, index) => {
        const color = opt.disabled ? theme.ui.muted : (opt.color || undefined);
        return (
          <Box key={index} marginRight={4}>
            <Text color={color}>{`[${opt.key}] ${opt.label}`}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
