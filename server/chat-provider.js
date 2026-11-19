const base = 'https://generativelanguage.googleapis.com/v1beta';
const instruction = [
  'You help students study React, Express, and MySQL.',
  'Use plain text and keep answers under 150 words.',
  'Explain the reason behind code. Ask if context is missing.',
  'Do not invent course deadlines, grades, or policies.'
].join(' ');

export async function generateReply(messages, config) {
  const contents = messages.map(({ role, text }) => ({
    role, parts: [{ text }]
  }));
  const response = await fetch(`${base}/models/${config.model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.key
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents,
      generationConfig: { maxOutputTokens: 2048 }
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) {
    const error = new Error('Provider request failed');
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  console.log('Complete Gemini API response:', JSON.stringify(data, null, 2));
  const candidate = data.candidates?.[0];
  const reply = (candidate?.content?.parts ?? [])
    .filter(part => typeof part.text === 'string' && !part.thought)
    .map(part => part.text).join('').trim();
  if (candidate?.finishReason !== 'STOP' || !reply || reply.length > 4000) {
    throw new Error('No complete displayable reply');
  }
  return reply;
}
