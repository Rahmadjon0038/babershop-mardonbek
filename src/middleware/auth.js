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

  const bearerMatch = normalized.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1].trim();
  }

  return normalized;
}

function authMiddleware(req, res, next) {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({
      xabar: "Access token topilmadi. Authorization: Bearer <token> yuboring.",
    });
  }

  try {
    const payload = jwt.verify(token, accessSecret);
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

module.exports = authMiddleware;
