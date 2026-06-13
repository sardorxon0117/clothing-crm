// ============================================
//  MAHSULOTLAR (Products) — S3 fayl yuklash bilan
// ============================================

const express = require('express');
const multer = require('multer');
const db = require('../db');
const { uploadToS3, deleteFromS3, s3Configured } = require('../s3');
const router = express.Router();

// Multer — faylni xotirada (RAM) qabul qiladi, keyin S3'ga yuboramiz
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Faqat rasm fayllarini yuklash mumkin.'));
  }
});

// Ro'yxat + qidiruv + kategoriya filtri
router.get('/', async (req, res) => {
  const search = (req.query.search || '').trim();
  const categoryId = req.query.category || '';
  try {
    let conditions = [], params = [], i = 1;
    if (search) { conditions.push(`(p.name ILIKE $${i} OR p.color ILIKE $${i})`); params.push(`%${search}%`); i++; }
    if (categoryId) { conditions.push(`p.category_id = $${i}`); params.push(categoryId); i++; }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const products = await db.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where} ORDER BY p.created_at DESC`, params
    );
    const categories = await db.query('SELECT * FROM categories ORDER BY name');

    res.render('products', {
      active: 'products', adminName: req.session.adminName,
      products: products.rows, categories: categories.rows,
      search, selectedCategory: categoryId
    });
  } catch (err) {
    console.error('Mahsulotlar xatosi:', err.message);
    res.status(500).send('Xato: ' + err.message);
  }
});

// Yangi mahsulot formasi
router.get('/new', async (req, res) => {
  const categories = await db.query('SELECT * FROM categories ORDER BY name');
  res.render('product-form', {
    active: 'products', adminName: req.session.adminName,
    product: null, categories: categories.rows,
    formTitle: 'Yangi mahsulot qo\u2019shish', s3Configured
  });
});

// Tahrirlash formasi
router.get('/:id/edit', async (req, res) => {
  try {
    const product = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (product.rows.length === 0) return res.redirect('/products');
    const categories = await db.query('SELECT * FROM categories ORDER BY name');
    res.render('product-form', {
      active: 'products', adminName: req.session.adminName,
      product: product.rows[0], categories: categories.rows,
      formTitle: 'Mahsulotni tahrirlash', s3Configured
    });
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

// Yangi mahsulot saqlash (rasm bilan)
router.post('/', upload.single('image'), async (req, res) => {
  const { name, category_id, size, color, price, stock } = req.body;
  try {
    let image_url = null, image_key = null;
    if (req.file) {
      const r = await uploadToS3(req.file.buffer, req.file.mimetype);
      image_url = r.url; image_key = r.key;
    }
    await db.query(
      `INSERT INTO products (name, category_id, size, color, price, stock, image_url, image_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [name, category_id || null, size, color, price || 0, stock || 0, image_url, image_key]
    );
    res.redirect('/products');
  } catch (err) {
    console.error('Mahsulot saqlash xatosi:', err.message);
    res.status(500).send('Xato: ' + err.message + ' <br><a href="/products/new">Orqaga</a>');
  }
});

// Yangilash (yangi rasm tanlangan bo'lsa, eskisini S3'dan o'chiramiz)
router.put('/:id', upload.single('image'), async (req, res) => {
  const { name, category_id, size, color, price, stock } = req.body;
  try {
    const existing = await db.query('SELECT image_url, image_key FROM products WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.redirect('/products');

    let image_url = existing.rows[0].image_url;
    let image_key = existing.rows[0].image_key;

    if (req.file) {
      const oldKey = image_key;
      const r = await uploadToS3(req.file.buffer, req.file.mimetype);
      image_url = r.url; image_key = r.key;
      if (oldKey) await deleteFromS3(oldKey); // eski rasmni tozalaymiz
    }

    await db.query(
      `UPDATE products SET name=$1, category_id=$2, size=$3, color=$4,
       price=$5, stock=$6, image_url=$7, image_key=$8 WHERE id=$9`,
      [name, category_id || null, size, color, price || 0, stock || 0, image_url, image_key, req.params.id]
    );
    res.redirect('/products');
  } catch (err) {
    console.error('Mahsulot yangilash xatosi:', err.message);
    res.status(500).send('Xato: ' + err.message);
  }
});

// O'chirish (rasmni ham S3'dan o'chiramiz)
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.query('SELECT image_key FROM products WHERE id = $1', [req.params.id]);
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (existing.rows.length && existing.rows[0].image_key) {
      await deleteFromS3(existing.rows[0].image_key);
    }
    res.redirect('/products');
  } catch (err) {
    res.status(500).send('Xato: ' + err.message);
  }
});

module.exports = router;
