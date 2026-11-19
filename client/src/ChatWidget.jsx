import { useEffect, useRef, useState } from 'react';
import './ChatWidget.css';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('');
  const launcher = useRef(null);
  const question = useRef(null);
  const conversation = useRef(null);
  const activeRequest = useRef(null);

  useEffect(() => {
    if (open && !busy) question.current?.focus();
  }, [open, busy]);

  useEffect(() => {
    if (open && conversation.current) {
      conversation.current.scrollTop = conversation.current.scrollHeight;
    }
  }, [open, messages, busy, error]);

  useEffect(() => () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
  }, []);

  function closeChat() {
    setOpen(false);
    launcher.current?.focus();
  }

  function newChat() {
    if (activeRequest.current) return;
    setMessages([]);
    setInput('');
    setError('');
    question.current?.focus();
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || text.length > 1000 || activeRequest.current) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setError('');
    // Send two completed exchanges plus this question, not the entire log.
    const context = [...messages.slice(-4), { role: 'user', text }];
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: context }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)])
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Chat is unavailable. Check that the server is running.');
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Your message could not be sent.');
      if (typeof data.reply !== 'string' || !data.reply.trim() ||
          data.reply.length > 4000 || !['mock', 'live'].includes(data.mode)) {
        throw new Error('The server returned an unexpected reply. Please try again.');
      }
      if (controller.signal.aborted) return;
      setMessages(previous => [...previous,
        { role: 'user', text }, { role: 'model', text: data.reply }]);
      setMode(data.mode);
      setInput('');
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failure.name === 'TimeoutError'
        ? 'The reply took too long. Please try again.'
        : failure instanceof TypeError
          ? 'Could not reach chat. Check your connection and try again.'
          : failure.message);
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <aside className="cs418-chat" aria-label="Study chat"
      onKeyDown={event => {
        if (open && event.key === 'Escape') {
          event.stopPropagation();
          closeChat();
        }
      }}>
      {open && (
        <section id="study-chat-panel" className="cs418-chat__panel"
          aria-labelledby="study-chat-title">
          <header className="cs418-chat__header">
            <div>
              <h2 id="study-chat-title">CS418 study chat</h2>
              <p>Questions about React, Express, or MySQL</p>
            </div>
            <button type="button" className="cs418-chat__close"
              aria-label="Close chat" onClick={closeChat}>&times;</button>
          </header>

          <div className="cs418-chat__toolbar">
            <span>{mode === 'mock' ? 'Demo mode · sample replies'
              : mode === 'live' ? 'AI replies · check important details'
                : 'Ask a programming question'}</span>
            <button type="button" onClick={newChat} disabled={busy}>New chat</button>
          </div>

          <div className="cs418-chat__conversation" ref={conversation}>
            {messages.length === 0 && !busy && (
              <div className="cs418-chat__welcome">
                <p>What are you working on?</p>
                <p>Try: “Explain React state in two sentences.”</p>
              </div>
            )}
            <div role="log" aria-label="Conversation" aria-live="polite"
              aria-relevant="additions">
              {messages.map((message, index) => (
                <div key={index}
                  className={`cs418-chat__message cs418-chat__message--${message.role}`}>
                  <strong>{message.role === 'user' ? 'You' : 'Study assistant'}</strong>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
            {busy && <p className="cs418-chat__waiting" role="status">Waiting for a reply…</p>}
            {error && <p className="cs418-chat__error" role="alert">{error}</p>}
          </div>

          <form className="cs418-chat__form" onSubmit={sendMessage}>
            <label htmlFor="study-chat-question">Your question</label>
            <textarea id="study-chat-question" ref={question} rows={3}
              maxLength={1000} value={input} readOnly={busy}
              placeholder="Type your question…"
              aria-describedby="study-chat-input-help"
              onChange={event => setInput(event.target.value)} />
            <div className="cs418-chat__actions">
              <span id="study-chat-input-help">{input.length}/1,000 characters</span>
              <button type="submit" disabled={busy || !input.trim()}>
                {busy ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </section>
      )}
      <button type="button" className="cs418-chat__launcher" ref={launcher}
        aria-expanded={open} aria-controls={open ? 'study-chat-panel' : undefined}
        onClick={() => open ? closeChat() : setOpen(true)}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
          stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" />
          <path d="M7 10h10M7 14h6" />
        </svg>
        {open ? 'Close chat' : 'Chat with us'}
      </button>
    </aside>
  );
}
