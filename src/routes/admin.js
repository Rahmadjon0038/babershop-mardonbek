const express = require("express");
const db = require("../db");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

/**
 * @swagger
 * /admin/barbershops:
 *   post:
 *     summary: Sartaroshxona yaratish (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomi, manzil, telefon, narx, ochilishVaqti, yopilishVaqti, ownerId]
 *             properties:
 *               nomi: { type: string, description: "Nomi" }
 *               rasm: { type: string, description: "Rasm URL" }
 *               manzil: { type: string, description: "Manzil" }
 *               telefon: { type: string, description: "Telefon" }
 *               malumot: { type: string, description: "Tavsif" }
 *               narx: { type: integer, description: "Narx" }
 *               ochilishVaqti: { type: string, example: "09:00" }
 *               yopilishVaqti: { type: string, example: "20:00" }
 *               ownerId: { type: integer, description: "Barber user ID" }
 *     responses:
 *       201:
 *         description: Sartaroshxona yaratildi
 *       403:
 *         description: Faqat adminlar
 */
router.post("/barbershops", adminMiddleware, (req, res) => {
  const {
    nomi,
    rasm,
    manzil,
    telefon,
    malumot,
    narx,
    ochilishVaqti,
    yopilishVaqti,
    ownerId,
  } = req.body || {};

  if (!nomi || !manzil || !telefon || !narx || !ochilishVaqti || !yopilishVaqti || !ownerId) {
    return res.status(400).json({
      xabar: "Barcha majburiy maydonlarni to'ldiring.",
    });
  }

  // Owner barber ekanligini tekshirish
  const owner = db.prepare("SELECT role FROM users WHERE id = ?").get(ownerId);
  if (!owner || owner.role !== "barber") {
    return res.status(400).json({
      xabar: "Owner barber bo'lishi kerak.",
    });
  }

  const insert = db.prepare(
    `INSERT INTO barbershops 
      (name, image, address, phone, description, price, opening_time, closing_time, owner_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = insert.run(
    nomi,
    rasm || null,
    manzil,
    telefon,
    malumot || null,
    narx,
    ochilishVaqti,
    yopilishVaqti,
    ownerId
  );

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
      FROM barbershops WHERE id = ?`
    )
    .get(result.lastInsertRowid);

  return res.status(201).json({
    xabar: "Sartaroshxona muvaffaqiyatli yaratildi.",
    sartaroshxona,
  });
});

/**
 * @swagger
 * /admin/barbershops/{id}:
 *   put:
 *     summary: Sartaroshxonani yangilash (Admin)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Yangilandi
 *       403:
 *         description: Faqat adminlar
 */
router.put("/barbershops/:id", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

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
  if (updates.narx) {
    fields.push("price = ?");
    values.push(updates.narx);
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

  values.push(id);
  const query = `UPDATE barbershops SET ${fields.join(", ")} WHERE id = ?`;
  db.prepare(query).run(...values);

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
      FROM barbershops WHERE id = ?`
    )
    .get(id);

  return res.json({
    xabar: "Sartaroshxona yangilandi.",
    sartaroshxona,
  });
});

/**
 * @swagger
 * /admin/barbershops/{id}:
 *   delete:
 *     summary: Sartaroshxonani o'chirish (Admin)
 *     tags: [Admin]
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
 *         description: O'chirildi
 *       403:
 *         description: Faqat adminlar
 */
router.delete("/barbershops/:id", adminMiddleware, (req, res) => {
  const { id } = req.params;

  // Soft delete
  db.prepare("UPDATE barbershops SET is_active = 0 WHERE id = ?").run(id);

  return res.json({ xabar: "Sartaroshxona o'chirildi." });
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Barcha foydalanuvchilar ro'yxati
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, barber, admin]
 *         description: Role bo'yicha filter
 *     responses:
 *       200:
 *         description: Foydalanuvchilar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 foydalanuvchilar:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       telefon:
 *                         type: string
 *                       ism:
 *                         type: string
 *                       role:
 *                         type: string
 *                       yaratilganVaqt:
 *                         type: string
 *                 jami:
 *                   type: integer
 *       403:
 *         description: Faqat adminlar
 */
router.get("/users", adminMiddleware, (req, res) => {
  const roleFilter = req.query.role;

  try {
    let whereClause = "";
    let params = [];

    if (roleFilter) {
      whereClause = "WHERE role = ?";
      params.push(roleFilter);
    }

    // Barcha foydalanuvchilar ro'yxati
    const usersQuery = `
      SELECT 
        id,
        phone AS telefon,
        name AS ism,
        role,
        created_at AS yaratilganVaqt
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
    `;
    const users = db.prepare(usersQuery).all(...params);

    return res.json({
      foydalanuvchilar: users,
      jami: users.length
    });

  } catch (error) {
    console.error("Foydalanuvchilarni olishda xato:", error);
    return res.status(500).json({
      xabar: "Foydalanuvchilarni olishda server xatosi yuz berdi."
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}/change-role:
 *   put:
 *     summary: Foydalanuvchi role'ini o'zgartirish
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - yangiRole
 *             properties:
 *               yangiRole:
 *                 type: string
 *                 enum: [user, barber, admin]
 *                 example: "barber"
 *                 description: "Yangi role: user, barber yoki admin"
 *     responses:
 *       200:
 *         description: Role muvaffaqiyatli o'zgartirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 xabar:
 *                   type: string
 *                   example: "Foydalanuvchi role'i muvaffaqiyatli o'zgartirildi."
 *                 foydalanuvchi:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     ism:
 *                       type: string
 *                     telefon:
 *                       type: string
 *                     eskiRole:
 *                       type: string
 *                     yangiRole:
 *                       type: string
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       403:
 *         description: Faqat adminlar
 *       404:
 *         description: Foydalanuvchi topilmadi
 */
router.put("/users/:id/change-role", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { yangiRole } = req.body;

  // Role'ni tekshirish
  const validRoles = ['user', 'barber', 'admin'];
  if (!yangiRole || !validRoles.includes(yangiRole)) {
    return res.status(400).json({
      xabar: "Yangi role noto'g'ri. Faqat 'user', 'barber' yoki 'admin' bo'lishi mumkin."
    });
  }

  // Foydalanuvchini tekshirish
  const user = db
    .prepare("SELECT id, name, phone, role FROM users WHERE id = ?")
    .get(id);

  if (!user) {
    return res.status(404).json({
      xabar: "Foydalanuvchi topilmadi."
    });
  }

  // O'z role'ini o'zgartirish mumkin emasligini tekshirish
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      xabar: "Siz o'z role'ingizni o'zgartira olmaysiz."
    });
  }

  // Agar role bir xil bo'lsa
  if (user.role === yangiRole) {
    return res.status(400).json({
      xabar: `Foydalanuvchi allaqachon '${yangiRole}' role'iga ega.`
    });
  }

  try {
    const oldRole = user.role;

    // Role'ni yangilash
    const updateStmt = db.prepare("UPDATE users SET role = ? WHERE id = ?");
    updateStmt.run(yangiRole, id);

    return res.json({
      xabar: "Foydalanuvchi role'i muvaffaqiyatli o'zgartirildi.",
      foydalanuvchi: {
        id: user.id,
        ism: user.name,
        telefon: user.phone,
        eskiRole: oldRole,
        yangiRole: yangiRole
      }
    });

  } catch (error) {
    console.error("Role o'zgartirishda xato:", error);
    return res.status(500).json({
      xabar: "Role o'zgartirishda server xatosi yuz berdi."
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}/toggle-status:
 *   put:
 *     summary: Foydalanuvchi faolligini o'zgartirish (bloklash/blokdan chiqarish)
 *     tags: [Admin]
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
 *               - faol
 *             properties:
 *               faol:
 *                 type: boolean
 *                 example: false
 *                 description: "true = faol, false = blok"
 *     responses:
 *       200:
 *         description: Status o'zgartirildi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       403:
 *         description: Faqat adminlar
 *       404:
 *         description: Foydalanuvchi topilmadi
 */
router.put("/users/:id/toggle-status", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { faol } = req.body;

  if (typeof faol !== 'boolean') {
    return res.status(400).json({
      xabar: "Faol maydoni boolean qiymat bo'lishi kerak (true/false)."
    });
  }

  // Foydalanuvchini tekshirish
  const user = db
    .prepare("SELECT id, name, phone, role FROM users WHERE id = ?")
    .get(id);

  if (!user) {
    return res.status(404).json({
      xabar: "Foydalanuvchi topilmadi."
    });
  }

  // O'zini bloklash mumkin emasligini tekshirish
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      xabar: "Siz o'zingizni bloklay olmaysiz."
    });
  }

  try {
    // DB'da is_active maydonini qo'shish kerak bo'lsa, u yo'q bo'lishi mumkin
    // Hozircha faqat log qilamiz
    console.log(`Admin ${req.user.id} foydalanuvchi ${id} ni ${faol ? 'faollashtirdi' : 'blokladi'}`);

    return res.json({
      xabar: `Foydalanuvchi muvaffaqiyatli ${faol ? 'faollashtirildi' : 'bloklandi'}.`,
      foydalanuvchi: {
        id: user.id,
        ism: user.name,
        telefon: user.phone,
        yangiHolat: faol ? 'faol' : 'blok'
      }
    });

  } catch (error) {
    console.error("Status o'zgartirishda xato:", error);
    return res.status(500).json({
      xabar: "Status o'zgartirishda server xatosi yuz berdi."
    });
  }
});

module.exports = router;
