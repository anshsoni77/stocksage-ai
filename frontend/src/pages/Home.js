import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StockCard from '../components/StockCard';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularStocks, setPopularStocks] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/stocks/popular`)
      .then(res => setPopularStocks(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); setShowResults(false); return; }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`${API_URL}/stocks/search?q=${searchQuery}`);
        setSearchResults(res.data);
        setShowResults(true);
      } catch {}
      setSearching(false);
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="container">
          <div className="hero-badge">🤖 AI-Powered • Real-Time Data • Indian & Global Markets</div>
          <h1 className="hero-title">
            Smart Stock Analysis<br />
            <span className="gradient-text">Powered by AI</span>
          </h1>
          <p className="hero-sub">
            Get instant AI-powered buy/sell recommendations for NSE, BSE & global stocks with real-time data.
          </p>
          <div className="hero-actions">
            {user ? (
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                📊 Go to Dashboard
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                  🚀 Get Started Free
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {/* Search */}
        <div className="search-container" ref={searchRef}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search stocks... (e.g. TCS, Reliance, INFY, AAPL)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {searching && (
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            </span>
          )}
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.symbol}
                  className="search-result-item"
                  onClick={() => { navigate(`/stock/${result.symbol}`); setShowResults(false); setSearchQuery(''); }}
                >
                  <span className="search-result-symbol">{result.symbol}</span>
                  <span className="search-result-name">{result.name}</span>
                  <span className="tag">{result.region}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Indian Stocks Section */}
        <div className="mb-6">
          <div className="section-label">🇮🇳 Indian Markets — NSE / BSE</div>
          <div className="section-title">Top Indian Stocks</div>
          <div className="stocks-grid">
            {popularStocks.filter(s => s.market === 'IN').map(stock => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>

        {/* Global Stocks Section */}
        <div className="mb-6">
          <div className="section-label">🌍 Global Markets</div>
          <div className="section-title">US Stocks</div>
          <div className="stocks-grid">
            {popularStocks.filter(s => s.market !== 'IN').map(stock => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="section-label">Why StockSage AI?</div>
            <h2 className="section-title">Everything You Need</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {[
              { icon: '🤖', title: 'AI Analysis', desc: 'Gemini AI analyzes fundamentals and gives clear BUY/SELL/HOLD recommendations' },
              { icon: '📊', title: 'Live Charts', desc: 'Beautiful 6-month price history charts with trend analysis' },
              { icon: '🇮🇳', title: 'Indian Markets', desc: 'Full support for NSE and BSE stocks including Nifty 50 companies' },
              { icon: '⭐', title: 'Watchlist', desc: 'Save your favourite stocks and track them from your dashboard' }
            ].map((f, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;