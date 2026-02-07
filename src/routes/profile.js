const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Profil ma'lumotlarini olish
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Avtorizatsiya kerak
 */
router.get("/", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const foydalanuvchi = db
    .prepare(
      "SELECT id, phone, name, role, created_at AS yaratilganVaqt FROM users WHERE id = ?"
    )
    .get(userId);

  if (!foydalanuvchi) {
    return res.status(404).json({ xabar: "Foydalanuvchi topilmadi." });
  }

  return res.json({ foydalanuvchi });
});

module.exports = router;
