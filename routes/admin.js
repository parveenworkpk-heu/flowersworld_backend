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

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const data = readData();
    const user = data.users.find(u => u._id === decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

router.get('/analytics', adminAuth, (req, res) => {
  const data = readData();
  const totalRevenue = data.orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeUsers = data.users.filter(u => !u.isBlocked).length;
  const pendingOrders = data.orders.filter(o => o.status === 'Pending').length;
  
  res.json({
    kpi: {
      totalRevenue,
      activeUsers,
      pendingOrders,
      totalOrders: data.orders.length
    },
    ordersByStatus: [],
    ordersOverTime: [],
    paymentMethods: [],
    topProducts: []
  });
});

router.get('/users', adminAuth, (req, res) => {
  const data = readData();
  res.json({ users: data.users, total: data.users.length, totalPages: 1, currentPage: 1 });
});

router.patch('/users/:id/toggle-block', adminAuth, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u._id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  user.isBlocked = !user.isBlocked;
  writeData(data);
  res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
});

router.get('/stats', adminAuth, (req, res) => {
  const data = readData();
  res.json({
    totalProducts: data.products.length,
    totalUsers: data.users.length,
    totalOrders: data.orders.length,
    lowStockProducts: data.products.filter(p => p.stock < 10).length,
    recentOrders: data.orders.slice(-5).reverse()
  });
});

router.get('/orders', adminAuth, (req, res) => {
  const data = readData();
  res.json({ orders: data.orders, total: data.orders.length, totalPages: 1, currentPage: 1 });
});

router.patch('/orders/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  const data = readData();
  const order = data.orders.find(o => o._id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  order.status = status;
  if (status === 'Delivered') {
    order.deliveredAt = new Date().toISOString();
  }
  writeData(data);
  res.json(order);
});

module.exports = router;
