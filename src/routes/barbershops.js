const express = require("express");
const db = require("../db");
const adminMiddleware = require("../middleware/admin");
const barberMiddleware = require("../middleware/barber");

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
 * /barbershops/my-shop:
 *   put:
 *     summary: O'z sartaroshxonam ma'lumotlarini yangilash
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomi:
 *                 type: string
 *                 example: "Yangi Zarafshon Barbershop"
 *               rasm:
 *                 type: string
 *                 example: "https://example.com/new-image.jpg"
 *               manzil:
 *                 type: string
 *                 example: "Toshkent shahar, Mirzo Ulugbek tumani"
 *               telefon:
 *                 type: string
 *                 example: "+998901234567"
 *               malumot:
 *                 type: string
 *                 example: "Eng zamonaviy sartaroshxona"
 *               narx:
 *                 type: integer
 *                 example: 60000
 *               ochilishVaqti:
 *                 type: string
 *                 example: "08:00"
 *               yopilishVaqti:
 *                 type: string
 *                 example: "21:00"
 *     responses:
 *       200:
 *         description: Ma'lumotlar muvaffaqiyatli yangilandi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.put("/my-shop", barberMiddleware, (req, res) => {
  // O'z sartaroshxonasini topish
  const myShop = db
    .prepare("SELECT * FROM barbershops WHERE owner_id = ? AND is_active = 1")
    .get(req.user.id);

  if (!myShop) {
    return res.status(404).json({
      xabar: "Sizning sartaroshxonangiz topilmadi."
    });
  }

  const {
    nomi,
    rasm,
    manzil,
    telefon,
    malumot,
    narx,
    ochilishVaqti,
    yopilishVaqti,
  } = req.body;

  // Hech bo'lmaganda bitta maydon yuborilgan bo'lishi kerak
  if (!nomi && !rasm && !manzil && !telefon && !malumot && 
      narx === undefined && !ochilishVaqti && !yopilishVaqti) {
    return res.status(400).json({
      xabar: "Yangilanishi uchun hech bo'lmaganda bitta maydon kiritilishi kerak."
    });
  }

  // Narx tekshiruvi (agar yuborilgan bo'lsa)
  if (narx !== undefined && (isNaN(narx) || parseInt(narx) <= 0)) {
    return res.status(400).json({
      xabar: "Narx musbat son bo'lishi kerak."
    });
  }

  // Vaqt formatini tekshirish (agar yuborilgan bo'lsa)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (ochilishVaqti && !timeRegex.test(ochilishVaqti)) {
    return res.status(400).json({
      xabar: "Ochilish vaqti formati noto'g'ri. HH:MM formatida kiriting."
    });
  }
  if (yopilishVaqti && !timeRegex.test(yopilishVaqti)) {
    return res.status(400).json({
      xabar: "Yopilish vaqti formati noto'g'ri. HH:MM formatida kiriting."
    });
  }

  // Telefon formatini tekshirish (agar yuborilgan bo'lsa)
  const phoneRegex = /^\+998[0-9]{9}$/;
  if (telefon && !phoneRegex.test(telefon)) {
    return res.status(400).json({
      xabar: "Telefon raqam formati noto'g'ri. +998XXXXXXXXX formatida kiriting."
    });
  }

  try {
    // Yangilanishi kerak bo'lgan maydonlarni aniqlash
    const updateFields = [];
    const updateValues = [];

    if (nomi !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(nomi);
    }
    if (rasm !== undefined) {
      updateFields.push("image = ?");
      updateValues.push(rasm);
    }
    if (manzil !== undefined) {
      updateFields.push("address = ?");
      updateValues.push(manzil);
    }
    if (telefon !== undefined) {
      updateFields.push("phone = ?");
      updateValues.push(telefon);
    }
    if (malumot !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(malumot);
    }
    if (narx !== undefined) {
      updateFields.push("price = ?");
      updateValues.push(parseInt(narx));
    }
    if (ochilishVaqti !== undefined) {
      updateFields.push("opening_time = ?");
      updateValues.push(ochilishVaqti);
    }
    if (yopilishVaqti !== undefined) {
      updateFields.push("closing_time = ?");
      updateValues.push(yopilishVaqti);
    }

    // Sartaroshxonani yangilash
    const updateQuery = `
      UPDATE barbershops 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    updateValues.push(myShop.id);

    const updateStmt = db.prepare(updateQuery);
    updateStmt.run(...updateValues);

    // Agar ish vaqtlari o'zgarsa, working_hours jadvalini ham yangilash
    if (ochilishVaqti !== undefined || yopilishVaqti !== undefined) {
      const newOpeningTime = ochilishVaqti || myShop.opening_time;
      const newClosingTime = yopilishVaqti || myShop.closing_time;

      // Faqat ish kunlarini yangilash (dam kunlarini emas)
      const updateWorkingHoursStmt = db.prepare(`
        UPDATE working_hours 
        SET opening_time = ?, closing_time = ?
        WHERE barbershop_id = ? AND is_day_off = 0
      `);
      
      updateWorkingHoursStmt.run(newOpeningTime, newClosingTime, myShop.id);
    }

    return res.json({
      xabar: "Sartaroshxona ma'lumotlari muvaffaqiyatli yangilandi."
    });

  } catch (error) {
    console.error("Sartaroshxona ma'lumotlarini yangilashda xato:", error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        xabar: "Bu telefon raqami bilan boshqa sartaroshxona allaqachon mavjud."
      });
    }
    
    return res.status(500).json({
      xabar: "Sartaroshxona ma'lumotlarini yangilashda server xatosi yuz berdi."
    });
  }
});

/**
 * @swagger
 * /barbershops/{id}/employees:
 *   post:
 *     summary: Sartaroshxonaga ishchi qo'shish
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ism
 *             properties:
 *               ism:
 *                 type: string
 *                 example: "Aziz Karimov"
 *     responses:
 *       201:
 *         description: Ishchi muvaffaqiyatli qo'shildi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.post("/:id/employees", barberMiddleware, (req, res) => {
  const { id } = req.params;
  const { ism } = req.body;

  if (!ism || ism.trim() === '') {
    return res.status(400).json({
      xabar: "Ishchi ismi kiritilishi shart."
    });
  }

  // Sartaroshxonani tekshirish va egalikning huquqini tekshirish
  const barbershop = db
    .prepare("SELECT * FROM barbershops WHERE id = ? AND is_active = 1")
    .get(id);

  if (!barbershop) {
    return res.status(404).json({
      xabar: "Sartaroshxona topilmadi."
    });
  }

  // Faqat ega yoki admin qo'sha oladi
  if (barbershop.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      xabar: "Faqat sartaroshxona egasi yoki admin ishchi qo'sha oladi."
    });
  }

  try {
    const addEmployeeStmt = db.prepare(`
      INSERT INTO employees (barbershop_id, name) VALUES (?, ?)
    `);
    
    const result = addEmployeeStmt.run(id, ism.trim());

    return res.status(201).json({
      xabar: "Ishchi muvaffaqiyatli qo'shildi.",
      ishchiId: result.lastInsertRowid
    });

  } catch (error) {
    console.error("Ishchi qo'shishda xato:", error);
    return res.status(500).json({
      xabar: "Ishchi qo'shishda server xatosi yuz berdi."
    });
  }
});

/**
 * @swagger
 * /barbershops/{id}/working-hours:
 *   put:
 *     summary: Ish vaqtlarini yangilash
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ishVaqtlari
 *             properties:
 *               ishVaqtlari:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     kun:
 *                       type: string
 *                       example: "Dushanba"
 *                     ochilishVaqti:
 *                       type: string
 *                       example: "09:00"
 *                     yopilishVaqti:
 *                       type: string
 *                       example: "20:00"
 *                     damKuni:
 *                       type: integer
 *                       example: 0
 *     responses:
 *       200:
 *         description: Ish vaqtlari muvaffaqiyatli yangilandi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.put("/:id/working-hours", barberMiddleware, (req, res) => {
  const { id } = req.params;
  const { ishVaqtlari } = req.body;

  // Sartaroshxonani tekshirish
  const barbershop = db
    .prepare("SELECT * FROM barbershops WHERE id = ? AND is_active = 1")
    .get(id);

  if (!barbershop) {
    return res.status(404).json({
      xabar: "Sartaroshxona topilmadi."
    });
  }

  // Faqat ega yoki admin o'zgartira oladi
  if (barbershop.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      xabar: "Faqat sartaroshxona egasi yoki admin ish vaqtlarini o'zgartira oladi."
    });
  }

  if (!Array.isArray(ishVaqtlari) || ishVaqtlari.length === 0) {
    return res.status(400).json({
      xabar: "Ish vaqtlari massivi kiritilishi shart."
    });
  }

  // Hafta kunlarini tekshirish
  const validDays = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

  for (const vaqt of ishVaqtlari) {
    if (!validDays.includes(vaqt.kun)) {
      return res.status(400).json({
        xabar: `Noto'g'ri hafta kuni: ${vaqt.kun}`
      });
    }

    if (!vaqt.damKuni) {
      if (!vaqt.ochilishVaqti || !vaqt.yopilishVaqti) {
        return res.status(400).json({
          xabar: `${vaqt.kun} uchun ochilish va yopilish vaqtlari kiritilishi shart.`
        });
      }

      if (!timeRegex.test(vaqt.ochilishVaqti) || !timeRegex.test(vaqt.yopilishVaqti)) {
        return res.status(400).json({
          xabar: `${vaqt.kun} uchun vaqt formati noto'g'ri. HH:MM formatida kiriting.`
        });
      }
    }
  }

  try {
    // Eski ish vaqtlarini o'chirish
    const deleteStmt = db.prepare("DELETE FROM working_hours WHERE barbershop_id = ?");
    deleteStmt.run(id);

    // Yangi ish vaqtlarini qo'shish
    const insertStmt = db.prepare(`
      INSERT INTO working_hours (
        barbershop_id, day_of_week, opening_time, closing_time, is_day_off
      ) VALUES (?, ?, ?, ?, ?)
    `);

    ishVaqtlari.forEach(vaqt => {
      const isDayOff = vaqt.damKuni ? 1 : 0;
      insertStmt.run(
        id,
        vaqt.kun,
        isDayOff ? null : vaqt.ochilishVaqti,
        isDayOff ? null : vaqt.yopilishVaqti,
        isDayOff
      );
    });

    return res.json({
      xabar: "Ish vaqtlari muvaffaqiyatli yangilandi."
    });

  } catch (error) {
    console.error("Ish vaqtlarini yangilashda xato:", error);
    return res.status(500).json({
      xabar: "Ish vaqtlarini yangilashda server xatosi yuz berdi."
    });
  }
});

/**
 * @swagger
 * /barbershops/{id}/employees:
 *   get:
 *     summary: Sartaroshxona ishchilarini ko'rish
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ishchilar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ishchilar:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       ism:
 *                         type: string
 *                       faol:
 *                         type: boolean
 *                       yaratilganVaqt:
 *                         type: string
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.get("/:id/employees", barberMiddleware, (req, res) => {
  const { id } = req.params;
  const shopId = Number(id);

  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({
      xabar: "Sartaroshxona ID noto'g'ri."
    });
  }

  // Sartaroshxonani tekshirish
  const barbershop = db
    .prepare("SELECT * FROM barbershops WHERE id = ? AND is_active = 1")
    .get(shopId);

  if (!barbershop) {
    return res.status(404).json({
      xabar: "Sartaroshxona topilmadi."
    });
  }

  // Faqat ega yoki admin ko'ra oladi
  if (barbershop.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      xabar: "Faqat sartaroshxona egasi yoki admin ishchilarni ko'ra oladi."
    });
  }

  try {
    const employees = db
      .prepare(`
        SELECT 
          id,
          name AS ism,
          is_active AS faol,
          created_at AS yaratilganVaqt
        FROM employees 
        WHERE barbershop_id = ? AND is_active = 1
        ORDER BY created_at DESC
      `)
      .all(shopId);

    const normalizedEmployees = employees.map((employee) => ({
      ...employee,
      faol: Boolean(employee.faol),
    }));

    return res.json({ ishchilar: normalizedEmployees });

  } catch (error) {
    console.error("Ishchilarni olishda xato:", error);
    return res.status(500).json({
      xabar: "Ishchilarni olishda server xatosi yuz berdi."
    });
  }
});

/**
 * @swagger
 * /barbershops/{id}/employees/{employeeId}:
 *   delete:
 *     summary: Ishchini o'chirish (faolligini to'xtatish)
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ishchi muvaffaqiyatli o'chirildi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Sartaroshxona yoki ishchi topilmadi
 */
router.delete("/:id/employees/:employeeId", barberMiddleware, (req, res) => {
  const { id, employeeId } = req.params;
  const shopId = Number(id);
  const staffId = Number(employeeId);

  if (!Number.isInteger(shopId) || shopId <= 0) {
    return res.status(400).json({
      xabar: "Sartaroshxona ID noto'g'ri."
    });
  }

  if (!Number.isInteger(staffId) || staffId <= 0) {
    return res.status(400).json({
      xabar: "Ishchi ID noto'g'ri."
    });
  }

  // Sartaroshxonani tekshirish
  const barbershop = db
    .prepare("SELECT * FROM barbershops WHERE id = ? AND is_active = 1")
    .get(shopId);

  if (!barbershop) {
    return res.status(404).json({
      xabar: "Sartaroshxona topilmadi."
    });
  }

  // Faqat ega yoki admin o'chira oladi
  if (barbershop.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      xabar: "Faqat sartaroshxona egasi yoki admin ishchini o'chira oladi."
    });
  }

  // Ishchini tekshirish
  const employee = db
    .prepare("SELECT * FROM employees WHERE id = ? AND barbershop_id = ? AND is_active = 1")
    .get(staffId, shopId);

  if (!employee) {
    return res.status(404).json({
      xabar: "Ishchi topilmadi."
    });
  }

  try {
    // Ishchini faollikdan chiqarish (o'chirmasdan)
    const updateStmt = db.prepare(`
      UPDATE employees 
      SET is_active = 0 
      WHERE id = ? AND barbershop_id = ?
    `);
    
    updateStmt.run(staffId, shopId);

    return res.json({
      xabar: "Ishchi muvaffaqiyatli o'chirildi."
    });

  } catch (error) {
    console.error("Ishchini o'chirishda xato:", error);
    return res.status(500).json({
      xabar: "Ishchini o'chirishda server xatosi yuz berdi."
    });
  }
});

/**
 * @swagger
 * /barbershops/my-shop:
 *   get:
 *     summary: O'z sartaroshxonam haqida ma'lumot
 *     tags: [Barbershops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sartaroshxona ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BarbershopDetail'
 *       404:
 *         description: Sartaroshxona topilmadi
 */
router.get("/my-shop", barberMiddleware, (req, res) => {
  const myShop = db
    .prepare(`
      SELECT 
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
      WHERE owner_id = ? AND is_active = 1
    `)
    .get(req.user.id);

  if (!myShop) {
    return res.status(404).json({ 
      xabar: "Sizning sartaroshxonangiz topilmadi." 
    });
  }

  // Ishchilar soni
  const employeesCount = db
    .prepare(
      `SELECT COUNT(*) as count 
       FROM employees 
       WHERE barbershop_id = ? AND is_active = 1`
    )
    .get(myShop.id).count;

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
    .all(myShop.id);

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
    .all(myShop.id, today);

  // Navbat raqamlarini qo'shish
  const navbatlarRaqamBilan = todayAppointments.map((item, index) => ({
    ...item,
    navbatRaqami: index + 1,
  }));

  return res.json({
    sartaroshxona: {
      ...myShop,
      ishchilarSoni: employeesCount,
      ishVaqtlari: workingHours,
      bugungiNavbatlar: navbatlarRaqamBilan || [],
    },
  });
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
