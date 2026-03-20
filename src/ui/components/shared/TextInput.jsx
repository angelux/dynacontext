import { useRef, useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import theme from '../../theme.js';

/**
 * TextInput (Ink-Native with Dual-Mode Rendering)
 * Handles multiline text input with two rendering strategies:
 * - Single keystrokes: synchronous state update for flicker-free rendering
 * - Paste (multi-char input): ref-buffered queueMicrotask flush for batch performance
 * Renders through Ink's layout system for proper parent offset handling.
 * Submission is triggered by typing "END" on a new line, or immediately if
 * the immediateSubmit predicate returns true for the current buffer.
 */
export default function TextInput({ promptLabel = '', onSubmit, immediateSubmit }) {
  // Buffer ref: authoritative source of truth, never triggers renders
  const bufferRef = useRef('');
  // Flush tracking: prevents multiple flushes in the same tick
  const flushScheduledRef = useRef(false);
  // Display state: drives React rendering
  const [displayText, setDisplayText] = useState('');

  // Flush buffer to display state (called via queueMicrotask)
  const flushBuffer = () => {
    setDisplayText(bufferRef.current);
    flushScheduledRef.current = false;
  };

  // Schedule a flush if not already scheduled
  const scheduleFlush = () => {
    if (!flushScheduledRef.current) {
      flushScheduledRef.current = true;
      queueMicrotask(flushBuffer);
    }
  };

  // Track focus for cursor rendering
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    setIsFocused(true);
    return () => setIsFocused(false);
  }, []);

  useInput((input, key) => {
    // --- 1. BACKSPACE / DELETE ---
    if (key.backspace || key.delete) {
      if (bufferRef.current.length > 0) {
        bufferRef.current = bufferRef.current.slice(0, -1);
        setDisplayText(bufferRef.current);
      }
      return;
    }

    // --- 2. ENTER KEY ---
    if (key.return) {
      // Immediate submit: if predicate matches, submit without requiring END
      if (immediateSubmit) {
        const trimmed = bufferRef.current.trim();
        if (immediateSubmit(trimmed)) {
          onSubmit(trimmed);
          return;
        }
      }

      const currentLines = bufferRef.current.split('\n');
      const lastLine = currentLines[currentLines.length - 1] || '';

      if (lastLine.trim().toUpperCase() === 'END') {
        // Clean up the buffer: remove the "END" marker and trailing newline
        const finalOutput = bufferRef.current.replace(/(\r?\n)?END$/i, '');
        onSubmit(finalOutput.trim());
        return;
      }

      bufferRef.current += '\n';
      setDisplayText(bufferRef.current);
      return;
    }

    // --- 3. INPUT (Typing or Pasting) ---
    if (input) {
      // Normalize newlines to prevent formatting issues across different OS pastes
      const normalizedInput = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      bufferRef.current += normalizedInput;

      if (normalizedInput.length === 1) {
        // Single keystroke — synchronous update for clean render
        setDisplayText(bufferRef.current);
      } else {
        // Multi-character input (paste) — deferred batch flush
        scheduleFlush();
      }
    }
  });

  // Render each line separately with proper indentation via Box marginLeft
  // This ensures wrapped text maintains indentation (unlike terminal wrapping)
  const lines = displayText.length === 0 ? [''] : displayText.split('\n');

  return (
    <Box flexDirection="column">
      {promptLabel ? (
        <Box marginLeft={2} marginBottom={0}>
          <Text color={theme.ui.accent}>{promptLabel}</Text>
        </Box>
      ) : null}
      {lines.map((line, index) => {
        const isLastLine = index === lines.length - 1;
        const lineContent = isFocused && isLastLine ? line + '█' : line;
        return (
          <Box key={`input-line-${index}`} marginLeft={2}>
            <Text>{`❯ ${lineContent}`}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
