export function validMessages(messages) {
  if (!Array.isArray(messages) || messages.length < 1 ||
      messages.length > 5 || messages.length % 2 !== 1) {
    return false;
  }
  return messages.every((message, index) => {
    const role = index % 2 === 0 ? 'user' : 'model';
    const limit = role === 'user' ? 1000 : 4000;
    return message && message.role === role &&
      typeof message.text === 'string' &&
      message.text.trim().length > 0 &&
      message.text.length <= limit;
  });
}
