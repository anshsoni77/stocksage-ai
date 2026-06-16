import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AIAnalysis = ({ symbol, quote, overview }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAnalysis = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/stocks/ai-analysis`, { symbol, quote, overview });
      setAnalysis(res.data);
    } catch (err) {
      console.error('AI analysis failed:', err);
    }
    setLoading(false);
  };

  const recClass = analysis?.recommendation === 'BUY' ? 'rec-buy'
    : analysis?.recommendation === 'SELL' ? 'rec-sell' : 'rec-hold';

  const recIcon = analysis?.recommendation === 'BUY' ? '🚀'
    : analysis?.recommendation === 'SELL' ? '⚠️' : '⏸️';

  return (
    <div className="card card-glow">
      <div className="ai-badge">🤖 StockSage AI Analysis</div>

      {!analysis && !loading && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p className="text-secondary" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
            Get an AI-powered analysis with buy/sell recommendation for <strong>{symbol}</strong>
          </p>
          <button className="btn btn-primary" onClick={getAnalysis}>
            🧠 Analyze {symbol} with AI
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>AI is analyzing {symbol}...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="animate-fade-in">
          <div className={`recommendation-badge ${recClass}`}>
            {recIcon} {analysis.recommendation}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div className="flex justify-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI Confidence</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)' }}>
                {analysis.confidence}%
              </span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${analysis.confidence}%` }}></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {analysis.targetPrice && (
              <div className="tag">🎯 Target: ${analysis.targetPrice}</div>
            )}
            <div className="tag">⚡ Risk: {analysis.riskLevel}</div>
            <div className="tag">⏱️ {analysis.timeHorizon}</div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
            {analysis.summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: '700', marginBottom: '10px' }}>
                ✅ BULLISH FACTORS
              </p>
              <ul className="points-list">
                {analysis.bullishPoints?.map((point, i) => (
                  <li key={i} className="point-item">
                    <span className="point-icon text-green">+</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: '700', marginBottom: '10px' }}>
                ⚠️ BEARISH FACTORS
              </p>
              <ul className="points-list">
                {analysis.bearishPoints?.map((point, i) => (
                  <li key={i} className="point-item">
                    <span className="point-icon text-red">-</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
            onClick={() => { setAnalysis(null); getAnalysis(); }}
          >
            🔄 Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;