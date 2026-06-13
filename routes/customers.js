// ============================================
//  MIJOZLAR (Customers) — to'liq CRUD
// ============================================

const express = require('express');
const db = require('../db');
const router = express.Router();

// Ro'yxat + qidiruv
router.get('/', async (req, res) => {
  const search = (req.query.search || '').trim();
  try {
    let result;
    if (search) {
      result = await db.query(
        `SELECT * FROM customers
         WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
         ORDER BY created_at DESC`,
        [`%${search}%`]
      );
    } else {
      result = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
    }
    res.render('customers', {
      active: 'customers',
      adminName: req.session.adminName,
      customers: result.rows,
      search
    });
  } catch (err) {
    console.error('Mijozlar xatosi:', err.message);
    res.status(500).send('Xato: ' + err.message);
  }
});

// Yangi mijoz formasi
router.get('/new', (req, res) => {
  res.render('customer-form', {
    active: 'customers',
    adminName: req.session.adminName,
    customer: null,
    formTitle: 'Yangi mijoz qo\u2019shish'
  });
});

// Mijozni tahrirlash formasi
router.get('/:id/edit', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.redirect('/customers');
    res.render('customer-form', {
      active: 'customers',
      adminName: req.session.adminName,
      customer: result.rows[0],
      formTitle: 'Mijozni tahrirlash'
    });
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

// Yangi mijoz saqlash
router.post('/', async (req, res) => {
  const { name, phone, email, address, customer_type } = req.body;
  try {
    await db.query(
      `INSERT INTO customers (name, phone, email, address, customer_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, phone, email, address, customer_type || 'oddiy']
    );
    res.redirect('/customers');
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

// Mijozni yangilash
router.put('/:id', async (req, res) => {
  const { name, phone, email, address, customer_type } = req.body;
  try {
    await db.query(
      `UPDATE customers
       SET name = $1, phone = $2, email = $3, address = $4, customer_type = $5
       WHERE id = $6`,
      [name, phone, email, address, customer_type, req.params.id]
    );
    res.redirect('/customers');
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

// Mijozni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.redirect('/customers');
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

module.exports = router;
