const express = require("express");
const db = require("../db");

const router = express.Router();

/**
 * @swagger
 * /barbershops:
 *   get:
 *     summary: Sartaroshxonalar ro'yxati
 *     tags: [Barbershops]
 *     responses:
 *       200:
 *         description: Sartaroshxonalar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sartaroshxonalar:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BarbershopSummary'
 */
router.get("/", (req, res) => {
  const sartaroshxonalar = db
    .prepare(
      `SELECT 
        id, 
        name AS nomi, 
        image AS rasm, 
        address AS manzil, 
        phone AS telefon,
        price AS narx, 
        opening_time AS ochilishVaqti,
        closing_time AS yopilishVaqti
      FROM barbershops
      WHERE is_active = 1`
    )
    .all();

  return res.json({ sartaroshxonalar });
});

/**
 * @swagger
 * /barbershops/{id}:
 *   get:
 *     summary: Sartaroshxona to'liq ma'lumotlari
 *     tags: [Barbershops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sartaroshxona batafsil ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BarbershopDetail'
 *       404:
 *         description: Topilmadi
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const barbershop = db
    .prepare(
      `SELECT 
        id, 
        name AS nomi, 
        image AS rasm, 
        address AS manzil, 
        phone AS telefon,
        price AS narx, 
        opening_time AS ochilishVaqti,
        closing_time AS yopilishVaqti,
        description AS malumot
      FROM barbershops
      WHERE id = ? AND is_active = 1`
    )
    .get(id);

  if (!barbershop) {
    return res.status(404).json({ xabar: "Sartaroshxona topilmadi." });
  }

  // Ishchilar soni
  const employeesCount = db
    .prepare(
      `SELECT COUNT(*) as count 
       FROM employees 
       WHERE barbershop_id = ? AND is_active = 1`
    )
    .get(id).count;

  // Ish kunlari va vaqtlari
  const workingHours = db
    .prepare(
      `SELECT 
        day_of_week AS kun,
        opening_time AS ochilishVaqti,
        closing_time AS yopilishVaqti,
        is_day_off AS damKuni
      FROM working_hours
      WHERE barbershop_id = ?
      ORDER BY 
        CASE day_of_week
          WHEN 'Dushanba' THEN 1
          WHEN 'Seshanba' THEN 2
          WHEN 'Chorshanba' THEN 3
          WHEN 'Payshanba' THEN 4
          WHEN 'Juma' THEN 5
          WHEN 'Shanba' THEN 6
          WHEN 'Yakshanba' THEN 7
        END`
    )
    .all(id);

  // Bugungi navbatlar
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = db
    .prepare(
      `SELECT 
        u.phone AS telefon,
        u.name AS ism,
        a.appointment_time AS navbatVaqti
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN employees e ON a.employee_id = e.id
      WHERE a.barbershop_id = ? 
        AND DATE(a.appointment_date) = ?
        AND a.status != 'cancelled'
      ORDER BY a.appointment_time`
    )
    .all(id, today);

  // Navbat raqamlarini qo'shish
  const navbatlarRaqamBilan = todayAppointments.map((item, index) => ({
    ...item,
    navbatRaqami: index + 1,
  }));

  return res.json({
    sartaroshxona: {
      ...barbershop,
      ishchilarSoni: employeesCount,
      ishVaqtlari: workingHours,
      bugungiNavbatlar: navbatlarRaqamBilan || [],
    },
  });
});

module.exports = router;
