-- ============================================
--  STIL SAVDO CRM — DATABASE SXEMASI
--  Neon PostgreSQL uchun
--  Ishlatish: Neon SQL Editor'da ishga tushiring
-- ============================================

-- 1. Adminlar (login uchun) — parol bcrypt bilan hash'lanadi
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Kategoriyalar
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Mahsulotlar (image_url = ko'rsatish, image_key = S3 fayl yo'li)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    size VARCHAR(20),
    color VARCHAR(50),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    image_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Mijozlar
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    customer_type VARCHAR(20) DEFAULT 'oddiy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Buyurtmalar
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'yangi',
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Buyurtma tarkibi
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- ============================================
--  TEST MA'LUMOTLARI (ixtiyoriy)
-- ============================================

INSERT INTO categories (name) VALUES
('Erkaklar'), ('Bolalar kiyimlari'), ('Yozgi kiyimlar'), ('Oyoq kiyimlar'), ('Sport kiyimlari')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, category_id, size, color, price, stock) VALUES
('Klassik oq ko''ylak', 1, 'M', 'Oq', 250000, 45),
('Jinsi shim', 2, 'L', 'Ko''k', 320000, 30),
('Qishki kurtka', 3, 'XL', 'Qora', 850000, 12),
('Oddiy futbolka', 4, 'S', 'Kulrang', 95000, 120);

INSERT INTO customers (name, phone, email, customer_type) VALUES
('Aziz Karimov', '+998901234567', 'aziz@mail.uz', 'doimiy'),
('Dilnoza Yusupova', '+998935556677', 'dilnoza@mail.uz', 'VIP'),
('Sardor Aliyev', '+998971112233', 'sardor@mail.uz', 'oddiy');

-- Admin parolini SQL bilan QO'SHMANG — `node create-admin.js` orqali xavfsiz yarating.
