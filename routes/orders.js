const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const JWT_SECRET = 'flowersworldsecretkey2024';

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

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

router.post('/', auth, (req, res) => {
  try {
    const { items, shippingDetails, paymentMethod, totalAmount } = req.body;
    const data = readData();
    
    const order = {
      _id: 'order_' + Date.now(),
      user: req.userId,
      items,
      shippingDetails,
      paymentMethod,
      totalAmount,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    data.orders.push(order);
    writeData(data);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-orders', auth, (req, res) => {
  try {
    const data = readData();
    const userOrders = data.orders.filter(o => o.user === req.userId);
    res.json({ orders: userOrders, total: userOrders.length, totalPages: 1, currentPage: 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const data = readData();
    const order = data.orders.find(o => o._id === req.params.id && o.user === req.userId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
