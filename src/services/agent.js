import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const captureTool = {
  name: 'capture',
  description: [
    'Execute shell commands and/or record content to files. Four modes based on parameter combination:',
    '',
    'Mode 1 (readonly): Execute command, return output. Nothing written to file.',
    '  Use: capture(command, readonly: true)',
    '  Returns: command output',
    '',
    'Mode 2 (writeonly + command): Execute command, record output and notes to file.',
    '  Use: capture(command, file, notes, writeonly: true)',
    '  Returns: write confirmation only — command output is recorded but not returned',
    '',
    'Mode 3 (writeonly, no command): Write notes to file. No command executed.',
    '  Use: capture(notes, file, writeonly: true)',
    '  Returns: write confirmation only',
    '',
    'Mode 4 (command + file, no flags): Execute command, record output to file, and return output.',
    '  Use: capture(command, file)',
    '  Returns: command output',
    '',
    'When neither readonly nor writeonly is set and a file is provided, Mode 4 applies.',
    'When neither readonly nor writeonly is set and no file is provided, the command executes and output is returned (equivalent to Mode 1).'
  ].join('\n'),
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute. Used in Modes 1, 2, and 4. Omit for Mode 3 (notes-only).'
      },
      file: {
        type: 'string',
        description: 'File path to append results to. Used in Modes 2, 3, and 4. Omit for Mode 1 (readonly).'
      },
      notes: {
        type: 'string',
        description: 'Annotation text recorded in the file alongside command output. Required for Mode 3 (notes-only). Recommended for Mode 2 (record). Notes appear in the file as a separated annotation; they are not included in the response returned to you.'
      },
      writeonly: {
        type: 'boolean',
        description: 'Enables Modes 2 and 3. When true, output is written to the file and the response contains only a write confirmation. Combine with command + file for Mode 2 (execute and record). Combine with notes + file for Mode 3 (notes-only).'
      },
      readonly: {
        type: 'boolean',
        description: 'Enables Mode 1. When true, the command executes and output is returned. Nothing is written to any file. The file and notes parameters are ignored.'
      }
    },
    required: []
  },
  cache_control: { type: 'ephemeral' }
};

export class AgentSession {
  constructor({ endpoint, model, apiKey, format = 'anthropic', cwd, stepFile, tools, warningThreshold = 30, commandTimeout = 30000, onToolCall, onTurnWarning }) {
    this.endpoint = endpoint;
    this.model = model;
    this.apiKey = apiKey;
    this.format = format;
    this.cwd = cwd || process.cwd();
    this.stepFile = stepFile || null;
    this.tools = tools || [];
    this.warningThreshold = warningThreshold;
    this.commandTimeout = commandTimeout;
    this.onToolCall = onToolCall;
    this.onTurnWarning = onTurnWarning;
    this.messages = [];
    this.usageLog = [];
    
    // Track active child processes to prevent zombies
    this.activeChildren = new Set();
    this._exitHandler = () => this._killAllChildren();
    process.on('exit', this._exitHandler);
    process.on('SIGINT', this._exitHandler);
  }

  _formatTools() {
    if (this.format === 'openai') {
      return this.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema
        }
      }));
    }

    return this.tools;
  }

  async chat(message) {
    this.messages.push({ role: 'user', content: message });

    let turn = 0;
    while (true) {
      const response = await this._callAPI();

      let toolCalls;
      if (this.format === 'openai') {
        const messageContent = response.choices?.[0]?.message || {};
        this.messages.push({
          role: 'assistant',
          content: messageContent.content || '',
          tool_calls: messageContent.tool_calls || undefined
        });

        toolCalls = messageContent.tool_calls || [];
        if (toolCalls.length === 0) {
          return messageContent.content || '';
        }
      } else {
        const contentBlocks = response.content || [];
        this.messages.push({ role: 'assistant', content: contentBlocks });

        toolCalls = contentBlocks.filter(block => block.type === 'tool_use');
        if (toolCalls.length === 0) {
          return contentBlocks.find(block => block.type === 'text')?.text || '';
        }
      }

      const toolResults = await Promise.all(toolCalls.map(async (toolCall) => {
        let toolName;
        let toolInput;
        let toolId;

        if (this.format === 'openai') {
          toolName = toolCall.function?.name;
          toolId = toolCall.id;
          try {
            toolInput = JSON.parse(toolCall.function?.arguments || '{}');
          } catch (err) {
            const parseError = `[ERROR: Failed to parse tool arguments for ${toolName || 'unknown'}: ${err.message}]`;
            return this._toolResponse(toolId, parseError);
          }
        } else {
          toolName = toolCall.name;
          toolInput = toolCall.input || {};
          toolId = toolCall.id;
        }

        if (toolName === 'capture') {
          return this._handleCapture(toolId, toolInput);
        }

        return this._toolResponse(toolId, `[ERROR: Unknown tool "${toolName}".]`);
      }));

      if (this.format === 'openai') {
        for (const result of toolResults) {
          this.messages.push(result);
        }
      } else {
        this.messages.push({ role: 'user', content: toolResults });
      }

      turn++;
      if (turn === this.warningThreshold && this.onTurnWarning) {
        this.onTurnWarning(turn);
      }
    }
  }

  async _callAPI() {
    const maxRetries = 3;
    let lastError;

    let apiMessages;
    if (this.format === 'anthropic') {
      // Anthropic path keeps cache-control blocks in message content.
      apiMessages = this.messages.map((msg, index) => {
        const isTip = index === this.messages.length - 1;
        const isAnchor = index === this.messages.length - 3;

        if (isTip || isAnchor) {
          if (typeof msg.content === 'string') {
            return {
              role: msg.role,
              content: [
                { type: 'text', text: msg.content, cache_control: { type: 'ephemeral' } }
              ]
            };
          }

          if (Array.isArray(msg.content) && msg.content.length > 0) {
            const newContent = [...msg.content];
            const lastBlock = { ...newContent[newContent.length - 1] };
            lastBlock.cache_control = { type: 'ephemeral' };
            newContent[newContent.length - 1] = lastBlock;

            return {
              role: msg.role,
              content: newContent
            };
          }
        }

        return msg;
      });
    } else {
      // OpenAI path forwards messages in native OpenAI chat structure.
      apiMessages = this.messages;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = this.endpoint;

        const headers = { 'Content-Type': 'application/json' };
        if (this.format === 'openai') {
          headers.Authorization = `Bearer ${this.apiKey}`;
        } else {
          headers['x-api-key'] = this.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        }

        const body = {
          model: this.model,
          max_tokens: 4096,
          messages: apiMessages,
          tools: this._formatTools()
        };

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorText = await response.text();
          if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
            const delayMs = attempt * 1000;
            await this._sleep(delayMs);
            continue;
          }
          throw new Error(`Agent API Error (${response.status}): ${errorText}`);
        }

        const responseText = await response.text();

        if (!responseText || responseText.trim().length === 0) {
          if (attempt < maxRetries) {
            const delayMs = attempt * 1000;
            await this._sleep(delayMs);
            continue;
          }
          throw new Error('Agent API returned an empty response after multiple retries.');
        }

        try {
          const parsed = JSON.parse(responseText);

          let usage;
          if (this.format === 'openai') {
            usage = {
              model: this.model,
              inputTokens: parsed.usage?.prompt_tokens || 0,
              outputTokens: parsed.usage?.completion_tokens || 0,
              cachedTokens: parsed.usage?.prompt_tokens_details?.cached_tokens || 0
            };
          } else {
            usage = {
              model: this.model,
              inputTokens: parsed.usage?.input_tokens || 0,
              outputTokens: parsed.usage?.output_tokens || 0,
              cachedTokens: parsed.usage?.cache_read_input_tokens || 0
            };
          }

          this.usageLog.push(usage);
          return parsed;
        } catch (parseError) {
          if (attempt < maxRetries) {
            const delayMs = attempt * 1000;
            await this._sleep(delayMs);
            continue;
          }

          const truncatedResponse = responseText.length > 500
            ? responseText.substring(0, 500) + '...'
            : responseText;

          throw new Error(
            `Failed to parse API response as JSON after ${maxRetries} attempts. ` +
            `Error: ${parseError.message}. ` +
            `Response preview: ${truncatedResponse}`
          );
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delayMs = attempt * 1000;
          await this._sleep(delayMs);
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error('API call failed after maximum retries');
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _toolResponse(toolId, content) {
    if (this.format === 'openai') {
      return { role: 'tool', tool_call_id: toolId, content };
    }
    return { type: 'tool_result', tool_use_id: toolId, content };
  }

  _isDirectStepFileWrite(command) {
    if (!this.stepFile) return false;
    return command.includes(this.stepFile) && /(>>|>|<<|tee\s)/.test(command);
  }

  _rcmPruneMessages(keepRecentPairs = 3) {
    const preserveFromEnd = keepRecentPairs * 2;
    const pruneEnd = this.messages.length - preserveFromEnd;

    if (pruneEnd <= 1) return;

    for (let i = 1; i < pruneEnd; i++) {
      const msg = this.messages[i];

      if (this.format === 'openai') {
        if (msg.role === 'tool' && typeof msg.content === 'string') {
          const lineCount = (msg.content.match(/\n/g) || []).length + 1;
          if (lineCount > 5) {
            msg.content = `[RCM: Archived - ${lineCount} lines. Current captures available in step file.]`;
          }
        }

        if (msg.role === 'assistant' && typeof msg.content === 'string' && msg.content.length > 200) {
          msg.content = '[RCM: Reasoning archived.]';
        }
      } else {
        if (msg.role === 'user' && Array.isArray(msg.content)) {
          msg.content = msg.content.map(block => {
            if (block.type === 'tool_result' && typeof block.content === 'string') {
              const lineCount = (block.content.match(/\n/g) || []).length + 1;
              if (lineCount > 5) {
                return {
                  ...block,
                  content: `[RCM: Archived - ${lineCount} lines. Current captures available in step file.]`
                };
              }
            }
            return block;
          });
        }

        if (msg.role === 'assistant' && Array.isArray(msg.content)) {
          msg.content = msg.content.map(block => {
            if (block.type === 'text' && block.text && block.text.length > 200) {
              return { ...block, text: '[RCM: Reasoning archived.]' };
            }
            return block;
          });
        }
      }
    }
  }

  _rcmBuildContextRefresh() {
    const filePath = path.join(this.cwd, this.stepFile);

    if (!fs.existsSync(filePath)) {
      return '[Write successful. Step file not yet readable.]';
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lineCount = (content.match(/\n/g) || []).length + 1;

    return [
      `[RCM: Write successful - ${lineCount} lines in ${this.stepFile}]`,
      '',
      'Previous command outputs have been archived. Your current captures:',
      '',
      '---',
      content,
      '---',
      '',
      'Continue retrieval from where you left off.'
    ].join('\n');
  }

  async _handleCapture(toolId, toolInput) {
    const { command, file, notes, writeonly, readonly } = toolInput || {};

    if (writeonly && readonly) {
      return this._toolResponse(toolId, '[ERROR: writeonly and readonly cannot both be true.]');
    }

    if (writeonly) {
      if (command) {
        if (!file) {
          return this._toolResponse(toolId, '[ERROR: writeonly+command mode requires "file".]');
        }

        if (this._isDirectStepFileWrite(command)) {
          return this._toolResponse(toolId, '[ERROR: Direct file writes via command not allowed. Use capture file modes instead.]');
        }

        if (this.onToolCall) this.onToolCall(command, 'running');

        const result = await this._executeCommand(command);

        if (this.onToolCall) {
          if (result.includes('[ERROR]') || result.includes('[TIMEOUT')) {
            this.onToolCall(command, 'error');
          } else {
            this.onToolCall(command, 'done');
          }
        }

        const filePath = path.join(this.cwd, file);
        const entry = notes
          ? `:::command+note\nsource: ${command}\n---\n${result}\n---\n${notes}\n:::\n\n`
          : `:::command\nsource: ${command}\n---\n${result}\n:::\n\n`;

        try {
          fs.appendFileSync(filePath, entry);
        } catch (err) {
          return this._toolResponse(toolId, `[WARNING: Failed to append to ${file}: ${err.message}]`);
        }

        if (this.messages.length > 20) {
          this._rcmPruneMessages();
        }

        return this._toolResponse(toolId, `[Write successful to ${file}]`);
      }

      if (!notes || !file) {
        return this._toolResponse(toolId, '[ERROR: writeonly mode requires both "notes" and "file".]');
      }

      const writeLabel = `[note -> ${file}]`;
      if (this.onToolCall) this.onToolCall(writeLabel, 'running');

      const entry = `:::note\n---\n${notes}\n:::\n\n`;
      const filePath = path.join(this.cwd, file);

      try {
        fs.appendFileSync(filePath, entry);
      } catch (err) {
        if (this.onToolCall) this.onToolCall(writeLabel, 'error');
        return this._toolResponse(toolId, `[ERROR: Failed to write to ${file}: ${err.message}]`);
      }

      if (this.onToolCall) this.onToolCall(writeLabel, 'done');

      if (this.messages.length > 20) {
        this._rcmPruneMessages();
      }

      return this._toolResponse(toolId, `[Write successful to ${file}]`);
    }

    if (readonly) {
      if (!command) {
        return this._toolResponse(toolId, '[ERROR: readonly mode requires "command".]');
      }

      if (this.onToolCall) this.onToolCall(command, 'running');

      const result = await this._executeCommand(command);

      if (this.onToolCall) {
        if (result.includes('[ERROR]') || result.includes('[TIMEOUT')) {
          this.onToolCall(command, 'error');
        } else {
          this.onToolCall(command, 'done');
        }
      }

      return this._toolResponse(toolId, result);
    }

    if (!command || !file) {
      return this._toolResponse(toolId, '[ERROR: capture requires "command" and "file" (or use writeonly/readonly mode).]');
    }

    if (this._isDirectStepFileWrite(command)) {
      return this._toolResponse(toolId, '[ERROR: Direct file writes via command not allowed. Use writeonly mode to write notes to the step file.]');
    }

    if (this.onToolCall) this.onToolCall(command, 'running');

    const result = await this._executeCommand(command);

    if (this.onToolCall) {
      if (result.includes('[ERROR]') || result.includes('[TIMEOUT')) {
        this.onToolCall(command, 'error');
      } else {
        this.onToolCall(command, 'done');
      }
    }

    const filePath = path.join(this.cwd, file);
    const entry = notes
      ? `:::command+note\nsource: ${command}\n---\n${result}\n---\n${notes}\n:::\n\n`
      : `:::command\nsource: ${command}\n---\n${result}\n:::\n\n`;

    try {
      fs.appendFileSync(filePath, entry);
    } catch (err) {
      return this._toolResponse(toolId, `${result}\n\n[WARNING: Failed to append to ${file}: ${err.message}]`);
    }

    if (this.messages.length > 20) {
      this._rcmPruneMessages();
    }

    return this._toolResponse(toolId, result);
  }

  _executeCommand(command) {
    return new Promise((resolve) => {
      const child = spawn(command, { shell: true, cwd: this.cwd });
      this.activeChildren.add(child);

      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        child.kill();
        resolve(`[TIMEOUT after ${this.commandTimeout}ms]`);
      }, this.commandTimeout);

      child.stdout.on('data', (data) => {
        stdout += data;
      });
      child.stderr.on('data', (data) => {
        stderr += data;
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        this.activeChildren.delete(child);

        let output = (stdout + stderr).replace(/[^\x20-\x7E\x09\x0A\x0D]/g, '').trim();

        if (code !== 0) {
          resolve(`[ERROR - Exit Code ${code}]\n${output}`);
        } else {
          resolve(output || '[Success - No Output]');
        }
      });
    });
  }

  _killAllChildren() {
    for (const child of this.activeChildren) {
      try {
        child.kill('SIGKILL');
      } catch (e) {}
    }
    this.activeChildren.clear();
  }

  async end() {
    this._killAllChildren();
    if (this._exitHandler) {
      process.removeListener('exit', this._exitHandler);
      process.removeListener('SIGINT', this._exitHandler);
    }
  }
}

export { captureTool };
