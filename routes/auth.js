// ============================================
//  LOGIN / LOGOUT
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// Login sahifasini ko'rsatish
router.get('/login', (req, res) => {
  // Agar allaqachon login qilingan bo'lsa — dashboard'ga
  if (req.session && req.session.adminId) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

// Login formasini qabul qilish
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Foydalanuvchini bazadan topamiz
    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.render('login', { error: 'Login yoki parol noto\u2019g\u2019ri.' });
    }

    const admin = result.rows[0];

    // Kiritilgan parolni bazadagi hash bilan solishtiramiz
    const match = await bcrypt.compare(password, admin.password_hash);

    if (!match) {
      return res.render('login', { error: 'Login yoki parol noto\u2019g\u2019ri.' });
    }

    // To'g'ri — sessiyaga yozamiz
    req.session.adminId = admin.id;
    req.session.adminName = admin.full_name || admin.username;

    res.redirect('/');
  } catch (err) {
    console.error('Login xatosi:', err.message);
    res.render('login', { error: 'Server xatosi. Qaytadan urinib ko\u2019ring.' });
  }
});

// Chiqish (Logout)
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
