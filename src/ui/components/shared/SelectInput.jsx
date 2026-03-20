import { useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import theme from '../../theme.js';

/**
 * SelectInput - Arrow-navigable option selection component
 *
 * Props:
 * - options: [{ label: string, value: any }]
 * - defaultValue: The value that should be initially highlighted
 * - onSelect(value): Called when user confirms selection with Enter or Space
 * - onCancel(): Called when user presses Escape (optional)
 *
 * Visual style:
 *   ❯ ● OpenAI     (highlighted, accent color)
 *     ○ Anthropic  (unhighlighted, muted)
 */
export default function SelectInput({ options, defaultValue, onSelect, onCancel }) {
  // Find initial highlighted index based on defaultValue
  const getInitialIndex = () => {
    if (defaultValue === undefined || defaultValue === null) return 0;
    const index = options.findIndex(opt => opt.value === defaultValue);
    return index >= 0 ? index : 0;
  };

  const [highlightedIndex, setHighlightedIndex] = useState(getInitialIndex);

  // Update highlighted index if defaultValue changes
  useEffect(() => {
    const index = options.findIndex(opt => opt.value === defaultValue);
    if (index >= 0) {
      setHighlightedIndex(index);
    }
  }, [defaultValue, options]);

  useInput((input, key) => {
    if (key.upArrow) {
      setHighlightedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setHighlightedIndex(prev => Math.min(options.length - 1, prev + 1));
    } else if (key.return || input === ' ') {
      // Enter or Space confirms selection
      onSelect(options[highlightedIndex].value);
    } else if (key.escape && onCancel) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      {options.map((option, index) => {
        const isHighlighted = index === highlightedIndex;
        const prefix = isHighlighted ? '❯' : ' ';
        const indicator = isHighlighted ? '●' : '○';
        const color = isHighlighted ? theme.ui.accent : undefined;
        const dimColor = !isHighlighted;

        return (
          <Box key={`option-${index}`}>
            <Text color={color} dimColor={dimColor}>{`${prefix} ${indicator} ${option.label}`}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
