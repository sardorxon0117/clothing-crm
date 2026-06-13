# Stil Savdo — CRM tizimi

Kiyim-kechak do'koni uchun professional CRM. Node.js + Express + PostgreSQL (Neon), AWS S3'ga tayyor.

## Imkoniyatlar

- 🔐 Admin login (parol bcrypt bilan shifrlanadi)
- 📊 Dashboard — KPI kartalar va savdo grafigi
- 👥 Mijozlar — qo'shish/tahrirlash/o'chirish, qidiruv
- 👕 Mahsulotlar — kategoriya, o'lcham, rang, narx, ombor, rasm
- 🧾 Buyurtmalar — bir nechta mahsulot, avtomatik summa, ombordan ayirish
- 📈 Hisobotlar — top mahsulotlar, faol mijozlar, kategoriya bo'yicha savdo
- ⚙️ Parolni o'zgartirish

---

## 1. O'rnatish (lokalda)

```bash
# Modullarni o'rnatish
npm install
```

## 2. Bazani sozlash

1. [Neon.tech](https://neon.tech)'da loyiha yarating
2. `schema.sql` faylidagi SQL'ni Neon SQL Editor'da ishga tushiring
3. Neon'dan **Connection String**'ni oling

## 3. Muhit o'zgaruvchilari

`.env.example` faylini nusxalab `.env` deb nomlang va to'ldiring:

```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
SESSION_SECRET=uzun-tasodifiy-matn
PORT=8080
```

## 4. Admin yaratish

`create-admin.js` faylida login/parolni o'zgartiring, keyin:

```bash
node create-admin.js
```

## 5. Ishga tushirish

```bash
npm start
```

Brauzerda oching: **http://localhost:8080**

---

## Render'ga deploy qilish

1. Kodni GitHub'ga yuklang (`.env` yuklanmaydi — `.gitignore`'da bor)
2. [Render.com](https://render.com)'da **New + → Web Service**
3. GitHub repozitoriyangizni ulang
4. Sozlamalar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** `DATABASE_URL`, `SESSION_SECRET`
5. **Create Web Service** — 3-5 daqiqada tayyor

> ⚠️ Birinchi marta deploy bo'lgach, adminni yaratish uchun Render'ning **Shell** bo'limida `node create-admin.js` ni ishga tushiring (yoki lokalda bir marta ishga tushiring — baza umumiy).

---

## Texnik tafsilotlar

| Qatlam | Texnologiya |
|--------|-------------|
| Backend | Node.js + Express |
| Baza | PostgreSQL (Neon) |
| Sahifalar | EJS shablonlar |
| Auth | bcrypt + express-session |
| Sessiya saqlash | connect-pg-simple (bazada — load balancing'ga mos) |
| Grafiklar | Chart.js |

### Loyiha tuzilishi

```
clothing-crm/
├── server.js           # asosiy server
├── db.js               # bazaga ulanish
├── create-admin.js     # admin yaratish skripti
├── schema.sql          # baza sxemasi
├── middleware/auth.js  # himoya
├── routes/             # sahifalar mantig'i
├── views/              # EJS shablonlar
└── public/             # CSS, statik fayllar
```

## AWS S3 — rasm yuklash sozlamasi

Rasm yuklash ishlashi uchun AWS S3 bucket kerak. Bir martalik sozlash:

**1. Bucket yaratish**
- AWS konsolida **S3 → Create bucket**
- Nom bering (masalan `stil-savdo-rasmlar`), Region: **eu-central-1** (Frankfurt)
- "Block all public access" ni **o'chiring** (rasmlar saytda ko'rinishi uchun) va tasdiqlang

**2. Bucket policy (ommaviy o'qish)**
Bucket → Permissions → Bucket policy, quyidagini qo'ying (`BUCKET_NOMI` ni almashtiring):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::BUCKET_NOMI/*"
  }]
}
```

**3. IAM user (kalitlar olish)**
- **IAM → Users → Create user**
- Permissions: **AmazonS3FullAccess** (yoki faqat shu bucket'ga ruxsat)
- User → Security credentials → **Create access key** → "Application running outside AWS"
- **Access key** va **Secret key**'ni saqlang

**4. `.env`ga qo'shish**
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
AWS_S3_BUCKET=stil-savdo-rasmlar
```

Serverni qayta ishga tushiring. Endi mahsulot formasida "Rasm tanlash" orqali to'g'ridan-to'g'ri yuklash ishlaydi — rasm S3'ga ketadi, sayt uni ko'rsatadi.

> Render'ga deploy qilganda ham xuddi shu 4 ta o'zgaruvchini Render'ning Environment bo'limiga qo'shing.
# clothing-crm
