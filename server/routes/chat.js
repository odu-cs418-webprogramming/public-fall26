import '../chat-config.js';
import { Router, json } from 'express';
import { generateReply } from '../chat-provider.js';
import { validMessages } from '../chat-validation.js';

const chat = Router();
chat.use(json({ limit: '32kb' }));

chat.post('/', async (req, res) => {
  const messages = req.body?.messages;
  if (!validMessages(messages)) {
    return res.status(400).json({ error: 'Invalid chat history.' });
  }
  const mode = process.env.DEMO_MODE ?? 'mock';
  const config = {
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL
  };
  if (!['mock', 'live'].includes(mode)) {
    return res.status(500).json({ error: 'Set DEMO_MODE to mock or live.' });
  }
  if (mode === 'live' && (!config.key ||
      !/^[a-zA-Z0-9._-]+$/.test(config.model ?? ''))) {
    return res.status(500).json({
      error: 'Set GEMINI_API_KEY and GEMINI_MODEL on the server.'
    });
  }
  try {
    const reply = mode === 'mock'
      ? `Mock reply: received ${messages.length} messages.`
      : await generateReply(messages, config);
    return res.json({ reply, mode });
  } catch (error) {
    const timedOut = error.name === 'TimeoutError';
    const status = timedOut ? 504 : error.status === 429 ? 429 : 502;
    const message = timedOut ? 'AI request timed out. Try again.'
      : status === 429 ? 'AI quota reached. Wait and retry.'
      : 'AI unavailable. Check the server configuration.';
    console.error('AI failure', error.status ?? error.name);
    return res.status(status).json({ error: message });
  }
});

// Keep malformed and oversized requests in the same JSON response format.
chat.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request is too large.' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request must contain valid JSON.' });
  }
  return next(error);
});

export default chat;
