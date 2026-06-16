import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChatAdvisor = ({ context }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: '👋 Hi! I\'m StockSage AI. Ask me anything about stocks, markets, or the company you\'re viewing!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/stocks/ai-chat`, {
        message: userMsg,
        context
      });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I ran into an issue. Try again!' }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = ['Is this a good buy?', 'What are the risks?', 'Explain the P/E ratio'];

  return (
    <div className="card">
      <div className="ai-badge">💬 AI Chat Advisor</div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai">
              <span style={{ opacity: 0.6 }}>Thinking</span>
              <span className="text-accent"> ...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '0 16px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => { setInput(q); }}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Ask about this stock..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAdvisor;