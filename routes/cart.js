const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

let cartStore = new Map();
const JWT_SECRET = 'flowersworldsecretkey2024';

const DATA_FILE = path.join(__dirname, '..', 'data.json');

const readData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return { users: [], products: [], orders: [] };
};

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

router.get('/', auth, (req, res) => {
  try {
    const cart = cartStore.get(req.userId) || [];
    const data = readData();
    
    const cartItems = cart.map(item => {
      const product = data.products.find(p => p._id === item.productId);
      if (product) {
        return {
          _id: item.productId,
          name: product.name,
          price: product.discountPrice || product.price,
          image: product.images?.[0] || 'https://placehold.co/100x100',
          quantity: item.quantity,
          maxStock: product.stock
        };
      }
      return null;
    }).filter(Boolean);
    
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/add', auth, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  let cart = cartStore.get(req.userId) || [];
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  cartStore.set(req.userId, cart);
  res.json({ message: 'Added to cart', cartSize: cart.length });
});

router.put('/:itemId', auth, (req, res) => {
  const { quantity } = req.body;
  let cart = cartStore.get(req.userId) || [];
  const item = cart.find(i => i.productId === req.params.itemId);
  if (item) {
    item.quantity = quantity;
    cartStore.set(req.userId, cart);
  }
  res.json({ message: 'Cart updated' });
});

router.delete('/:itemId', auth, (req, res) => {
  let cart = cartStore.get(req.userId) || [];
  cart = cart.filter(item => item.productId !== req.params.itemId);
  cartStore.set(req.userId, cart);
  res.json({ message: 'Removed from cart' });
});

router.delete('/', auth, (req, res) => {
  cartStore.set(req.userId, []);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
