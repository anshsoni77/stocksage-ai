import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user, token, updateWatchlist } = useAuth();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const removeFromWatchlist = async (symbol) => {
    setRemoving(symbol);
    try {
      const res = await axios.delete(`${API_URL}/auth/watchlist/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateWatchlist(res.data.watchlist);
      toast.success(`${symbol} removed from watchlist`);
    } catch {
      toast.error('Failed to remove');
    }
    setRemoving('');
  };

  const stats = [
    { label: 'Watchlist', value: user.watchlist?.length || 0, icon: '⭐' },
    { label: 'Member Since', value: new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), icon: '📅' },
    { label: 'AI Analyses', value: 'Unlimited', icon: '🤖' },
    { label: 'Status', value: 'Active', icon: '✅' }
  ];

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div className="section-label">My Account</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
          Welcome back, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-secondary">Here's your personalized trading dashboard.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '40px' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-item">
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Watchlist */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '700' }}>
            ⭐ My Watchlist
          </h2>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>
            + Add Stocks
          </button>
        </div>

        {!user.watchlist || user.watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Watchlist is empty</h3>
            <p className="text-secondary" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
              Search for stocks and add them to track here
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              🔍 Discover Stocks
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {user.watchlist.map((item) => (
              <div
                key={item.symbol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div onClick={() => navigate(`/stock/${item.symbol}`)}>
                  <div style={{ fontWeight: '700', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                    {item.symbol}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {item.name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/stock/${item.symbol}`)}
                  >
                    View →
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red)' }}
                    onClick={() => removeFromWatchlist(item.symbol)}
                    disabled={removing === item.symbol}
                  >
                    {removing === item.symbol ? '...' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card mt-6">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '700', marginBottom: '20px' }}>
          ⚡ Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '🔍 Search Stocks', action: () => navigate('/') },
            { label: '📊 Analyze AAPL', action: () => navigate('/stock/AAPL') },
            { label: '📈 Analyze TSLA', action: () => navigate('/stock/TSLA') },
            { label: '🤖 Analyze NVDA', action: () => navigate('/stock/NVDA') }
          ].map((a, i) => (
            <button key={i} className="btn btn-ghost" onClick={a.action}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;