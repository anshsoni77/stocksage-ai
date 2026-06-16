import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
          </Routes>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#f1f5f9',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              fontSize: '0.9rem'
            }
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;