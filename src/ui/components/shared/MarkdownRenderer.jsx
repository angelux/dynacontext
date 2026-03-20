import { Text } from 'ink';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

marked.use(markedTerminal());

export default function MarkdownRenderer({ content }) {
  const rendered = marked(content || '');
  return <Text>{rendered.trim()}</Text>;
}
