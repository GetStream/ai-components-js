import type { Channel } from 'stream-chat';

const baseApiUrl = 'http://localhost:3000';

export const startAiAgent = async (
  channel: Channel,
  model: string,
  platform:
    | 'openai'
    | 'anthropic'
    | 'gemini'
    | 'xai'
    | (string & {}) = 'openai',
) =>
  fetch(`${baseApiUrl}/start-ai-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel_id: channel.id,
      channel_type: channel.type,
      platform,
      model,
    }),
  });

export const summarizeConversation = (text: string) =>
  fetch(`${baseApiUrl}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, platform: 'openai' }),
  })
    .then((res) => res.json())
    .then((json) => json.summary as string);
