import './chat-config.js';

const key = process.env.GEMINI_API_KEY;
if (!key) throw Error('Set GEMINI_API_KEY in server/.env.chat.local first');
const base = 'https://generativelanguage.googleapis.com/v1beta/models';
let pageToken = '';
do {
  const url = new URL(base);
  url.searchParams.set('pageSize', '100');
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  const response = await fetch(url, {
    headers: { 'x-goog-api-key': key },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw Error(`Model lookup: HTTP ${response.status}`);
  const data = await response.json();
  for (const model of data.models ?? []) {
    if (model.supportedGenerationMethods?.includes('generateContent')) {
      console.log(model.name.replace(/^models\//, ''));
    }
  }
  pageToken = data.nextPageToken ?? '';
} while (pageToken);
