import React from 'react';
import { useNavigate } from 'react-router-dom';

const getCurrency = (symbol) => {
  if (symbol?.includes('.BSE') || symbol?.includes('.NSE') || symbol?.includes('.BO') || symbol?.includes('.NS')) return '₹';
  return '$';
};

const StockCard = ({ stock }) => {
  const navigate = useNavigate();
  const isPositive = stock.change >= 0;
  const isNeutral = stock.change === 0;
  const changeClass = isNeutral ? 'change-neutral' : isPositive ? 'change-positive' : 'change-negative';
  const arrow = isNeutral ? '→' : isPositive ? '↑' : '↓';
  const currency = stock.currency || getCurrency(stock.symbol);

  return (
    <div className="stock-card" onClick={() => navigate(`/stock/${stock.symbol}`)}>
      <div className="stock-card-header">
        <div>
          <div className="stock-symbol">{stock.symbol?.replace('.BSE','').replace('.NSE','')}</div>
          <div className="stock-name-small">{stock.name}</div>
        </div>
        <span className={`stock-change ${changeClass}`}>
          {arrow} {stock.changePercent}
        </span>
      </div>
      <div className="stock-price" style={{ color: isPositive ? 'var(--green)' : isNeutral ? 'var(--text-primary)' : 'var(--red)' }}>
        {currency}{typeof stock.price === 'number' ? stock.price.toLocaleString('en-IN') : stock.price}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
        {isPositive ? '+' : ''}{typeof stock.change === 'number' ? stock.change.toFixed(2) : stock.change}
      </div>
    </div>
  );
};

export default StockCard;