const express = require("express");
const db = require("../db");
const barberMiddleware = require("../middleware/barber");
const { getUzbekistanDate, getUzbekistanDateTime } = require("../utils/timezone");

const router = express.Router();

/**
 * @swagger
 * /barber/barbershop:
 *   get:
 *     summary: O'z sartaroshxonasi ma'lumotlari
 *     tags: [Barber]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sartaroshxona ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BarberBarbershopResponse'
 *       403:
 *         description: Faqat barberlar
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.get("/barbershop", barberMiddleware, (req, res) => {
  const userId = req.user.id;

  const sartaroshxona = db
    .prepare(
      `SELECT 
        id,
        name AS nomi,
        image AS rasm,
        address AS manzil,
        phone AS telefon,
        description AS malumot,
        price AS narx,
        opening_time AS ochilishVaqti,
        closing_time AS yopilishVaqti
      FROM barbershops 
      WHERE owner_id = ? AND is_active = 1`
    )
    .get(userId);

  if (!sartaroshxona) {
    return res.status(404).json({ xabar: "Sizning sartaroshxonangiz topilmadi." });
  }

  return res.json({ sartaroshxona });
});

/**
 * @swagger
 * /barber/barbershop:
 *   put:
 *     summary: O'z sartaroshxonasini tahrirlash
 *     tags: [Barber]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomi: { type: string, description: "Nomi" }
 *               rasm: { type: string, description: "Rasm URL" }
 *               manzil: { type: string, description: "Manzil" }
 *               telefon: { type: string, description: "Telefon" }
 *               malumot: { type: string, description: "Tavsif" }
 *               narx: { type: integer, description: "Narx" }
 *               ochilishVaqti: { type: string, description: "Ochilish vaqti" }
 *               yopilishVaqti: { type: string, description: "Yopilish vaqti" }
 *     responses:
 *       200:
 *         description: Yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 xabar: { type: string }
 *                 sartaroshxona: { type: object }
 *       403:
 *         description: Faqat barberlar
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.put("/barbershop", barberMiddleware, (req, res) => {
  const userId = req.user.id;
  const updates = req.body || {};

  if (updates.narx !== undefined && (Number.isNaN(Number(updates.narx)) || Number(updates.narx) <= 0)) {
    return res.status(400).json({
      xabar: "Narx musbat son bo'lishi kerak.",
    });
  }

  const sartaroshxona = db
    .prepare("SELECT id FROM barbershops WHERE owner_id = ? AND is_active = 1")
    .get(userId);

  if (!sartaroshxona) {
    return res.status(404).json({ xabar: "Sizning sartaroshxonangiz topilmadi." });
  }

  const fields = [];
  const values = [];

  if (updates.nomi) {
    fields.push("name = ?");
    values.push(updates.nomi);
  }
  if (updates.rasm !== undefined) {
    fields.push("image = ?");
    values.push(updates.rasm);
  }
  if (updates.manzil) {
    fields.push("address = ?");
    values.push(updates.manzil);
  }
  if (updates.telefon) {
    fields.push("phone = ?");
    values.push(updates.telefon);
  }
  if (updates.malumot !== undefined) {
    fields.push("description = ?");
    values.push(updates.malumot);
  }
  if (updates.narx !== undefined) {
    fields.push("price = ?");
    values.push(Number(updates.narx));
  }
  if (updates.ochilishVaqti) {
    fields.push("opening_time = ?");
    values.push(updates.ochilishVaqti);
  }
  if (updates.yopilishVaqti) {
    fields.push("closing_time = ?");
    values.push(updates.yopilishVaqti);
  }

  if (fields.length === 0) {
    return res.status(400).json({ xabar: "Yangilanish uchun maydon yo'q." });
  }

  values.push(sartaroshxona.id);
  const query = `UPDATE barbershops SET ${fields.join(", ")} WHERE id = ?`;
  db.prepare(query).run(...values);

  const yangilangan = db
    .prepare(
      `SELECT 
        id,
        name AS nomi,
        image AS rasm,
        address AS manzil,
        phone AS telefon,
        description AS malumot,
        price AS narx,
        opening_time AS ochilishVaqti,
        closing_time AS yopilishVaqti
      FROM barbershops WHERE id = ?`
    )
    .get(sartaroshxona.id);

  return res.json({
    xabar: "Sartaroshxona yangilandi.",
    sartaroshxona: yangilangan,
  });
});

/**
 * @swagger
 * /barber/appointments:
 *   get:
 *     summary: O'z sartaroshxonasiga yozilgan navbatlar
 *     tags: [Barber]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Sana (YYYY-MM-DD), default bugun
 *         example: "2026-02-03"
 *     responses:
 *       200:
 *         description: Navbatlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BarberAppointmentsResponse'
 *       403:
 *         description: Faqat barberlar
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.get("/appointments", barberMiddleware, (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;
  const targetDate = date || getUzbekistanDate();

  const sartaroshxona = db
    .prepare("SELECT id FROM barbershops WHERE owner_id = ? AND is_active = 1")
    .get(userId);

  if (!sartaroshxona) {
    return res.status(404).json({ xabar: "Sizning sartaroshxonangiz topilmadi." });
  }

  const navbatlar = db
    .prepare(
      `SELECT 
        a.id,
        a.appointment_time AS vaqt,
        a.status AS holat,
        a.completed_at AS tugatilganVaqt,
        u.phone AS telefon,
        u.name AS ism,
        e.name AS ishchiNomi
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN employees e ON a.employee_id = e.id
      WHERE a.barbershop_id = ? 
        AND DATE(a.appointment_date) = ?
      ORDER BY a.appointment_time`
    )
    .all(sartaroshxona.id, targetDate);

  return res.json({ sana: targetDate, navbatlar });
});

/**
 * @swagger
 * /barber/appointments/{id}/complete:
 *   put:
 *     summary: Navbatni tugatish (soch olindi)
 *     tags: [Barber]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Navbat ID
 *     responses:
 *       200:
 *         description: Navbat tugatildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 xabar: { type: string, example: "Navbat tugatildi (soch olindi)." }
 *       403:
 *         description: Faqat barberlar yoki ruxsat yo'q
 *       404:
 *         description: Navbat topilmadi
 */
router.put("/appointments/:id/complete", barberMiddleware, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { id } = req.params;

  const navbat = db
    .prepare(
      `SELECT a.id, a.status, b.owner_id
       FROM appointments a
       JOIN barbershops b ON b.id = a.barbershop_id
       WHERE a.id = ? AND b.is_active = 1`
    )
    .get(id);

  if (!navbat) {
    return res.status(404).json({ xabar: "Navbat topilmadi." });
  }

  if (userRole !== "admin" && Number(navbat.owner_id) !== Number(userId)) {
    return res.status(403).json({ xabar: "Ruxsat yo'q." });
  }

  if (navbat.status === "completed") {
    return res.status(400).json({ xabar: "Bu navbat allaqachon tugatilgan." });
  }

  const now = getUzbekistanDateTime();
  db.prepare(
    "UPDATE appointments SET status = 'completed', completed_at = ? WHERE id = ?"
  ).run(now, id);

  return res.json({ xabar: "Navbat tugatildi (soch olindi)." });
});

/**
 * @swagger
 * /barber/appointments/{id}/move-tomorrow:
 *   put:
 *     summary: Navbatni ertaga ko'chirish
 *     tags: [Barber]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Navbat ID
 *     responses:
 *       200:
 *         description: Ertaga ko'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 xabar: { type: string, example: "Navbat ertangi kunga ko'chirildi." }
 *                 yangiSana: { type: string, example: "2026-02-04" }
 *       403:
 *         description: Faqat barberlar yoki ruxsat yo'q
 *       404:
 *         description: Navbat topilmadi
 */
router.put("/appointments/:id/move-tomorrow", barberMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const sartaroshxona = db
    .prepare("SELECT id FROM barbershops WHERE owner_id = ? AND is_active = 1")
    .get(userId);

  if (!sartaroshxona) {
    return res.status(403).json({ xabar: "Ruxsat yo'q." });
  }

  const navbat = db
    .prepare("SELECT * FROM appointments WHERE id = ? AND barbershop_id = ?")
    .get(id, sartaroshxona.id);

  if (!navbat) {
    return res.status(404).json({ xabar: "Navbat topilmadi." });
  }

  // Ertangi sanani hisoblash
  const tomorrowDate = getUzbekistanDate(1);

  db.prepare(
    "UPDATE appointments SET appointment_date = ?, status = 'rescheduled' WHERE id = ?"
  ).run(tomorrowDate, id);

  return res.json({
    xabar: "Navbat ertangi kunga ko'chirildi.",
    yangiSana: tomorrowDate,
  });
});

/**
 * @swagger
 * /barber/appointments/history:
 *   get:
 *     summary: Navbatlar tarixi
 *     tags: [Barber]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Necha kunlik tarix (default 7)
 *         example: 7
 *     responses:
 *       200:
 *         description: Tarix
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BarberHistoryResponse'
 *       403:
 *         description: Faqat barberlar
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.get("/appointments/history", barberMiddleware, (req, res) => {
  const userId = req.user.id;
  const { days = 7 } = req.query;
  const parsedDays = Number.parseInt(days, 10);
  const normalizedDays = Math.max(0, Number.isNaN(parsedDays) ? 7 : parsedDays);

  const sartaroshxona = db
    .prepare("SELECT id FROM barbershops WHERE owner_id = ? AND is_active = 1")
    .get(userId);

  if (!sartaroshxona) {
    return res.status(404).json({ xabar: "Sizning sartaroshxonangiz topilmadi." });
  }

  const tarix = db
    .prepare(
      `SELECT 
        a.appointment_date AS sana,
        a.appointment_time AS vaqt,
        a.status AS holat,
        a.completed_at AS tugatilganVaqt,
        u.phone AS telefon,
        u.name AS ism
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      WHERE a.barbershop_id = ? 
        AND DATE(a.appointment_date) >= ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`
    )
    .all(
      sartaroshxona.id,
      getUzbekistanDate(-normalizedDays)
    );

  return res.json({ tarix });
});

module.exports = router;
