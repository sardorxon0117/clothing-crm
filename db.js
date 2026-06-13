// ============================================
//  BAZAGA ULANISH (Neon PostgreSQL)
// ============================================
// Bu fayl Neon bazasiga ulanish "hovuzini" (pool) yaratadi.
// Boshqa fayllar shu pool orqali SQL so'rovlarini yuboradi.

require('dotenv').config();
const { Pool } = require('pg');

// connectionString — bu .env faylidagi DATABASE_URL.
// ssl — Neon (va boshqa bulut bazalar) shifrlangan ulanishni talab qiladi.
// Lokal bazada (localhost) SSL o'chiriladi, bulutda yoqiladi.
const connStr = process.env.DATABASE_URL || '';
const isLocal = connStr.includes('localhost') || connStr.includes('127.0.0.1');

const pool = new Pool({
  connectionString: connStr,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Ulanishni tekshirish (server ishga tushganda log chiqaradi)
pool.on('connect', () => {
  console.log('✅ Bazaga muvaffaqiyatli ulandi');
});

pool.on('error', (err) => {
  console.error('❌ Baza xatosi:', err.message);
});

// query — boshqa fayllar shu funksiya orqali so'rov yuboradi
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
