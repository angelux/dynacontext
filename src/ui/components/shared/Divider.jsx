import { Text, useStdout } from 'ink';

export default function Divider() {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;
  const line = '─'.repeat(width);

  return <Text dimColor>{line}</Text>;
}
