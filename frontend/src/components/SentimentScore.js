import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SentimentScore = ({ symbol }) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/stocks/sentiment/${symbol}`)
      .then(res => setSentiment(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) return (
    <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
      <div className="spinner" style={{ margin: '0 auto' }}></div>
    </div>
  );

  if (!sentiment) return null;

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (sentiment.score / 100) * circumference;

  return (
    <div className="card">
      <div className="ai-badge">🌡️ Market Sentiment Score</div>

      {/* Circular gauge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
          <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="55" cy="55" r="45" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
            <circle
              cx="55" cy="55" r="45" fill="none"
              stroke={sentiment.color}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.5s ease', filter: `drop-shadow(0 0 8px ${sentiment.color})` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: sentiment.color, fontFamily: 'var(--font-display)' }}>
              {sentiment.score}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>/ 100</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: sentiment.color, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
            {sentiment.label}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Based on price momentum, volume activity, and market conditions
          </p>
        </div>
      </div>

      {/* Signal bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sentiment.signals?.map((signal, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {signal.icon} {signal.name}
            </span>
            <span style={{
              fontSize: '0.8rem', fontWeight: '600',
              color: signal.value === 'Bullish' || signal.value === 'High' || signal.value === 'Positive'
                ? 'var(--green)' : signal.value === 'Bearish' || signal.value === 'Negative'
                ? 'var(--red)' : 'var(--yellow)'
            }}>
              {signal.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
        Updated: {new Date(sentiment.updatedAt).toLocaleTimeString('en-IN')}
      </div>
    </div>
  );
};

export default SentimentScore;