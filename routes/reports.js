// ============================================
//  HISOBOTLAR (Reports) — tahlil
// ============================================

const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [topProducts, topCustomers, lowStock, salesByCategory, statusBreakdown] = await Promise.all([
      // Eng ko'p sotilgan mahsulotlar
      db.query(`
        SELECT p.name, COALESCE(SUM(oi.quantity), 0) AS sold,
               COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id, p.name
        HAVING COALESCE(SUM(oi.quantity), 0) > 0
        ORDER BY sold DESC
        LIMIT 10
      `),
      // Eng faol mijozlar
      db.query(`
        SELECT c.name, COUNT(o.id) AS order_count,
               COALESCE(SUM(o.total), 0) AS total_spent
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.status != 'bekor'
        GROUP BY c.id, c.name
        HAVING COUNT(o.id) > 0
        ORDER BY total_spent DESC
        LIMIT 10
      `),
      // Kam qolgan mahsulotlar
      db.query(`
        SELECT name, size, color, stock
        FROM products
        WHERE stock <= 10
        ORDER BY stock ASC
      `),
      // Kategoriya bo'yicha savdo
      db.query(`
        SELECT COALESCE(c.name, 'Kategoriyasiz') AS category,
               COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `),
      // Buyurtma holatlari
      db.query(`
        SELECT status, COUNT(*) AS count
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `)
    ]);

    res.render('reports', {
      active: 'reports',
      adminName: req.session.adminName,
      topProducts: topProducts.rows,
      topCustomers: topCustomers.rows,
      lowStock: lowStock.rows,
      salesByCategory: salesByCategory.rows,
      statusBreakdown: statusBreakdown.rows
    });
  } catch (err) {
    console.error('Hisobot xatosi:', err.message);
    res.status(500).send('Xato: ' + err.message);
  }
});

module.exports = router;
