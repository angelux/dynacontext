import { Text, Box } from 'ink';
import PhaseHeader from './shared/PhaseHeader.jsx';
import Divider from './shared/Divider.jsx';
import KeyMenu from './shared/KeyMenu.jsx';
import theme from '../theme.js';
import { handleStepFileReload } from '../../pipeline.js';

export default function StepFileReviewView({ session, config, onPhaseComplete }) {
  const stepFiles = [
    { name: 'retrieval-step1.md', content: session.retrieval.steps[0] },
    { name: 'retrieval-step2.md', content: session.retrieval.steps[1] },
    { name: 'retrieval-step3.md', content: session.retrieval.steps[2] },
    { name: 'retrieval-step4.md', content: session.retrieval.steps[3] },
  ];

  return (
    <Box flexDirection="column">
      <PhaseHeader phase="RETRIEVAL" title="RETRIEVAL CHECKPOINT" />
      <Box marginLeft={2}>
        <Text color={theme.status.info}>STATUS</Text>
        <Text>  Retrieval complete. Step files staged for review:</Text>
      </Box>
      {stepFiles.map((file, index) => {
        const sizeStr = String(Math.ceil(file.content.length / 1024)).padStart(3, '0') + ' KB';
        const targetWidth = 44;
        const dots = '.'.repeat(Math.max(2, targetWidth - file.name.length - sizeStr.length));
        const line = `${file.name} ${dots} ${sizeStr}`;
        return (
          <Box key={index} marginLeft={2}>
            <Text>{line}</Text>
          </Box>
        );
      })}
      <Box marginTop={1} marginLeft={2}>
        <Text color={theme.status.info}>SYS</Text>
        <Text>  Files located in project root.</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color={theme.status.info}>SYS</Text>
        <Text>  Edit externally, then proceed to assembly.</Text>
      </Box>
      <Divider />
      <KeyMenu
        options={[{ key: 'P', label: 'Proceed' }]}
        onSelect={() => {
          handleStepFileReload(session);
          onPhaseComplete('ASSEMBLY');
        }}
      />
    </Box>
  );
}
