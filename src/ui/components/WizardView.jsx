import { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import Divider from './shared/Divider.jsx';
import SelectInput from './shared/SelectInput.jsx';
import theme from '../theme.js';
import { getDefaultUserConfig, saveConfig, loadConfig } from '../../services/config.js';

const STEPS = [
  { id: 'welcome', title: 'Welcome', hasFields: false },
  { id: 'intake', title: 'Intake Provider', section: 'intake', fieldCount: 4 },
  { id: 'assembly', title: 'Assembly Provider', section: 'assembly', fieldCount: 4 },
  { id: 'agent', title: 'Agent Provider', section: 'agent', fieldCount: 4 },
  { id: 'output', title: 'Output Settings', section: 'output', fieldCount: 2 },
  { id: 'stepFiles', title: 'Step File Behavior', section: 'stepFiles', fieldCount: 2 },
  { id: 'confirm', title: 'Configuration Summary', hasFields: false }
];

const FIELDS = {
  intake: [
    { key: 'endpoint', label: 'ENDPOINT', description: 'API endpoint URL',
      hint: 'Full URL for the intake LLM API (e.g. https://api.openai.com/v1/chat/completions)',
      required: true },
    { key: 'model', label: 'MODEL', description: 'Model identifier',
      hint: 'Model name as recognized by your provider (e.g. gpt-4o, deepseek/deepseek-v3.2)',
      required: true },
    { key: 'apiKey', label: 'API KEY', description: 'API key or env var',
      hint: 'Environment variable name (e.g. OPENAI_API_KEY) or the literal API key',
      required: true },
    { key: 'format', label: 'FORMAT', description: 'API format',
      type: 'choice', options: ['openai', 'anthropic'],
      defaultValue: 'openai' }
  ],
  assembly: [
    { key: 'endpoint', label: 'ENDPOINT', description: 'API endpoint URL',
      hint: 'Full URL for the assembly LLM API',
      required: true },
    { key: 'model', label: 'MODEL', description: 'Model identifier',
      hint: 'Model name for context assembly (e.g. claude-opus-4.6, gpt-4o)',
      required: true },
    { key: 'apiKey', label: 'API KEY', description: 'API key or env var',
      hint: 'Environment variable name or literal API key for the assembly provider',
      required: true },
    { key: 'format', label: 'FORMAT', description: 'API format',
      type: 'choice', options: ['openai', 'anthropic'],
      defaultValue: 'openai' }
  ],
  agent: [
    { key: 'endpoint', label: 'ENDPOINT', description: 'API endpoint URL',
      hint: 'Full URL for the retrieval agent API (e.g. https://api.anthropic.com/v1/messages)',
      required: true },
    { key: 'model', label: 'MODEL', description: 'Model identifier',
      hint: 'Model name for the tool-calling retrieval agent (e.g. claude-sonnet-4-20250514)',
      required: true },
    { key: 'apiKey', label: 'API KEY', description: 'API key or env var',
      hint: 'Environment variable name or literal API key for the agent provider',
      required: true },
    { key: 'format', label: 'FORMAT', description: 'API format',
      type: 'choice', options: ['openai', 'anthropic'],
      defaultValue: 'anthropic' }
  ],
  output: [
    { key: 'filenamePrefix', label: 'FILENAME PREFIX', description: 'Output file prefix',
      hint: 'Prefix for generated context files',
      defaultValue: 'DYNA' },
    { key: 'dir', label: 'OUTPUT DIRECTORY', description: 'Output directory path',
      hint: 'Directory where context files are saved (relative to project root)',
      defaultValue: '.' }
  ],
  stepFiles: [
    { key: 'cleanup', label: 'CLEANUP', description: 'Remove step files after assembly?',
      type: 'boolean', defaultValue: true },
    { key: 'reviewBeforeAssembly', label: 'REVIEW', description: 'Review before assembly?',
      type: 'boolean', defaultValue: true }
  ]
};

export default function WizardView({ onComplete, onValidateConfig }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [config, setConfig] = useState(() => {
    // Start with empty provider fields, sensible defaults for everything else
    return {
      intake: { endpoint: '', model: '', apiKey: '', format: 'openai' },
      assembly: { endpoint: '', model: '', apiKey: '', format: 'openai' },
      agent: { endpoint: '', model: '', apiKey: '', format: 'anthropic' },
      output: { filenamePrefix: 'DYNA', dir: '.' },
      stepFiles: { cleanup: true, reviewBeforeAssembly: true }
    };
  });
  const [fieldIndex, setFieldIndex] = useState(0);
  const [inputBuffer, setInputBuffer] = useState('');
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);

  const currentStep = STEPS[stepIndex];

  // Helper to go back one field
  const goBack = () => {
    setFieldError(null);
    setInputBuffer('');

    if (fieldIndex > 0) {
      // Go to previous field in same step
      setFieldIndex(fieldIndex - 1);
    } else if (stepIndex > 1) {
      // Go to last field of previous step
      const prevStep = STEPS[stepIndex - 1];
      if (prevStep.fieldCount) {
        setStepIndex(stepIndex - 1);
        setFieldIndex(prevStep.fieldCount - 1);
      }
    } else if (stepIndex === 1) {
      // At first field of first step, go back to welcome
      setStepIndex(0);
      setFieldIndex(0);
    }
  };

  // Helper to advance to next field/step
  const advance = () => {
    setFieldError(null);
    setInputBuffer('');

    const section = currentStep.section;
    const fields = FIELDS[section];

    if (fieldIndex < fields.length - 1) {
      setFieldIndex(fieldIndex + 1);
    } else {
      setStepIndex(stepIndex + 1);
      setFieldIndex(0);
    }
  };

  useInput((input, key) => {
    setError(null);

    // Welcome screen - any key advances
    if (stepIndex === 0) {
      setStepIndex(1);
      setFieldIndex(0);
      setInputBuffer('');
      return;
    }

    // Confirmation screen
    if (stepIndex === STEPS.length - 1) {
      const char = input?.toUpperCase();
      if (char === 'Y') {
        handleSave();
      } else if (char === 'B') {
        setStepIndex(stepIndex - 1);
        const prevStep = STEPS[stepIndex - 1];
        if (prevStep.fieldCount) {
          setFieldIndex(prevStep.fieldCount - 1);
        }
      }
      return;
    }

    const section = currentStep.section;
    const fields = FIELDS[section];
    const currentField = fields[fieldIndex];

    // For choice and boolean fields, SelectInput handles all input
    // Parent returns early to avoid consuming keystrokes
    if (currentField.type === 'choice' || currentField.type === 'boolean') {
      // Escape is handled by SelectInput's onCancel
      return;
    }

    // Handle escape key - go back
    if (key.escape) {
      goBack();
      return;
    }

    // Handle return key - accept value and advance
    if (key.return) {
      const value = inputBuffer.trim() || getFieldValue(section, currentField.key);

      // Validate required fields
      if (currentField.required && !value) {
        setFieldError('This field is required');
        return;
      }

      updateFieldValue(section, currentField.key, value);
      advance();
      return;
    }

    // Handle backspace/delete
    if (key.backspace || key.delete) {
      setInputBuffer(prev => prev.slice(0, -1));
      setFieldError(null);
      return;
    }

    // Regular text input
    if (input && !key.ctrl && !key.meta) {
      setInputBuffer(prev => prev + input);
      setFieldError(null);
    }
  });

  const getFieldValue = (section, field) => {
    return config[section]?.[field] ?? '';
  };

  const updateFieldValue = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    try {
      saveConfig(config);
      const mergedConfig = loadConfig();
      const errors = onValidateConfig(mergedConfig);
      if (errors.length > 0) {
        setError(errors.join('\n'));
        return;
      }
      onComplete(mergedConfig);
    } catch (err) {
      setError(err.message);
    }
  };

  // Render welcome screen
  if (stepIndex === 0) {
    return (
      <Box flexDirection="column">
        <Divider />
        <Box marginLeft={1}>
          <Text bold>DYNACONTEXT - FIRST RUN SETUP</Text>
        </Box>
        <Divider />
        <Box marginLeft={1} marginTop={1}>
          <Text>Welcome. This wizard will configure your API providers and output preferences.</Text>
        </Box>
        <Box marginLeft={1} marginTop={1}>
          <Text>Configuration will be saved to ~/.dynacontext/config.json</Text>
        </Box>
        <Box marginLeft={1} marginTop={1}>
          <Text>Press any key to begin.</Text>
        </Box>
        {error && (
          <Box marginLeft={1} marginTop={1}>
            <Text color={theme.status.error}>{`Error: ${error}`}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // Render confirmation screen
  if (stepIndex === STEPS.length - 1) {
    const getKeyHint = (key) => {
      if (!key) return 'not set';
      if (key.length > 12) return key.slice(0, 8) + '...';
      return key;
    };

    return (
      <Box flexDirection="column">
        <Divider />
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.info}>SYS</Text>
          <Text bold>   CONFIGURATION SUMMARY</Text>
        </Box>
        <Divider />
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.info}>INTAKE</Text>
          <Text>{`      ${config.intake.model} @ ${config.intake.endpoint.slice(0, 30)}...`}</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.info}>ASSEMBLY</Text>
          <Text>{`    ${config.assembly.model} @ ${config.assembly.endpoint.slice(0, 30)}...`}</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.info}>AGENT</Text>
          <Text>{`       ${config.agent.model} @ ${config.agent.endpoint.slice(0, 30)}...`}</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.info}>OUTPUT</Text>
          <Text>{`      ${config.output.filenamePrefix} / ${config.output.dir}`}</Text>
        </Box>
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.info}>STEP FILES</Text>
          <Text>{`  cleanup: ${config.stepFiles.cleanup ? 'yes' : 'no'} / review: ${config.stepFiles.reviewBeforeAssembly ? 'yes' : 'no'}`}</Text>
        </Box>
        <Divider />
        <Box marginLeft={2} marginTop={1}>
          <Text dimColor>[Y] Save and continue   [B] Go back</Text>
        </Box>
        {error && (
          <Box marginLeft={2} marginTop={1}>
            <Text color={theme.status.error}>{`Error: ${error}`}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // Render field input steps
  const section = currentStep.section;
  const fields = FIELDS[section];
  const currentField = fields[fieldIndex];
  const currentValue = getFieldValue(section, currentField.key);
  const displayValue = inputBuffer || currentValue;
  const isEmptyField = !inputBuffer && !currentValue;

  // Determine hint bar text based on field type
  const getHintBar = () => {
    if (currentField.type === 'choice' || currentField.type === 'boolean') {
      return '[↑↓] Navigate   [Enter/Space] Select   [Esc] Back';
    }
    return '[Enter] Confirm   [Esc] Back';
  };

  return (
    <Box flexDirection="column">
      <Divider />
      <Box marginLeft={1}>
        <Text bold>{`SETUP: ${currentStep.title.toUpperCase()}`}</Text>
      </Box>
      <Divider />
      <Box marginLeft={1} marginTop={1}>
        <Text>{`${currentStep.section === 'stepFiles' ? 'Configure step file behavior options.' : `Configure the ${currentStep.section} provider.`}`}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {fields.map((field, idx) => {
          const isActive = idx === fieldIndex;
          const fieldValue = isActive ? displayValue : getFieldValue(section, field.key);
          const prefix = isActive ? '>' : ' ';

          // Choice field rendering
          if (field.type === 'choice') {
            if (isActive) {
              return (
                <Box key={field.key} flexDirection="column" marginLeft={2}>
                  <Box>
                    <Text color={theme.status.info}>{`${prefix} ${field.label}`}</Text>
                  </Box>
                  <Box marginLeft={4}>
                    <SelectInput
                      options={field.options.map(opt => ({ label: opt.charAt(0).toUpperCase() + opt.slice(1), value: opt }))}
                      defaultValue={currentValue}
                      onSelect={(value) => {
                        updateFieldValue(section, field.key, value);
                        advance();
                      }}
                      onCancel={goBack}
                    />
                  </Box>
                </Box>
              );
            }
            // Inactive choice field
            return (
              <Box key={field.key} marginLeft={2}>
                <Text color={theme.ui.muted}>{`${prefix} ${field.label}`}</Text>
                <Text>  </Text>
                <Text>{fieldValue}</Text>
              </Box>
            );
          }

          // Boolean field rendering
          if (field.type === 'boolean') {
            if (isActive) {
              return (
                <Box key={field.key} flexDirection="column" marginLeft={2}>
                  <Box>
                    <Text color={theme.status.info}>{`${prefix} ${field.label}  ${field.description}`}</Text>
                  </Box>
                  <Box marginLeft={4}>
                    <SelectInput
                      options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]}
                      defaultValue={currentValue}
                      onSelect={(value) => {
                        updateFieldValue(section, field.key, value);
                        advance();
                      }}
                      onCancel={goBack}
                    />
                  </Box>
                </Box>
              );
            }
            // Inactive boolean field
            return (
              <Box key={field.key} marginLeft={2}>
                <Text color={theme.ui.muted}>{`${prefix} ${field.label}`}</Text>
                <Text>  </Text>
                <Text>{fieldValue ? 'Yes' : 'No'}</Text>
              </Box>
            );
          }

          // String field rendering (default)
          if (isActive) {
            // Show cursor and hint for active string field
            return (
              <Box key={field.key} flexDirection="column" marginLeft={2}>
                <Box>
                  <Text color={theme.status.info}>{`${prefix} ${field.label}`}</Text>
                  <Text>  </Text>
                  <Text bold>{`${displayValue}${isEmptyField ? '' : '█'}`}</Text>
                </Box>
                {isEmptyField && (
                  <Box marginLeft={4}>
                    <Text dimColor color={theme.ui.muted}>{field.hint || ''}</Text>
                  </Box>
                )}
                {fieldError && (
                  <Box marginLeft={4}>
                    <Text color={theme.status.error}>{fieldError}</Text>
                  </Box>
                )}
              </Box>
            );
          }

          // Inactive string field
          const displayFieldValue = fieldValue || '—';
          return (
            <Box key={field.key} marginLeft={2}>
              <Text color={theme.ui.muted}>{`${prefix} ${field.label}`}</Text>
              <Text>  </Text>
              <Text>{displayFieldValue}</Text>
            </Box>
          );
        })}
      </Box>
      <Divider />
      <Box marginLeft={2} marginTop={1}>
        <Text dimColor>{getHintBar()}</Text>
      </Box>
      {error && (
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.error}>{`Error: ${error}`}</Text>
        </Box>
      )}
    </Box>
  );
}
