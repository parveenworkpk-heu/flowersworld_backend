const Product = require('../models/Product');

let cartStore = new Map();

exports.getCart = async (req, res) => {
  try {
    const cart = cartStore.get(req.user._id.toString()) || [];
    const cartItems = [];

    for (const item of cart) {
      const product = await Product.findById(item.productId).select('-reviews');
      if (product) {
        cartItems.push({
          _id: item.productId,
          name: product.name,
          price: product.discountPrice || product.price,
          image: product.images[0],
          quantity: item.quantity,
          maxStock: product.stock
        });
      }
    }

    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id.toString();

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = cartStore.get(userId) || [];
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      existingItem.quantity = newQty;
    } else {
      cart.push({ productId, quantity });
    }

    cartStore.set(userId, cart);
    res.json({ message: 'Added to cart', cartSize: cart.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;
    const userId = req.user._id.toString();

    const product = await Product.findById(itemId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = cartStore.get(userId) || [];
    const item = cart.find(item => item.productId === itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    item.quantity = quantity;
    cartStore.set(userId, cart);
    res.json({ message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id.toString();

    let cart = cartStore.get(userId) || [];
    cart = cart.filter(item => item.productId !== itemId);
    cartStore.set(userId, cart);

    res.json({ message: 'Removed from cart', cartSize: cart.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    cartStore.set(userId, []);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
