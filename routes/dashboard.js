// ============================================
//  DASHBOARD (Boshqaruv paneli)
// ============================================

const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [
      customersCount,
      productsCount,
      ordersCount,
      revenue,
      lowStockCount,
      recentOrders,
      topProducts,
      salesByMonth,
      statusBreakdown,
      lowStockList
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM customers'),
      db.query('SELECT COUNT(*) FROM products'),
      db.query('SELECT COUNT(*) FROM orders'),
      db.query("SELECT COALESCE(SUM(total), 0) AS sum FROM orders WHERE status != 'bekor'"),
      db.query('SELECT COUNT(*) FROM products WHERE stock <= 10'),
      db.query(`
        SELECT o.id, o.total, o.status, o.created_at,
               COALESCE(c.name, 'O\u2019chirilgan mijoz') AS customer_name
        FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC LIMIT 5
      `),
      db.query(`
        SELECT p.name, COALESCE(SUM(oi.quantity), 0) AS sold
        FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5
      `),
      db.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
               SUM(total) AS total
        FROM orders
        WHERE status != 'bekor' AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1 ORDER BY 1
      `),
      db.query(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC`),
      db.query(`SELECT name, size, color, stock FROM products WHERE stock <= 10 ORDER BY stock ASC LIMIT 5`)
    ]);

    res.render('dashboard', {
      active: 'dashboard',
      adminName: req.session.adminName,
      stats: {
        customers: parseInt(customersCount.rows[0].count),
        products: parseInt(productsCount.rows[0].count),
        orders: parseInt(ordersCount.rows[0].count),
        revenue: parseFloat(revenue.rows[0].sum),
        lowStock: parseInt(lowStockCount.rows[0].count)
      },
      recentOrders: recentOrders.rows,
      topProducts: topProducts.rows,
      salesByMonth: salesByMonth.rows,
      statusBreakdown: statusBreakdown.rows,
      lowStockList: lowStockList.rows
    });
  } catch (err) {
    console.error('Dashboard xatosi:', err.message);
    res.status(500).send('Dashboard yuklanmadi: ' + err.message);
  }
});

module.exports = router;
