import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StockChart from '../components/StockChart';
import AIAnalysis from '../components/AIAnalysis';
import ChatAdvisor from '../components/ChatAdvisor';
import SentimentScore from '../components/SentimentScore';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getCurrency = (symbol) => {
  if (!symbol) return '$';
  const s = symbol.toUpperCase();
  if (
    s.includes('.BSE') || s.includes('.NSE') ||
    s.includes('.BO') || s.includes('.NS') ||
    s.includes('RELIANCE') || s.includes('TCS') ||
    s.includes('INFY') || s.includes('WIPRO') ||
    s.includes('HDFC') || s.includes('ICICI') ||
    s.includes('BHARTIARTL') || s.includes('ITC') ||
    s.includes('NIFTY') || s.includes('SENSEX')
  ) return '₹';
  return '$';
};

const getDisplaySymbol = (symbol) => {
  if (!symbol) return '';
  return symbol
    .replace('.BSE', '')
    .replace('.NSE', '')
    .replace('.BO', '')
    .replace('.NS', '');
};

const formatPrice = (price, currency) => {
  if (typeof price !== 'number') return price;
  if (currency === '₹') {
    return price.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, token, updateWatchlist } = useAuth();

  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const currency = getCurrency(symbol);
  const displaySymbol = getDisplaySymbol(symbol);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [quoteRes, historyRes, overviewRes] = await Promise.allSettled([
          axios.get(`${API_URL}/stocks/quote/${symbol}`),
          axios.get(`${API_URL}/stocks/history/${symbol}`),
          axios.get(`${API_URL}/stocks/overview/${symbol}`)
        ]);

        if (quoteRes.status === 'fulfilled') setQuote(quoteRes.value.data);
        else setError('Could not fetch stock data. Alpha Vantage free tier: 25 requests/day.');

        if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data);
        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);

      } catch (err) {
        setError('Failed to load stock data.');
      }
      setLoading(false);
    };

    fetchAll();
    window.scrollTo(0, 0);
  }, [symbol]);

  useEffect(() => {
    if (user && symbol) {
      setInWatchlist(user.watchlist?.some(w => w.symbol === symbol));
    }
  }, [user, symbol]);

  const toggleWatchlist = async () => {
    if (!user) { navigate('/login'); return; }
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        const res = await axios.delete(`${API_URL}/auth/watchlist/${symbol}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        updateWatchlist(res.data.watchlist);
        setInWatchlist(false);
        toast.success(`${displaySymbol} removed from watchlist`);
      } else {
        const res = await axios.post(`${API_URL}/auth/watchlist`,
          { symbol, name: overview?.name || displaySymbol },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updateWatchlist(res.data.watchlist);
        setInWatchlist(true);
        toast.success(`${displaySymbol} added to watchlist ⭐`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update watchlist');
    }
    setWatchlistLoading(false);
  };

  const isPositive = quote && quote.change >= 0;

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner" style={{ paddingTop: '100px' }}>
          <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
          <p className="text-secondary">Loading {displaySymbol} data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>

      {/* Back Button */}
      <div style={{ padding: '20px 0 10px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* API Limit Warning */}
      {error && (
        <div className="error-msg" style={{ marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stock Header */}
      {quote && (
        <div className="detail-header">
          <div className="detail-title-row">
            <div>
              <h1 className="detail-symbol">{displaySymbol}</h1>
              <p className="detail-name">
                {overview?.name || 'Stock Quote'}
                {overview?.sector && ` • ${overview.sector}`}
                {currency === '₹' && (
                  <span className="tag" style={{ marginLeft: '10px', fontSize: '0.75rem' }}>
                    🇮🇳 NSE/BSE
                  </span>
                )}
              </p>
            </div>
            <button
              className={`btn ${inWatchlist ? 'btn-outline' : 'btn-primary'}`}
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
            >
              {watchlistLoading ? '...' : inWatchlist ? '⭐ In Watchlist' : '+ Add to Watchlist'}
            </button>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div className="price-display" style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                {currency}{formatPrice(quote.price, currency)}
              </div>
              <div className={`price-change ${isPositive ? 'text-green' : 'text-red'}`}>
                {isPositive ? '▲' : '▼'} {currency}{Math.abs(quote.change)?.toFixed(2)} ({quote.changePercent})
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '4px' }}>
              Last updated: {quote.latestTradingDay}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {quote && (
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Open</div>
            <div className="stat-value">{currency}{formatPrice(quote.open, currency)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">High</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>
              {currency}{formatPrice(quote.high, currency)}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Low</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>
              {currency}{formatPrice(quote.low, currency)}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Prev Close</div>
            <div className="stat-value">{currency}{formatPrice(quote.previousClose, currency)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Volume</div>
            <div className="stat-value">{quote.volume?.toLocaleString('en-IN')}</div>
          </div>
          {overview?.pe && (
            <div className="stat-item">
              <div className="stat-label">P/E Ratio</div>
              <div className="stat-value">{overview.pe}</div>
            </div>
          )}
          {overview?.week52High && (
            <div className="stat-item">
              <div className="stat-label">52W High</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>
                {currency}{formatPrice(parseFloat(overview.week52High), currency)}
              </div>
            </div>
          )}
          {overview?.week52Low && (
            <div className="stat-item">
              <div className="stat-label">52W Low</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>
                {currency}{formatPrice(parseFloat(overview.week52Low), currency)}
              </div>
            </div>
          )}
          {overview?.marketCap && (
            <div className="stat-item">
              <div className="stat-label">Market Cap</div>
              <div className="stat-value">
                {currency}{(parseInt(overview.marketCap) / 1e9).toFixed(1)}B
              </div>
            </div>
          )}
          {overview?.beta && (
            <div className="stat-item">
              <div className="stat-label">Beta</div>
              <div className="stat-value">{overview.beta}</div>
            </div>
          )}
          {overview?.eps && (
            <div className="stat-item">
              <div className="stat-label">EPS</div>
              <div className="stat-value">{currency}{overview.eps}</div>
            </div>
          )}
          {overview?.analystTarget && (
            <div className="stat-item">
              <div className="stat-label">Analyst Target</div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>
                {currency}{formatPrice(parseFloat(overview.analystTarget), currency)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="dashboard-grid" style={{ marginTop: '30px' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '700' }}>
                📊 Price History (6 Months)
              </h2>
              {history.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Weekly • {history.length} data points
                </div>
              )}
            </div>
            {history.length > 0 ? (
              <StockChart data={history} symbol={symbol} />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📉</div>
                <p style={{ fontSize: '0.9rem' }}>Chart data unavailable</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Alpha Vantage free tier: 25 requests/day</p>
              </div>
            )}
          </div>

          {/* Company Overview */}
          {overview?.description && (
            <div className="card">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
                🏢 About {overview.name || displaySymbol}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {overview.description}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                {overview.sector && <span className="tag">{overview.sector}</span>}
                {overview.industry && <span className="tag">{overview.industry}</span>}
                {overview.dividendYield && parseFloat(overview.dividendYield) > 0 && (
                  <span className="tag">
                    💰 Dividend: {(parseFloat(overview.dividendYield) * 100).toFixed(2)}%
                  </span>
                )}
                {currency === '₹' && <span className="tag">🇮🇳 Listed in India</span>}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SentimentScore symbol={symbol} />
          <AIAnalysis symbol={displaySymbol} quote={quote} overview={overview} currency={currency} />
          <ChatAdvisor
            context={`Stock: ${displaySymbol}, Price: ${currency}${quote?.price}, Change: ${quote?.changePercent}, Sector: ${overview?.sector || 'N/A'}, Market: ${currency === '₹' ? 'Indian (NSE/BSE)' : 'US'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default StockDetail;