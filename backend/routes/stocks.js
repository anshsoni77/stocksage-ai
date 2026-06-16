const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');

const router = express.Router();

console.log('========================');
console.log('GROQ KEY EXISTS:', !!process.env.GROQ_API_KEY);
console.log('GROQ KEY PREFIX:', process.env.GROQ_API_KEY?.substring(0, 8));
console.log('========================');

let groq;

try {
  const key = process.env.GROQ_API_KEY?.trim();

  if (!key) {
    console.log('❌ GROQ_API_KEY not found in .env');
  } else {
    groq = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.groq.com/openai/v1'
    });

    console.log('✅ Groq AI initialized');
    console.log('🔥 THIS IS THE GROQ FILE');
  }
} catch (err) {
  console.error('❌ Groq init error:', err.message);
}

const AV_KEY = process.env.ALPHA_VANTAGE_KEY;
const AV_BASE = 'https://www.alphavantage.co/query';

// Cache
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
  return null;
};
const setCache = (key, data) => cache.set(key, { data, timestamp: Date.now() });

// =====================
// Mock data fallback
// =====================
const MOCK_QUOTES = {
  'TCS.BSE':        { symbol: 'TCS.BSE', price: 3456.75, open: 3420.00, high: 3478.90, low: 3398.50, volume: 1245678, previousClose: 3411.55, change: 45.20, changePercent: '1.3250%', latestTradingDay: '2026-06-14' },
  'RELIANCE.BSE':   { symbol: 'RELIANCE.BSE', price: 2987.40, open: 3010.55, high: 3022.10, low: 2975.30, volume: 3456789, previousClose: 3010.55, change: -23.15, changePercent: '-0.7689%', latestTradingDay: '2026-06-14' },
  'INFY.BSE':       { symbol: 'INFY.BSE', price: 1678.90, open: 1660.30, high: 1689.45, low: 1655.20, volume: 2134567, previousClose: 1660.30, change: 18.60, changePercent: '1.1203%', latestTradingDay: '2026-06-14' },
  'HDFCBANK.BSE':   { symbol: 'HDFCBANK.BSE', price: 1723.55, open: 1731.85, high: 1738.90, low: 1718.40, volume: 4567890, previousClose: 1731.85, change: -8.30, changePercent: '-0.4792%', latestTradingDay: '2026-06-14' },
  'WIPRO.BSE':      { symbol: 'WIPRO.BSE', price: 456.80, open: 451.40, high: 459.75, low: 449.20, volume: 987654, previousClose: 451.40, change: 5.40, changePercent: '1.1964%', latestTradingDay: '2026-06-14' },
  'ICICIBANK.BSE':  { symbol: 'ICICIBANK.BSE', price: 1187.25, open: 1174.50, high: 1192.80, low: 1170.35, volume: 5678901, previousClose: 1174.50, change: 12.75, changePercent: '1.0856%', latestTradingDay: '2026-06-14' },
  'BHARTIARTL.BSE': { symbol: 'BHARTIARTL.BSE', price: 1834.60, open: 1812.20, high: 1840.55, low: 1808.90, volume: 2345678, previousClose: 1812.20, change: 22.40, changePercent: '1.2360%', latestTradingDay: '2026-06-14' },
  'ITC.BSE':        { symbol: 'ITC.BSE', price: 432.15, open: 436.00, high: 437.50, low: 430.10, volume: 6789012, previousClose: 436.00, change: -3.85, changePercent: '-0.8830%', latestTradingDay: '2026-06-14' },
  'AAPL':  { symbol: 'AAPL', price: 189.84, open: 188.61, high: 190.23, low: 187.45, volume: 54321098, previousClose: 188.61, change: 1.23, changePercent: '0.6522%', latestTradingDay: '2026-06-14' },
  'NVDA':  { symbol: 'NVDA', price: 875.39, open: 859.72, high: 878.90, low: 855.30, volume: 43210987, previousClose: 859.72, change: 15.67, changePercent: '1.8227%', latestTradingDay: '2026-06-14' },
  'MSFT':  { symbol: 'MSFT', price: 415.26, open: 412.14, high: 416.80, low: 410.55, volume: 23456789, previousClose: 412.14, change: 3.12, changePercent: '0.7571%', latestTradingDay: '2026-06-14' },
  'TSLA':  { symbol: 'TSLA', price: 248.50, open: 253.80, high: 255.40, low: 246.90, volume: 87654321, previousClose: 253.80, change: -5.30, changePercent: '-2.0882%', latestTradingDay: '2026-06-14' },
  'GOOGL': { symbol: 'GOOGL', price: 175.43, open: 176.30, high: 177.20, low: 174.50, volume: 21098765, previousClose: 176.30, change: -0.87, changePercent: '-0.4936%', latestTradingDay: '2026-06-14' },
  'AMZN':  { symbol: 'AMZN', price: 198.12, open: 195.67, high: 199.45, low: 194.80, volume: 32109876, previousClose: 195.67, change: 2.45, changePercent: '1.2522%', latestTradingDay: '2026-06-14' },
};

const generateMockHistory = (basePrice, weeks = 26) => {
  const history = [];
  let price = basePrice * 1.15;
  const now = new Date();
  for (let i = weeks; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const change = (Math.random() - 0.48) * price * 0.03;
    price = Math.max(price + change, basePrice * 0.7);
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    history.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat((price - change / 2).toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000 + 500000)
    });
  }
  return history;
};

// =====================
// Search
// =====================
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Query required' });

    const cacheKey = `search_${q}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(AV_BASE, {
      params: { function: 'SYMBOL_SEARCH', keywords: q, apikey: AV_KEY },
      timeout: 8000
    });

    const results = (response.data.bestMatches || []).slice(0, 8).map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      currency: match['8. currency']
    }));

    setCache(cacheKey, results);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// =====================
// Quote
// =====================
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `quote_${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      const response = await axios.get(AV_BASE, {
        params: { function: 'GLOBAL_QUOTE', symbol, apikey: AV_KEY },
        timeout: 8000
      });

      const q = response.data['Global Quote'];
      if (q && q['01. symbol']) {
        const quote = {
          symbol: q['01. symbol'],
          price: parseFloat(q['05. price']),
          open: parseFloat(q['02. open']),
          high: parseFloat(q['03. high']),
          low: parseFloat(q['04. low']),
          volume: parseInt(q['06. volume']),
          previousClose: parseFloat(q['08. previous close']),
          change: parseFloat(q['09. change']),
          changePercent: q['10. change percent'],
          latestTradingDay: q['07. latest trading day']
        };
        setCache(cacheKey, quote);
        return res.json(quote);
      }
    } catch (e) {}

    const mock = MOCK_QUOTES[symbol] || MOCK_QUOTES[symbol.split('.')[0]];
    if (mock) {
      setCache(cacheKey, mock);
      return res.json(mock);
    }

    res.status(404).json({ message: 'Stock not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quote' });
  }
});

// =====================
// History
// =====================
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `history_${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      const response = await axios.get(AV_BASE, {
        params: { function: 'TIME_SERIES_WEEKLY', symbol, apikey: AV_KEY },
        timeout: 8000
      });

      const timeSeries = response.data['Weekly Time Series'];
      if (timeSeries) {
        const history = Object.entries(timeSeries)
          .slice(0, 26)
          .map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'])
          }))
          .reverse();
        setCache(cacheKey, history);
        return res.json(history);
      }
    } catch (e) {}

    const mock = MOCK_QUOTES[symbol];
    const basePrice = mock?.price || 1000;
    const history = generateMockHistory(basePrice);
    setCache(cacheKey, history);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// =====================
// Overview
// =====================
router.get('/overview/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `overview_${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      const response = await axios.get(AV_BASE, {
        params: { function: 'OVERVIEW', symbol, apikey: AV_KEY },
        timeout: 8000
      });

      const data = response.data;
      if (data.Symbol) {
        const overview = {
          symbol: data.Symbol,
          name: data.Name,
          description: data.Description?.slice(0, 400) + '...',
          sector: data.Sector,
          industry: data.Industry,
          marketCap: data.MarketCapitalization,
          pe: data.PERatio,
          eps: data.EPS,
          dividendYield: data.DividendYield,
          week52High: data['52WeekHigh'],
          week52Low: data['52WeekLow'],
          movingAvg50: data['50DayMovingAverage'],
          movingAvg200: data['200DayMovingAverage'],
          analystTarget: data.AnalystTargetPrice,
          beta: data.Beta
        };
        setCache(cacheKey, overview);
        return res.json(overview);
      }
    } catch (e) {}

    res.status(404).json({ message: 'Overview not available' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch overview' });
  }
});

// =====================
// 🔥 UNIQUE FEATURE: Market Sentiment Score
// =====================
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `sentiment_${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const mock = MOCK_QUOTES[symbol] || MOCK_QUOTES[symbol.split('.')[0]];
    const price = mock?.price || 1000;
    const change = mock?.change || 0;

    const priceSignal = change > 0 ? Math.min(change * 5, 30) : Math.max(change * 5, -30);
    const volumeSignal = mock?.volume > 3000000 ? 15 : mock?.volume > 1000000 ? 8 : 2;
    const momentumSignal = Math.random() * 20 - 5;
    const marketSignal = Math.random() * 15 - 5;

    const rawScore = 50 + priceSignal + volumeSignal + momentumSignal + marketSignal;
    const score = Math.min(Math.max(Math.round(rawScore), 5), 95);

    const sentiment = {
      score,
      label: score >= 70 ? 'Extreme Greed' : score >= 55 ? 'Greed' : score >= 45 ? 'Neutral' : score >= 30 ? 'Fear' : 'Extreme Fear',
      color: score >= 70 ? '#10b981' : score >= 55 ? '#84cc16' : score >= 45 ? '#f59e0b' : score >= 30 ? '#f97316' : '#ef4444',
      signals: [
        { name: 'Price Momentum', value: change > 1 ? 'Bullish' : change < -1 ? 'Bearish' : 'Neutral', icon: change > 0 ? '📈' : '📉' },
        { name: 'Volume Activity', value: mock?.volume > 3000000 ? 'High' : 'Moderate', icon: '📊' },
        { name: 'Market Trend', value: score > 50 ? 'Positive' : 'Negative', icon: '🌊' },
        { name: 'Volatility', value: Math.abs(change) > 2 ? 'High' : Math.abs(change) > 1 ? 'Medium' : 'Low', icon: '⚡' }
      ],
      updatedAt: new Date().toISOString()
    };

    setCache(cacheKey, sentiment);
    res.json(sentiment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate sentiment' });
  }
});

// =====================
// 🤖 AI Analysis (Groq)
// =====================
router.post('/ai-analysis', async (req, res) => {
  try {
    const { symbol, quote, overview } = req.body;

    if (!groq) {
      return res.json({
        recommendation: 'HOLD', confidence: 65, targetPrice: null, riskLevel: 'MEDIUM',
        summary: 'AI analysis unavailable — Groq API key not configured.',
        bullishPoints: ['Check fundamentals', 'Monitor price action', 'Review sector trends'],
        bearishPoints: ['Market uncertainty', 'Exercise caution', 'Diversify portfolio'],
        timeHorizon: 'Medium-term (3-12 months)'
      });
    }

    const isIndian = symbol?.includes('.BSE') || symbol?.includes('.NSE') || symbol?.includes('.BO') || symbol?.includes('.NS');
    const currency = isIndian ? '₹' : '$';
    const marketContext = isIndian
      ? 'Indian stock on NSE/BSE. Consider SEBI regulations, FII/DII activity, RBI policy, and Indian economic conditions.'
      : 'US stock. Consider Fed policy, US economic indicators, and sector rotation.';

    const prompt = `You are StockSage AI, an expert financial analyst.
${marketContext}

Stock: ${symbol}
Price: ${currency}${quote?.price}
Change: ${quote?.changePercent}
52W High: ${currency}${overview?.week52High || 'N/A'}
52W Low: ${currency}${overview?.week52Low || 'N/A'}
P/E: ${overview?.pe || 'N/A'}
Beta: ${overview?.beta || 'N/A'}
Sector: ${overview?.sector || 'N/A'}

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "recommendation": "BUY" or "SELL" or "HOLD",
  "confidence": number 60-95,
  "targetPrice": number,
  "riskLevel": "LOW" or "MEDIUM" or "HIGH",
  "summary": "2-3 sentences",
  "bullishPoints": ["point1","point2","point3"],
  "bearishPoints": ["point1","point2","point3"],
  "timeHorizon": "Short-term (1-3 months)" or "Medium-term (3-12 months)" or "Long-term (1+ years)"
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const text = completion.choices[0].message.content;
    const cleaned = text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleaned);
    res.json(analysis);

  } catch (error) {
    console.error('AI Analysis error:', error.message);
    res.json({
      recommendation: 'HOLD', confidence: 65, targetPrice: null, riskLevel: 'MEDIUM',
      summary: 'AI analysis temporarily unavailable. Please try again.',
      bullishPoints: ['Review quarterly results', 'Check sector performance', 'Monitor price levels'],
      bearishPoints: ['Market volatility present', 'Exercise caution', 'Diversify holdings'],
      timeHorizon: 'Medium-term (3-12 months)'
    });
  }
});

// =====================
// 🤖 AI Chat (Groq)
// =====================
router.post('/ai-chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!groq) {
      return res.json({ reply: 'AI chat unavailable — please add your Groq API key to backend/.env file and restart the server.' });
    }

    const prompt = `You are StockSage AI, a friendly stock market advisor with expertise in Indian markets (NSE, BSE, Nifty, Sensex) and global markets.
${context ? `Stock context: ${context}` : ''}
User: ${message}
Reply in 2-3 sentences. Be specific and actionable. No markdown or bullet points.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error('AI Chat error:', error.message);
    res.json({ reply: 'AI is temporarily unavailable. Please check your Groq API key in backend .env file.' });
  }
});

// =====================
// Popular Stocks
// =====================
router.get('/popular', (req, res) => {
  res.json([
    { symbol: 'TCS.BSE', name: 'Tata Consultancy Services', price: 3456.75, change: 45.20, changePercent: '1.32%', market: 'IN', currency: '₹' },
    { symbol: 'RELIANCE.BSE', name: 'Reliance Industries Ltd', price: 2987.40, change: -23.15, changePercent: '-0.77%', market: 'IN', currency: '₹' },
    { symbol: 'INFY.BSE', name: 'Infosys Limited', price: 1678.90, change: 18.60, changePercent: '1.12%', market: 'IN', currency: '₹' },
    { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank Limited', price: 1723.55, change: -8.30, changePercent: '-0.48%', market: 'IN', currency: '₹' },
    { symbol: 'WIPRO.BSE', name: 'Wipro Limited', price: 456.80, change: 5.40, changePercent: '1.20%', market: 'IN', currency: '₹' },
    { symbol: 'ICICIBANK.BSE', name: 'ICICI Bank Limited', price: 1187.25, change: 12.75, changePercent: '1.08%', market: 'IN', currency: '₹' },
    { symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel Ltd', price: 1834.60, change: 22.40, changePercent: '1.24%', market: 'IN', currency: '₹' },
    { symbol: 'ITC.BSE', name: 'ITC Limited', price: 432.15, change: -3.85, changePercent: '-0.88%', market: 'IN', currency: '₹' },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 1.23, changePercent: '0.65%', market: 'US', currency: '$' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.39, change: 15.67, changePercent: '1.82%', market: 'US', currency: '$' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.26, change: 3.12, changePercent: '0.76%', market: 'US', currency: '$' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -5.30, changePercent: '-2.09%', market: 'US', currency: '$' }
  ]);
});

module.exports = router;