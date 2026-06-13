// ============================================
//  ASOSIY SERVER (Express ilovasi)
//  Kiyim-kechak do'koni CRM tizimi
// ============================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const methodOverride = require('method-override');
const path = require('path');

const { pool } = require('./db');
const { requireLogin } = require('./middleware/auth');

// Route'lar
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const customersRoutes = require('./routes/customers');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 8080;

// ---- Sozlamalar ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Statik fayllar (CSS, JS, rasmlar)
app.use(express.static(path.join(__dirname, 'public')));

// Forma ma'lumotlarini o'qish
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PUT/DELETE'ni forma orqali ishlatish uchun (_method)
app.use(methodOverride('_method'));

// ---- Sessiya (session) ----
// Sessiyalar bazada saqlanadi (connect-pg-simple).
// Bu MUHIM: server qayta ishga tushsa yoki bir nechta nusxa (load balancing,
// auto-scaling) ishlasa ham, foydalanuvchi sessiyasi yo'qolmaydi.
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'zaxira-maxfiy-kalit-almashtiring',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8, // 8 soat
    httpOnly: true
  }
}));

// ---- Yo'naltirishlar (Routes) ----

// Login/logout (himoyasiz — hamma kira oladi)
app.use('/', authRoutes);

// Quyidagilar HIMOYALANGAN — faqat login qilgan admin kira oladi
app.use('/', requireLogin, dashboardRoutes);
app.use('/customers', requireLogin, customersRoutes);
app.use('/products', requireLogin, productsRoutes);
app.use('/orders', requireLogin, ordersRoutes);
app.use('/reports', requireLogin, reportsRoutes);
app.use('/settings', requireLogin, settingsRoutes);

// Xato boshqaruvi (masalan, fayl juda katta, rasm emas, S3 xatosi)
app.use((err, req, res, next) => {
  console.error('Xato:', err.message);
  const msg = err.code === 'LIMIT_FILE_SIZE'
    ? 'Rasm hajmi juda katta (5 MB dan oshmasin).'
    : err.message;
  res.status(400).send('Xatolik: ' + msg + ' <br><a href="javascript:history.back()">← Orqaga qaytish</a>');
});

// 404 — sahifa topilmadi
app.use((req, res) => {
  res.status(404).send('404 — Sahifa topilmadi. <a href="/">Bosh sahifaga</a>');
});

// ---- Serverni ishga tushirish ----
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`🚀 CRM server ishga tushdi: http://localhost:${PORT}`);
  console.log('===========================================');
});
