import { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import Divider from './shared/Divider.jsx';
import SelectInput from './shared/SelectInput.jsx';
import theme from '../theme.js';
import { saveConfig, loadConfig } from '../../services/config.js';

const SECTIONS = [
  {
    key: 'intake',
    label: 'Intake Provider',
    description: 'Model used for task intake and clarification.',
    fields: [
      { key: 'endpoint', label: 'Endpoint', type: 'string' },
      { key: 'model', label: 'Model', type: 'string' },
      { key: 'apiKey', label: 'API Key', type: 'string' },
      { key: 'format', label: 'Format', type: 'choice', options: ['openai', 'anthropic'] }
    ]
  },
  {
    key: 'assembly',
    label: 'Assembly Provider',
    description: 'Model used for context assembly.',
    fields: [
      { key: 'endpoint', label: 'Endpoint', type: 'string' },
      { key: 'model', label: 'Model', type: 'string' },
      { key: 'apiKey', label: 'API Key', type: 'string' },
      { key: 'format', label: 'Format', type: 'choice', options: ['openai', 'anthropic'] }
    ]
  },
  {
    key: 'agent',
    label: 'Agent Provider',
    description: 'Model used for retrieval agent (tool-calling).',
    fields: [
      { key: 'endpoint', label: 'Endpoint', type: 'string' },
      { key: 'model', label: 'Model', type: 'string' },
      { key: 'apiKey', label: 'API Key', type: 'string' },
      { key: 'format', label: 'Format', type: 'choice', options: ['openai', 'anthropic'] }
    ]
  },
  {
    key: 'output',
    label: 'Output',
    description: 'Output file naming and location.',
    fields: [
      { key: 'filenamePrefix', label: 'Filename Prefix', type: 'string' },
      { key: 'dir', label: 'Output Directory', type: 'string' }
    ]
  },
  {
    key: 'stepFiles',
    label: 'Step Files',
    description: 'Retrieval step file behavior.',
    fields: [
      { key: 'cleanup', label: 'Cleanup After Assembly', type: 'boolean', labels: ['Yes', 'No'] },
      { key: 'reviewBeforeAssembly', label: 'Review Before Assembly', type: 'boolean', labels: ['Yes', 'No'] }
    ]
  }
];

export default function SettingsView({ config, onComplete, onValidateConfig }) {
  const [viewMode, setViewMode] = useState('sections'); // 'sections' | 'fields' | 'editing'
  const [selectedSection, setSelectedSection] = useState(0);
  const [selectedField, setSelectedField] = useState(0);
  const [editBuffer, setEditBuffer] = useState('');
  const [localConfig, setLocalConfig] = useState(() => JSON.parse(JSON.stringify(config)));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useInput((input, key) => {
    const char = input?.toUpperCase();
    setError(null);

    if (viewMode === 'sections') {
      if (key.upArrow) {
        setSelectedSection(Math.max(0, selectedSection - 1));
      } else if (key.downArrow) {
        setSelectedSection(Math.min(SECTIONS.length - 1, selectedSection + 1));
      } else if (key.return) {
        setSelectedField(0);
        setViewMode('fields');
      } else if (char === 'S') {
        handleSave();
      } else if (key.escape || char === 'Q') {
        onComplete(null);
      }
      return;
    }

    if (viewMode === 'fields') {
      const fields = SECTIONS[selectedSection].fields;
      if (key.upArrow) {
        setSelectedField(Math.max(0, selectedField - 1));
      } else if (key.downArrow) {
        setSelectedField(Math.min(fields.length - 1, selectedField + 1));
      } else if (key.return) {
        const field = fields[selectedField];
        setEditBuffer(getCurrentValue(selectedSection, selectedField));
        setViewMode('editing');
      } else if (key.escape || char === 'Q') {
        setViewMode('sections');
      }
      return;
    }

    if (viewMode === 'editing') {
      const section = SECTIONS[selectedSection];
      const field = section.fields[selectedField];

      // For choice and boolean fields, SelectInput handles all input
      if (field.type === 'choice' || field.type === 'boolean') {
        // SelectInput handles all input via onSelect/onCancel props
        // No parent-level input handling needed
        return;
      }

      // String field editing
      if (key.return) {
        applyFieldValue(selectedSection, selectedField, editBuffer);
        setViewMode('fields');
      } else if (key.escape) {
        setViewMode('fields');
      } else if (key.backspace || key.delete) {
        setEditBuffer(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setEditBuffer(prev => prev + input);
      }
    }
  });

  const getCurrentValue = (sectionIdx, fieldIdx) => {
    const section = SECTIONS[sectionIdx];
    const field = section.fields[fieldIdx];
    return localConfig[section.key]?.[field.key] ?? '';
  };

  const applyFieldValue = (sectionIdx, fieldIdx, value) => {
    const section = SECTIONS[sectionIdx];
    const field = section.fields[fieldIdx];

    setLocalConfig(prev => ({
      ...prev,
      [section.key]: {
        ...prev[section.key],
        [field.key]: value
      }
    }));
  };

  const handleSave = () => {
    try {
      saveConfig(localConfig);
      const mergedConfig = loadConfig();
      const errors = onValidateConfig(mergedConfig);
      if (errors.length > 0) {
        setError(errors.join('\n'));
        return;
      }
      setSaved(true);
      setTimeout(() => onComplete(mergedConfig), 800);
    } catch (err) {
      setError(err.message);
    }
  };

  const getDisplayValue = (sectionKey, fieldKey, type) => {
    const value = localConfig[sectionKey]?.[fieldKey];
    if (value === undefined || value === null) return '';
    if (type === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Render section list
  if (viewMode === 'sections') {
    return (
      <Box flexDirection="column">
        <Divider />
        <Box marginLeft={2}>
          <Text bold>   SETTINGS</Text>
        </Box>
        <Divider />
        <Box flexDirection="column" marginTop={1} marginBottom={1}>
          {SECTIONS.map((section, idx) => {
            const isSelected = idx === selectedSection;
            const prefix = isSelected ? '❯' : ' ';
            return (
              <Box key={section.key} marginLeft={2}>
                <Text color={isSelected ? theme.ui.accent : theme.ui.muted}>{prefix}</Text>
                <Text>{` ${section.label}`}</Text>
              </Box>
            );
          })}
        </Box>
        <Divider />
        <Box marginLeft={2} marginTop={1}>
          <Text dimColor>[↑↓] Navigate   [Enter] Edit section   [S] Save   [Q] Back</Text>
        </Box>
        {saved && (
          <Box marginLeft={2} marginTop={1}>
            <Text color={theme.status.success}>Saved!</Text>
          </Box>
        )}
        {error && (
          <Box marginLeft={2} marginTop={1}>
            <Text color={theme.status.error}>{`Error: ${error}`}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // Render field list
  if (viewMode === 'fields') {
    const section = SECTIONS[selectedSection];
    return (
      <Box flexDirection="column">
        <Divider />
        <Box marginLeft={2} marginTop={1}>
          <Text color={theme.status.info}>SYS</Text>
          <Text bold>{`   SETTINGS: ${section.label.toUpperCase()}`}</Text>
        </Box>
        <Divider />
        <Box marginLeft={2}>
          <Text dimColor>{section.description}</Text>
        </Box>
        <Box flexDirection="column" marginTop={1}>
          {section.fields.map((field, idx) => {
            const isSelected = idx === selectedField;
            const prefix = isSelected ? '❯' : ' ';
            const displayValue = getDisplayValue(section.key, field.key, field.type);
            // No truncation - show full values
            return (
              <Box key={field.key} marginLeft={2}>
                <Text color={isSelected ? theme.ui.accent : theme.ui.muted}>{prefix}</Text>
                <Text>{` ${field.label.padEnd(20)} ${displayValue}`}</Text>
              </Box>
            );
          })}
        </Box>
        <Divider />
        <Box marginLeft={2} marginTop={1}>
          <Text dimColor>[↑↓] Navigate   [Enter] Edit   [Q] Back to sections</Text>
        </Box>
        {error && (
          <Box marginLeft={2} marginTop={1}>
            <Text color={theme.status.error}>{`Error: ${error}`}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // Render editing mode
  const section = SECTIONS[selectedSection];
  const field = section.fields[selectedField];
  const currentValue = getCurrentValue(selectedSection, selectedField);

  // Determine hint bar text based on field type
  const getHintBar = () => {
    if (field.type === 'string') {
      return '[Enter] Save   [Esc/Q] Cancel';
    }
    return '[↑↓] Navigate   [Enter/Space] Select   [Esc] Cancel';
  };

  return (
    <Box flexDirection="column">
      <Divider />
      <Box marginLeft={2} marginTop={1}>
        <Text color={theme.status.info}>SYS</Text>
        <Text bold>{`   EDIT: ${field.label.toUpperCase()}`}</Text>
      </Box>
      <Divider />
      <Box marginLeft={2} marginTop={1}>
        <Text color={theme.status.info}>SECTION</Text>
        <Text>{`  ${section.label}`}</Text>
      </Box>
      <Box marginLeft={2} marginTop={1}>
        <Text color={theme.status.info}>CURRENT</Text>
        <Text>{`  ${currentValue}`}</Text>
      </Box>
      {/* Choice field editing with SelectInput */}
      {field.type === 'choice' && (
        <Box marginLeft={2} marginTop={1}>
          <SelectInput
            options={field.options.map(opt => ({ label: opt.charAt(0).toUpperCase() + opt.slice(1), value: opt }))}
            defaultValue={currentValue}
            onSelect={(value) => {
              applyFieldValue(selectedSection, selectedField, value);
              setViewMode('fields');
            }}
            onCancel={() => setViewMode('fields')}
          />
        </Box>
      )}
      {/* Boolean field editing with SelectInput */}
      {field.type === 'boolean' && (
        <Box marginLeft={2} marginTop={1}>
          <SelectInput
            options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]}
            defaultValue={currentValue}
            onSelect={(value) => {
              applyFieldValue(selectedSection, selectedField, value);
              setViewMode('fields');
            }}
            onCancel={() => setViewMode('fields')}
          />
        </Box>
      )}
      {/* String field editing with cursor */}
      {field.type === 'string' && (
        <Box flexDirection="column" marginTop={1}>
          <Box marginLeft={2}>
            <Text color={theme.status.info}>NEW VALUE</Text>
          </Box>
          <Box marginLeft={2}>
            <Text bold>{`> ${editBuffer}█`}</Text>
          </Box>
        </Box>
      )}
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
