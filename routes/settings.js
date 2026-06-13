// ============================================
//  SOZLAMALAR (Settings) — parolni o'zgartirish
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('settings', {
    active: 'settings',
    adminName: req.session.adminName,
    message: null,
    error: null
  });
});

router.post('/password', async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  try {
    const result = await db.query('SELECT * FROM admins WHERE id = $1', [req.session.adminId]);
    const admin = result.rows[0];

    // Joriy parolni tekshiramiz
    const match = await bcrypt.compare(current_password, admin.password_hash);
    if (!match) {
      return res.render('settings', {
        active: 'settings', adminName: req.session.adminName,
        message: null, error: 'Joriy parol noto\u2019g\u2019ri.'
      });
    }

    if (new_password.length < 6) {
      return res.render('settings', {
        active: 'settings', adminName: req.session.adminName,
        message: null, error: 'Yangi parol kamida 6 ta belgidan iborat bo\u2019lsin.'
      });
    }

    if (new_password !== confirm_password) {
      return res.render('settings', {
        active: 'settings', adminName: req.session.adminName,
        message: null, error: 'Yangi parollar mos kelmadi.'
      });
    }

    // Yangi parolni hash'lab saqlaymiz
    const newHash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE admins SET password_hash = $1 WHERE id = $2',
      [newHash, req.session.adminId]);

    res.render('settings', {
      active: 'settings', adminName: req.session.adminName,
      message: 'Parol muvaffaqiyatli o\u2019zgartirildi.', error: null
    });
  } catch (err) {
    res.render('settings', {
      active: 'settings', adminName: req.session.adminName,
      message: null, error: 'Xato: ' + err.message
    });
  }
});

module.exports = router;
