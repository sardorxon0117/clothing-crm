// ============================================
//  AWS S3 — rasm yuklash/o'chirish
// ============================================
// Admin tanlagan rasm fayli shu modul orqali S3'ga yuklanadi.
// S3 qaytargan URL bazaga (image_url) saqlanadi. Fayl yo'li (key)
// image_key'ga saqlanadi — keyin o'chirish uchun kerak bo'ladi.

require('dotenv').config();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

// AWS sozlangani tekshiriladi — agar kalitlar yo'q bo'lsa, S3 ishlamaydi
// (ilova baribir ishlaydi, faqat rasmsiz).
const s3Configured = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  REGION && BUCKET
);

let s3Client = null;
if (s3Configured) {
  s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  console.log('✅ AWS S3 sozlandi (bucket: ' + BUCKET + ')');
} else {
  console.log('ℹ️  AWS S3 sozlanmagan — rasm yuklash o\u2019chirilgan (kalitlarni .env\u2019ga qo\u2019shing).');
}

// Rasmni S3'ga yuklash → { url, key } qaytaradi
async function uploadToS3(buffer, mimetype) {
  if (!s3Configured) throw new Error('AWS S3 sozlanmagan. .env faylга kalitlarni qo\u2019shing.');

  const ext = (mimetype.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('+xml', '');
  const key = `products/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype
  }));

  // Ommaviy URL (bucket ommaviy o'qishga ruxsat berilgan bo'lishi kerak)
  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return { url, key };
}

// Rasmni S3'dan o'chirish (xato bo'lsa, ilovani to'xtatmaydi)
async function deleteFromS3(key) {
  if (!s3Configured || !key) return;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    console.error('S3 o\u2019chirish xatosi:', e.message);
  }
}

module.exports = { uploadToS3, deleteFromS3, s3Configured };
