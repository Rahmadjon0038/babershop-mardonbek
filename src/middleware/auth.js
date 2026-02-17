const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

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
