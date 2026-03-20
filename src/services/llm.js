export async function callLLM({ messages, systemPrompt, endpoint, model, apiKey, format = 'openai', cache = true }) {
  // 1. Prepare System Message with Cache Control
  const systemContentBlock = { type: 'text', text: systemPrompt };
  if (cache) {
    systemContentBlock.cache_control = { type: 'ephemeral' };
  }
  
  // 2. Prepare Messages with Progressive Caching (Leapfrog)
  // We apply this to the user/assistant messages array
  const apiMessages = messages.map((msg, index) => {
    const isTip = index === messages.length - 1;
    const isAnchor = index === messages.length - 3;
    
    if (cache && (isTip || isAnchor)) {
      // Handle string content
      if (typeof msg.content === 'string') {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content, cache_control: { type: 'ephemeral' } }
          ]
        };
      } 
      // Handle array content (e.g. existing blocks)
      else if (Array.isArray(msg.content) && msg.content.length > 0) {
        // Clone to avoid mutation
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

  let payload;
  if (format === 'anthropic') {
    payload = {
      model: model,
      max_tokens: 16384,
      system: [systemContentBlock],
      messages: apiMessages
    };
  } else {
    const systemMessage = {
      role: 'system',
      content: [systemContentBlock]
    };
    payload = {
      model: model,
      max_tokens: 16384,
      messages: [systemMessage, ...apiMessages]
    };
  }

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (format === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = 'https://github.com/dynacontext/dynacontext';
        headers['X-Title'] = 'DynaContext';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Retry on server errors (5xx) or rate limits (429)
        if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
          await sleep(attempt * 1000);
          continue;
        }
        throw new Error(`LLM API Error (${response.status}): ${errorText}`);
      }

      // Read response as text first to handle empty/truncated responses
      const responseText = await response.text();

      if (!responseText || responseText.trim().length === 0) {
        if (attempt < maxRetries) {
          await sleep(attempt * 1000);
          continue;
        }
        throw new Error('LLM API returned an empty response after multiple retries.');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        if (attempt < maxRetries) {
          await sleep(attempt * 1000);
          continue;
        }
        throw new Error(`Failed to parse LLM API response as JSON: ${parseError.message}`);
      }

      let content;
      let usage;

      if (format === 'anthropic') {
        const textBlock = data.content?.find(block => block.type === 'text');
        content = textBlock?.text || '';
        usage = {
          model: model,
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          cachedTokens: data.usage?.cache_read_input_tokens || 0
        };
      } else {
        content = data.choices?.[0]?.message?.content || '';
        usage = {
          model: model,
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens || 0
        };
      }

      // Strip Internal Framing block
      content = String(content).replace(/<internal-framing>[\s\S]*?<\/internal-framing>\s*/gi, '').trim();

      return { content, usage };
    } catch (error) {
      lastError = error;
      // Network errors or other fetch failures - retry
      if (attempt < maxRetries) {
        await sleep(attempt * 1000);
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('LLM API call failed after maximum retries');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
