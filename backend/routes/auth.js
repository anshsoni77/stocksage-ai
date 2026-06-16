const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body); // Debug log

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      watchlist: []
    });

    await user.save();
    console.log('✅ User created:', user.email); // Debug log

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        watchlist: user.watchlist
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error); // Debug log
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = generateToken(user._id);
    console.log('✅ Login successful:', user.email);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        watchlist: user.watchlist
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get Profile
router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// Add to Watchlist
router.post('/watchlist', authMiddleware, async (req, res) => {
  try {
    const { symbol, name } = req.body;
    const user = await User.findById(req.user._id);

    const exists = user.watchlist.find(item => item.symbol === symbol);
    if (exists) {
      return res.status(400).json({ message: 'Already in watchlist' });
    }

    user.watchlist.push({ symbol, name });
    await user.save();

    res.json({ message: 'Added to watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from Watchlist
router.delete('/watchlist/:symbol', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.watchlist = user.watchlist.filter(item => item.symbol !== req.params.symbol);
    await user.save();
    res.json({ message: 'Removed from watchlist', watchlist: user.watchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;