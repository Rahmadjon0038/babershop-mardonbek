const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";

function extractAccessToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return "";
  }

  const normalized = authHeader.trim();
  if (!normalized) {
    return "";
  }

  let token = normalized;
  const bearerMatch = normalized.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    token = bearerMatch[1].trim();
  }

  // Swagger/Postman noto'g'ri kiritilgan "Bearer Bearer <token>" holatini ham qo'llab-quvvatlash
  while (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, "").trim();
  }

  // Token qo'shtirnoq bilan yuborilgan bo'lsa tozalash
  token = token.replace(/^"(.*)"$/, "$1").trim();

  return token;
}

function barberMiddleware(req, res, next) {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({
      xabar: "Access token topilmadi. Authorization: Bearer <token> yuboring.",
    });
  }

  try {
    const payload = jwt.verify(token, accessSecret);
    
    if (payload.role !== "barber" && payload.role !== "admin") {
      return res.status(403).json({
        xabar: "Faqat barberlar va adminlar kirishi mumkin.",
      });
    }
    
    const normalizedUserId = payload.sub ?? payload.id;
    if (!normalizedUserId) {
      return res.status(401).json({
        xabar: "Access token ichida foydalanuvchi ID topilmadi.",
      });
    }

    req.user = {
      ...payload,
      sub: normalizedUserId,
      id: normalizedUserId,
      userId: normalizedUserId,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      xabar: "Access token yaroqsiz yoki muddati tugagan.",
    });
  }
}

module.exports = barberMiddleware;
