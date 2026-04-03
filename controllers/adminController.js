const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getAnalytics = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['Processing', 'Shipped', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const activeUsers = await User.countDocuments({ role: 'user', isBlocked: false });
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const ordersOverTime = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const paymentMethods = await Order.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
    ]);

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          image: { $arrayElemAt: ['$product.images', 0] },
          totalSold: 1
        }
      }
    ]);

    res.json({
      kpi: {
        totalRevenue: totalRevenue[0]?.total || 0,
        activeUsers,
        pendingOrders,
        totalOrders: await Order.countDocuments()
      },
      ordersByStatus,
      ordersOverTime,
      paymentMethods,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isBlocked } = req.query;
    
    const query = { role: 'user' };
    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const lowStockProducts = await Product.countDocuments({ 
      isActive: true,
      stock: { $lt: 10 }
    });

    res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      lowStockProducts,
      recentOrders: await Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
