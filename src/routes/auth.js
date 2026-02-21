const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { extractRefreshToken } = require("../utils/token");

const router = express.Router();

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

function createTokens(user) {
  const payload = { sub: user.id, phone: user.phone, role: user.role || "user" };
  const accessToken = jwt.sign(payload, accessSecret, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Foydalanuvchi ro'yxatdan o'tkazish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Ro'yxatdan o'tdi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Noto'g'ri so'rov
 *       409:
 *         description: Username band
 */
router.post("/register", (req, res) => {
  const { phone, name, password } = req.body || {};

  if (!phone || !name || !password) {
    return res.status(400).json({
      xabar: "phone, name va password majburiy.",
    });
  }

  const existing = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);

  if (existing) {
    return res.status(409).json({
      xabar: "Bu telefon raqam allaqachon ro'yxatdan o'tgan.",
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const insert = db.prepare(
    "INSERT INTO users (phone, name, password_hash) VALUES (?, ?, ?)"
  );
  const result = insert.run(phone, name, passwordHash);

  const foydalanuvchi = db
    .prepare(
      "SELECT id, phone, name, created_at AS yaratilganVaqt FROM users WHERE id = ?"
    )
    .get(result.lastInsertRowid);

  return res.status(201).json({
    xabar: "Muvaffaqiyatli ro'yxatdan o'tdi.",
    foydalanuvchi,
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login qilish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Tokenlar qaytarildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Username yoki password xato
 */
router.post("/login", (req, res) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({
      xabar: "phone va password majburiy.",
    });
  }

  const user = db
    .prepare(
      "SELECT id, phone, name, role, password_hash AS passwordHash FROM users WHERE phone = ?"
    )
    .get(phone);

  if (!user) {
    return res.status(401).json({
      xabar: "Telefon raqam yoki password noto'g'ri.",
    });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({
      xabar: "Telefon raqam yoki password noto'g'ri.",
    });
  }

  const tokens = createTokens(user);
  return res.json({
    xabar: "Muvaffaqiyatli login qildingiz.",
    kirishToken: tokens.accessToken,
    yangilanishToken: tokens.refreshToken,
    foydalanuvchi: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role || "user",
    },
  });
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh token orqali yangi tokenlar olish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokenlar yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       400:
 *         description: Refresh token yuborilmagan
 *       401:
 *         description: Refresh token yaroqsiz yoki muddati tugagan
 */
router.post("/refresh", (req, res) => {
  const refreshToken = extractRefreshToken(req);

  if (!refreshToken) {
    return res.status(400).json({
      xabar: "Refresh token yuboring.",
    });
  }

  try {
    const payload = jwt.verify(refreshToken, refreshSecret);
    const userId = Number(payload && payload.sub);

    if (!userId) {
      return res.status(401).json({
        xabar: "Refresh token yaroqsiz.",
      });
    }

    const user = db
      .prepare("SELECT id, phone, role FROM users WHERE id = ?")
      .get(userId);

    if (!user) {
      return res.status(401).json({
        xabar: "Foydalanuvchi topilmadi.",
      });
    }

    const tokens = createTokens(user);
    return res.json({
      xabar: "Tokenlar yangilandi.",
      kirishToken: tokens.accessToken,
      yangilanishToken: tokens.refreshToken,
    });
  } catch (error) {
    return res.status(401).json({
      xabar: "Refresh token yaroqsiz yoki muddati tugagan.",
    });
  }
});

module.exports = router;
