import { getDeviceId } from './device';
import { getByokKey } from './storage';

const WORKER_URL = 'https://sol-lite-proxy.banduabusiness.workers.dev/';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SendResult {
  content: string;
  messagesRemaining?: number;
  limitReached?: boolean;
}

export async function sendMessage(messages: Message[]): Promise<SendResult> {
  const byokKey = await getByokKey();

  if (byokKey) {
    return sendDirect(messages, byokKey);
  }

  return sendViaProxy(messages);
}

async function sendViaProxy(messages: Message[]): Promise<SendResult> {
  const deviceId = await getDeviceId();

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
    },
    body: JSON.stringify({ messages }),
  });

  if (response.status === 429) {
    const data = await response.json() as { message: string; limitReached: boolean };
    return { content: data.message, limitReached: true };
  }

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const remaining = response.headers.get('X-Messages-Remaining');

  return {
    content: data.choices[0].message.content,
    messagesRemaining: remaining ? parseInt(remaining) : undefined,
  };
}

async function sendDirect(messages: Message[], apiKey: string): Promise<SendResult> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid API key. Check your key in Settings.');
    throw new Error(`DeepSeek error: ${response.status}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return { content: data.choices[0].message.content };
}
