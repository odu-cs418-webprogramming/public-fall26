import express from 'express';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { generateReply } from './chat-provider.js';
import chat from './routes/chat.js';

test('chat accepts bounded history and rejects invalid requests', async t => {
  const originalMode = process.env.DEMO_MODE;
  process.env.DEMO_MODE = 'mock';
  const app = express();
  app.use('/api/chat', chat);
  app.use(express.json());
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    if (originalMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalMode;
    await new Promise(resolve => server.close(resolve));
  });
  const endpoint = `http://127.0.0.1:${server.address().port}/api/chat`;
  const post = body => fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

  for (const count of [1, 3, 5]) {
    await t.test(`${count} messages return a mock reply`, async () => {
      const messages = Array.from({ length: count }, (_, index) => ({
        role: index % 2 ? 'model' : 'user', text: 'Explain React state.'
      }));
      const response = await post({ messages });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        reply: `Mock reply: received ${count} messages.`, mode: 'mock'
      });
    });
  }
  await t.test('invalid roles, empty input, and excessive history return 400', async () => {
    for (const messages of [null, [], [{ role: 'model', text: 'Hello' }],
      [{ role: 'user', text: ' ' }], [{ role: 'user', text: 'x'.repeat(1001) }],
      Array.from({ length: 7 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: 'Hi' }))]) {
      const response = await post({ messages });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error, 'Invalid chat history.');
    }
  });
  await t.test('malformed JSON returns a JSON error', async () => {
    const response = await post('{');
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /valid JSON/);
  });
  await t.test('oversized JSON returns 413', async () => {
    const response = await post({ messages: 'x'.repeat(34000) });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error, 'Request is too large.');
  });
});

test('provider uses server instructions and rejects incomplete replies', async t => {
  let providerResponse;
  let sentRequest;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    sentRequest = { url, ...options };
    return new Response(JSON.stringify(providerResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
  });
  const messages = [{ role: 'user', text: 'Explain React state.' }];
  const config = { key: 'test-only-key', model: 'test-model' };
  providerResponse = {
    candidates: [{
      finishReason: 'STOP', content: {
        parts: [
          { text: 'Private reasoning', thought: true }, { text: 'State triggers a render.' }
        ]
      }
    }]
  };
  assert.equal(await generateReply(messages, config), 'State triggers a render.');
  assert.equal(sentRequest.headers['x-goog-api-key'], 'test-only-key');
  const body = JSON.parse(sentRequest.body);
  assert.ok(body.systemInstruction.parts[0].text.includes('React'));
  assert.deepEqual(body.contents, [{ role: 'user', parts: [{ text: messages[0].text }] }]);

  for (const invalidResponse of [
    {}, { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Cut off' }] } }] },
    { candidates: [{ finishReason: 'STOP', content: { parts: [] } }] }
  ]) {
    providerResponse = invalidResponse;
    await assert.rejects(generateReply(messages, config), /No complete displayable reply/);
  }
});
