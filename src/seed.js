const db = require("./db");
const bcrypt = require("bcryptjs");
const { getUzbekistanDate } = require("./utils/timezone");

// Test ma'lumotlar qo'shish
function seedDatabase() {
  const userExists = db.prepare("SELECT id FROM users WHERE id = 1").get();

  if (!userExists) {
    // Avval foydalanuvchilarni yaratish
    const passwordHash = bcrypt.hashSync("test123", 10);
    
    // Admin
    db.prepare(
      "INSERT INTO users (phone, name, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run("+998900000000", "Admin", passwordHash, "admin");
    
    // Barber (owner)
    db.prepare(
      "INSERT INTO users (phone, name, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run("+998900000001", "Mardonbek", passwordHash, "barber");
    
    // Oddiy foydalanuvchilar
    db.prepare(
      "INSERT INTO users (phone, name, password_hash) VALUES (?, ?, ?)"
    ).run("+998901111111", "Anvar", passwordHash);
    
    db.prepare(
      "INSERT INTO users (phone, name, password_hash) VALUES (?, ?, ?)"
    ).run("+998902222222", "Bobur", passwordHash);
    
    db.prepare(
      "INSERT INTO users (phone, name, password_hash) VALUES (?, ?, ?)"
    ).run("+998903333333", "Dilshod", passwordHash);

    console.log("✓ Test foydalanuvchilar qo'shildi");

    // Keyin Barbershop yaratish
    db.prepare(
      `INSERT INTO barbershops (name, image, address, phone, description, price, opening_time, closing_time, owner_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "Mardonbek Sartaroshxona",
      "https://example.com/shop.jpg",
      "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 123",
      "+998901234567",
      "Eng yaxshi sartaroshxona. Professional ustalar bilan xizmat.",
      30000,
      "09:00",
      "20:00",
      2  // Barber user id
    );

    console.log("✓ Barbershop qo'shildi");

    // Ishchilar
    db.prepare(
      "INSERT INTO employees (barbershop_id, name) VALUES (?, ?)"
    ).run(1, "Mardonbek");
    db.prepare(
      "INSERT INTO employees (barbershop_id, name) VALUES (?, ?)"
    ).run(1, "Sardor");
    db.prepare(
      "INSERT INTO employees (barbershop_id, name) VALUES (?, ?)"
    ).run(1, "Javohir");

    console.log("✓ Ishchilar qo'shildi");

    // Ish kunlari
    const days = [
      "Dushanba",
      "Seshanba",
      "Chorshanba",
      "Payshanba",
      "Juma",
      "Shanba",
    ];
    days.forEach((day) => {
      db.prepare(
        "INSERT INTO working_hours (barbershop_id, day_of_week, opening_time, closing_time, is_day_off) VALUES (?, ?, ?, ?, ?)"
      ).run(1, day, "09:00", "20:00", 0);
    });

    // Yakshanba - dam kuni
    db.prepare(
      "INSERT INTO working_hours (barbershop_id, day_of_week, opening_time, closing_time, is_day_off) VALUES (?, ?, ?, ?, ?)"
    ).run(1, "Yakshanba", null, null, 1);

    console.log("✓ Ish kunlari qo'shildi");

    // Bugungi navbatlar
    const today = getUzbekistanDate();
    
    db.prepare(
      "INSERT INTO appointments (user_id, barbershop_id, employee_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(3, 1, 1, today, "10:00", "confirmed");
    
    db.prepare(
      "INSERT INTO appointments (user_id, barbershop_id, employee_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(4, 1, 2, today, "11:30", "confirmed");
    
    db.prepare(
      "INSERT INTO appointments (user_id, barbershop_id, employee_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(5, 1, 1, today, "14:00", "confirmed");

    console.log("✓ Bugungi navbatlar qo'shildi");
  }
}

seedDatabase();
console.log("Database seeding tugadi!");
