// ============================================
//  HIMOYA (Authentication Middleware)
// ============================================
// Bu funksiya har bir himoyalangan sahifadan oldin ishlaydi.
// Agar admin login qilmagan bo'lsa, uni login sahifasiga qaytaradi.

function requireLogin(req, res, next) {
  if (req.session && req.session.adminId) {
    // Login qilingan — davom etamiz
    return next();
  }
  // Login qilinmagan — login sahifasiga yo'naltiramiz
  return res.redirect('/login');
}

module.exports = { requireLogin };
