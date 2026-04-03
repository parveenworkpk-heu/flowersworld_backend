const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

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

// Sample products if none exist
const sampleProducts = [
  {
    name: "Red Roses Bouquet",
    description: "Beautiful fresh red roses arranged in an elegant bouquet",
    price: 599,
    discountPrice: 449,
    images: ["https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400"],
    category: "Roses",
    stock: 25,
    ratings: 4.5,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Pink Carnations",
    description: "Fresh pink carnations perfect for gifting",
    price: 399,
    images: ["https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400"],
    category: "Carnations",
    stock: 30,
    ratings: 4.2,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Mixed Flower Basket",
    description: "A beautiful mix of seasonal flowers in a basket",
    price: 899,
    discountPrice: 699,
    images: ["https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400"],
    category: "Mixed",
    stock: 15,
    ratings: 4.8,
    isFeatured: true,
    isActive: true
  },
  {
    name: "White Lilies",
    description: "Elegant white lilies with fresh greenery",
    price: 549,
    images: ["https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=400"],
    category: "Lilies",
    stock: 20,
    ratings: 4.3,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Sunflower Arrangement",
    description: "Bright and cheerful sunflower arrangement",
    price: 449,
    images: ["https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=400"],
    category: "Sunflowers",
    stock: 18,
    ratings: 4.6,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Orchid Plant",
    description: "Beautiful purple orchid plant in pot",
    price: 799,
    discountPrice: 649,
    images: ["https://images.unsplash.com/photo-1566937203739-69c066c59fba?w=400"],
    category: "Orchids",
    stock: 12,
    ratings: 4.7,
    isFeatured: true,
    isActive: true
  }
];

router.get('/', (req, res) => {
  try {
    const data = readData();
    if (data.products.length === 0) {
      data.products = sampleProducts.map((p, i) => ({ _id: 'prod_' + (i + 1), ...p, createdAt: new Date().toISOString() }));
      writeData(data);
    }
    res.json({ products: data.products, total: data.products.length, totalPages: 1, currentPage: 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/featured', (req, res) => {
  try {
    const data = readData();
    const featured = data.products.filter(p => p.isFeatured);
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/categories', (req, res) => {
  try {
    const data = readData();
    const categories = [...new Set(data.products.map(p => p.category))];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const data = readData();
    const product = data.products.find(p => p._id === req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const data = readData();
    const product = { _id: 'prod_' + Date.now(), ...req.body, createdAt: new Date().toISOString() };
    data.products.push(product);
    writeData(data);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.products.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    data.products[index] = { ...data.products[index], ...req.body };
    writeData(data);
    res.json(data.products[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.products.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    data.products[index].isActive = false;
    writeData(data);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
