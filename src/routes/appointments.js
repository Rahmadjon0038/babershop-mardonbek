const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Navbatga yozilish (ochirit olish)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentRequest'
 *     responses:
 *       201:
 *         description: Navbat yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 *       400:
 *         description: Noto'g'ri so'rov
 *       401:
 *         description: Avtorizatsiya kerak
 *       409:
 *         description: Bu vaqt band
 */
router.post("/", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const { barbershopId } = req.body || {};

  if (!barbershopId) {
    return res.status(400).json({
      xabar: "barbershopId majburiy.",
    });
  }

  // Bugungi sana
  const today = new Date().toISOString().split("T")[0];

  // Birinchi ishchini tanlash (keyinchalik load balancing qilish mumkin)
  const employee = db
    .prepare(
      "SELECT id FROM employees WHERE barbershop_id = ? AND is_active = 1 LIMIT 1"
    )
    .get(barbershopId);

  if (!employee) {
    return res.status(404).json({
      xabar: "Sartaroshxona topilmadi yoki ishchilar yo'q.",
    });
  }

  // Bugungi oxirgi navbat vaqtini olish
  const lastAppointment = db
    .prepare(
      `SELECT appointment_time FROM appointments 
       WHERE barbershop_id = ? 
         AND appointment_date = ?
         AND status != 'cancelled'
       ORDER BY appointment_time DESC 
       LIMIT 1`
    )
    .get(barbershopId, today);

  // Keyingi bo'sh vaqtni hisoblash
  let nextTime;
  if (lastAppointment) {
    const [hours, minutes] = lastAppointment.appointment_time.split(":");
    const lastTime = new Date();
    lastTime.setHours(parseInt(hours), parseInt(minutes) + 30, 0); // 30 daqiqa interval
    nextTime = `${String(lastTime.getHours()).padStart(2, "0")}:${String(lastTime.getMinutes()).padStart(2, "0")}`;
  } else {
    // Birinchi navbat - 09:00 dan boshlash
    nextTime = "09:00";
  }

  // Navbat yaratish
  const insert = db.prepare(
    `INSERT INTO appointments 
      (user_id, barbershop_id, employee_id, appointment_date, appointment_time, status) 
     VALUES (?, ?, ?, ?, ?, 'confirmed')`
  );
  const result = insert.run(
    userId,
    barbershopId,
    employee.id,
    today,
    nextTime
  );

  // Bugungi navbat raqamini hisoblash
  const navbatRaqami = db
    .prepare(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE barbershop_id = ? 
         AND appointment_date = ?
         AND status != 'cancelled'
         AND appointment_time <= ?`
    )
    .get(barbershopId, today, nextTime).count;

  const navbat = db
    .prepare(
      `SELECT 
        a.appointment_date AS sana,
        a.appointment_time AS vaqt,
        b.name AS sartaroshxonaNomi,
        b.address AS manzil
      FROM appointments a
      JOIN barbershops b ON a.barbershop_id = b.id
      WHERE a.id = ?`
    )
    .get(result.lastInsertRowid);

  return res.status(201).json({
    xabar: "Navbatga muvaffaqiyatli yozildingiz.",
    navbat: {
      ...navbat,
      navbatRaqami,
    },
  });
});

/**
 * @swagger
 * /appointments/my:
 *   get:
 *     summary: Mening navbatlarim
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foydalanuvchi navbatlari ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyAppointmentsResponse'
 *       401:
 *         description: Avtorizatsiya kerak
 */
router.get("/my", authMiddleware, (req, res) => {
  const userId = req.user.sub;

  const navbatlar = db
    .prepare(
      `SELECT 
        a.appointment_date AS sana,
        a.appointment_time AS vaqt,
        b.name AS sartaroshxonaNomi,
        b.address AS manzil,
        b.phone AS telefon
      FROM appointments a
      JOIN barbershops b ON a.barbershop_id = b.id
      WHERE a.user_id = ?
        AND a.status != 'cancelled'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`
    )
    .all(userId);

  return res.json({ navbatlar });
});

module.exports = router;
