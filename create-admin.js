// ============================================
//  ADMIN YARATISH (bir marta ishga tushiriladi)
// ============================================
// Bu skript admin foydalanuvchisini XAVFSIZ (parol hash'langan) holda
// bazaga qo'shadi. Parol ochiq saqlanmaydi — bcrypt bilan shifrlanadi.
//
// Ishga tushirish:  node create-admin.js
//
// Foydalanuvchi nomi va parolni quyida o'zgartiring:

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

// ⬇️ SHU YERNI O'ZGARTIRING
const USERNAME = 'admin';
const PASSWORD = 'admin123';       // login uchun parol — keyin o'zgartira olasiz
const FULL_NAME = 'Bosh administrator';
// ⬆️

async function createAdmin() {
  try {
    // Parolni hash'lash (10 — kuchlilik darajasi)
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    // Avval shu username mavjudligini tekshiramiz
    const existing = await db.query(
      'SELECT id FROM admins WHERE username = $1',
      [USERNAME]
    );

    if (existing.rows.length > 0) {
      // Mavjud bo'lsa — parolni yangilaymiz
      await db.query(
        'UPDATE admins SET password_hash = $1, full_name = $2 WHERE username = $3',
        [passwordHash, FULL_NAME, USERNAME]
      );
      console.log(`♻️  "${USERNAME}" allaqachon mavjud edi — paroli yangilandi.`);
    } else {
      // Yangi admin qo'shamiz
      await db.query(
        'INSERT INTO admins (username, password_hash, full_name) VALUES ($1, $2, $3)',
        [USERNAME, passwordHash, FULL_NAME]
      );
      console.log(`✅ Admin yaratildi!`);
    }

    console.log('-----------------------------------');
    console.log(`   Login:  ${USERNAME}`);
    console.log(`   Parol:  ${PASSWORD}`);
    console.log('-----------------------------------');
    console.log('Endi serverni ishga tushirib login qilishingiz mumkin.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Xato:', err.message);
    process.exit(1);
  }
}

createAdmin();
