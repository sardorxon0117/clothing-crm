// ============================================
//  BUYURTMALAR (Orders) — order_items bilan
// ============================================
// Buyurtma yaratilganda: summa avtomatik hisoblanadi va
// ombordan (stock) mahsulot avtomatik ayiriladi. Tranzaksiya ishlatiladi —
// ya'ni xato bo'lsa, hamma o'zgarish bekor qilinadi (ma'lumot buzilmaydi).

const express = require('express');
const db = require('../db');
const { pool } = require('../db');
const router = express.Router();

// Ro'yxat
router.get('/', async (req, res) => {
  const statusFilter = req.query.status || '';
  try {
    let result;
    if (statusFilter) {
      result = await db.query(
        `SELECT o.*, COALESCE(c.name, 'O\u2019chirilgan mijoz') AS customer_name
         FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
         WHERE o.status = $1
         ORDER BY o.created_at DESC`,
        [statusFilter]
      );
    } else {
      result = await db.query(
        `SELECT o.*, COALESCE(c.name, 'O\u2019chirilgan mijoz') AS customer_name
         FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
         ORDER BY o.created_at DESC`
      );
    }
    res.render('orders', {
      active: 'orders',
      adminName: req.session.adminName,
      orders: result.rows,
      statusFilter
    });
  } catch (err) {
    console.error('Buyurtmalar xatosi:', err.message);
    res.status(500).send('Xato: ' + err.message);
  }
});

// Yangi buyurtma formasi
router.get('/new', async (req, res) => {
  try {
    const customers = await db.query('SELECT id, name FROM customers ORDER BY name');
    const products = await db.query(
      'SELECT id, name, price, stock FROM products WHERE stock > 0 ORDER BY name'
    );
    res.render('order-form', {
      active: 'orders',
      adminName: req.session.adminName,
      customers: customers.rows,
      products: products.rows
    });
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

// Buyurtma tafsilotlarini ko'rish
router.get('/:id', async (req, res) => {
  try {
    const order = await db.query(
      `SELECT o.*, COALESCE(c.name, 'O\u2019chirilgan mijoz') AS customer_name,
              c.phone AS customer_phone
       FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (order.rows.length === 0) return res.redirect('/orders');

    const items = await db.query(
      `SELECT oi.*, COALESCE(p.name, 'O\u2019chirilgan mahsulot') AS product_name
       FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [req.params.id]
    );

    res.render('order-detail', {
      active: 'orders',
      adminName: req.session.adminName,
      order: order.rows[0],
      items: items.rows
    });
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

// Yangi buyurtma saqlash (TRANZAKSIYA)
router.post('/', async (req, res) => {
  // Formadan keladi: customer_id, product_id[], quantity[]
  let { customer_id, product_id, quantity } = req.body;

  // Bitta mahsulot bo'lsa, massivga aylantiramiz
  if (!Array.isArray(product_id)) product_id = [product_id];
  if (!Array.isArray(quantity)) quantity = [quantity];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Buyurtma yozuvini yaratamiz (summa keyin yangilanadi)
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, status, total) VALUES ($1, 'yangi', 0) RETURNING id`,
      [customer_id || null]
    );
    const orderId = orderResult.rows[0].id;

    let total = 0;

    // 2. Har bir mahsulot uchun
    for (let i = 0; i < product_id.length; i++) {
      const pid = product_id[i];
      const qty = parseInt(quantity[i]) || 0;
      if (!pid || qty <= 0) continue;

      // Mahsulot narxi va qoldig'ini olamiz
      const prod = await client.query('SELECT price, stock, name FROM products WHERE id = $1', [pid]);
      if (prod.rows.length === 0) continue;

      const price = parseFloat(prod.rows[0].price);
      const stock = parseInt(prod.rows[0].stock);

      // Ombordagi qoldiq yetarli emasligini tekshiramiz
      if (qty > stock) {
        throw new Error(`"${prod.rows[0].name}" uchun omborda yetarli mahsulot yo\u2019q (qoldiq: ${stock}).`);
      }

      // order_items'ga yozamiz
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, pid, qty, price]
      );

      // Ombordan ayiramiz
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [qty, pid]);

      total += price * qty;
    }

    // 3. Umumiy summani yangilaymiz
    await client.query('UPDATE orders SET total = $1 WHERE id = $2', [total, orderId]);

    await client.query('COMMIT');
    res.redirect('/orders');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Buyurtma xatosi:', err.message);
    res.status(400).send('Buyurtma yaratilmadi: ' + err.message + ' <br><a href="/orders/new">Orqaga</a>');
  } finally {
    client.release();
  }
});

// Buyurtma holatini o'zgartirish
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.redirect('/orders/' + req.params.id);
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

// Buyurtmani o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.redirect('/orders');
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

module.exports = router;
