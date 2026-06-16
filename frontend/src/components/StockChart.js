import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const getCurrency = (symbol) => {
  if (!symbol) return '$';
  const s = symbol.toUpperCase();
  if (s.includes('.BSE') || s.includes('.NSE') || s.includes('.BO') || s.includes('.NS')) return '₹';
  return '$';
};

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '12px 16px'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label}</p>
        <p style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '1rem' }}>
          {currency}{payload[0].value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const StockChart = ({ data, symbol }) => {
  const currency = getCurrency(symbol);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📉</div>
        <p>No chart data available</p>
        <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Alpha Vantage free tier: 25 requests/day</p>
      </div>
    );
  }

  const isPositive = data[data.length - 1]?.close >= data[0]?.close;
  const color = isPositive ? '#10b981' : '#ef4444';
  const gradientId = `gradient-${symbol?.replace('.', '-')}`;

  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    close: d.close,
    high: d.high,
    low: d.low
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${currency}${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;