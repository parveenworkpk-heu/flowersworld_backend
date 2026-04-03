const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'flowersworldsecretkey2024';
const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Simple file-based storage
const readData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return { users: [], products: [], orders: [] };
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const data = readData();
    
    const existingUser = data.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = {
      _id: 'user_' + Date.now(),
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: 'user',
      isBlocked: false,
      addresses: [],
      createdAt: new Date().toISOString()
    };
    
    data.users.push(user);
    writeData(data);
    
    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = readData();
    
    const user = data.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const data = readData();
    const user = data.users.find(u => u._id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    delete user.password;
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const data = readData();
    const userIndex = data.users.findIndex(u => u._id === decoded.userId);
    
    if (userIndex === -1) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const { name, email, phone, addresses } = req.body;
    
    if (name) data.users[userIndex].name = name;
    if (email) data.users[userIndex].email = email;
    if (phone) data.users[userIndex].phone = phone;
    if (addresses) data.users[userIndex].addresses = addresses;
    
    writeData(data);
    
    delete data.users[userIndex].password;
    res.json(data.users[userIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
