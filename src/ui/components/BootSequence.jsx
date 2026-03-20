import { useState, useEffect, useRef } from 'react';
import { Text, Box } from 'ink';
import Divider from './shared/Divider.jsx';
import theme from '../theme.js';

const ASCII_ART = [
  ` `,
  `  ██████████                                     █████████                       █████                          █████  `,
  `░░███░░░░███                                   ███░░░░░███                     ░░███                          ░░███    `,
  ` ░███   ░░███ █████ ████ ████████    ██████   ███     ░░░   ██████  ████████   ███████    ██████  █████ █████ ███████  `,
  ` ░███    ░███░░███ ░███ ░░███░░███  ░░░░░███ ░███          ███░░███░░███░░███ ░░░███░    ███░░███░░███ ░░███ ░░░███░   `,
  ` ░███    ░███ ░███ ░███  ░███ ░███   ███████ ░███         ░███ ░███ ░███ ░███   ░███    ░███████  ░░░█████░    ░███    `,
  ` ░███    ███  ░███ ░███  ░███ ░███  ███░░███ ░░███     ███░███ ░███ ░███ ░███   ░███ ███░███░░░    ███░░░███   ░███ ███`,
  ` ██████████   ░░███████  ████ █████░░████████ ░░█████████ ░░██████  ████ █████  ░░█████ ░░██████  █████ █████  ░░█████ `,
  `░░░░░░░░░░     ░░░░░███ ░░░░ ░░░░░  ░░░░░░░░   ░░░░░░░░░   ░░░░░░  ░░░░ ░░░░░    ░░░░░   ░░░░░░  ░░░░░ ░░░░░    ░░░░░  `,
  `               ███ ░███`,
  `              ░░██████`,
  `               ░░░░░░`,
  ` `,
  `▖   ▞▀▖      ▐        ▐   ▞▀▖               ▐  ▗        ▛▀▘      ▗        ▗▀▖       ▌ ▌                         ▌ ▞▀▖▜▘`,
  `▝▚▖ ▌  ▞▀▖▛▀▖▜▀ ▞▀▖▚▗▘▜▀  ▌▄▖▞▀▖▛▀▖▞▀▖▙▀▖▝▀▖▜▀ ▄ ▞▀▖▛▀▖ ▙▄ ▛▀▖▞▀▌▄ ▛▀▖▞▀▖ ▐  ▞▀▖▙▀▖ ▙▄▌▌ ▌▛▚▀▖▝▀▖▛▀▖▞▀▘ ▝▀▖▛▀▖▞▀▌ ▙▄▌▐ `,
  `▞▘  ▌ ▖▌ ▌▌ ▌▐ ▖▛▀ ▗▚ ▐ ▖ ▌ ▌▛▀ ▌ ▌▛▀ ▌  ▞▀▌▐ ▖▐ ▌ ▌▌ ▌ ▌  ▌ ▌▚▄▌▐ ▌ ▌▛▀  ▜▀ ▌ ▌▌   ▌ ▌▌ ▌▌▐ ▌▞▀▌▌ ▌▝▀▖ ▞▀▌▌ ▌▌ ▌ ▌ ▌▐ `,
  `    ▝▀ ▝▀ ▘ ▘ ▀ ▝▀▘▘ ▘ ▀  ▝▀ ▝▀▘▘ ▘▝▀▘▘  ▝▀▘ ▀ ▀▘▝▀ ▘ ▘ ▀▀▘▘ ▘▗▄▘▀▘▘ ▘▝▀▘ ▐  ▝▀ ▘   ▘ ▘▝▀▘▘▝ ▘▝▀▘▘ ▘▀▀  ▝▀▘▘ ▘▝▀▘ ▘ ▘▀▘`,
  ` `
];

const STEPS = [
  { label: 'Loading configuration', status: '✓' },
  { label: 'Validating API credentials', status: '✓' },
  { label: 'Scanning project directory', status: '✓' },
];

export default function BootSequence({ config, onComplete, isStatic }) {
  const [stepIndex, setStepIndex] = useState(isStatic ? STEPS.length : -1);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isStatic) return;
    let timer;
    if (stepIndex < STEPS.length - 1) {
      timer = setTimeout(() => {
        setStepIndex(stepIndex + 1);
      }, 100);
    } else {
      timer = setTimeout(() => {
        if (isMountedRef.current && onComplete) onComplete();
      }, 500);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [stepIndex, onComplete, isStatic]);

  return (
    <Box flexDirection="column">
      {ASCII_ART.map((line, i) => <Text key={`art-${i}`}>{line}</Text>)}
      {STEPS.slice(0, stepIndex + 1).map((step, i) => {
        const dots = '.'.repeat(Math.max(0, 30 - step.label.length));
        return (
          <Box key={`step-${i}`}>
            <Text>{`  INIT  ${step.label}${dots} `}</Text>
            <Text color={theme.status.success}>{step.status}</Text>
          </Box>
        );
      })}
      {stepIndex >= STEPS.length - 1 && (
        <Box flexDirection="column" marginTop={1}>
          <Box><Text color={theme.status.info}>  SYS</Text><Text>{`   Project: ${process.cwd().split('/').pop()}`}</Text></Box>
          <Box><Text color={theme.status.info}>  SYS</Text><Text>{`   Intake model:   ${config?.intake?.model}`}</Text></Box>
          <Box><Text color={theme.status.info}>  SYS</Text><Text>{`   Assembly model: ${config?.assembly?.model}`}</Text></Box>
          <Box><Text color={theme.status.info}>  SYS</Text><Text>{`   Agent model:    ${config?.agent?.model}`}</Text></Box>
          <Box marginTop={1} marginBottom={1}>
            <Text color={theme.status.success}>  ✓ System operational</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
