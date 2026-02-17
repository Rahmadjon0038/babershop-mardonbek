# Mardonbek Sartaroshxona API

Bu loyiha sartaroshxona uchun backend API.  
Asosiy maqsad: foydalanuvchi ro'yxatdan o'tadi, login qiladi, sartaroshxonalarni ko'radi va navbat oladi.

## Tezkor ishga tushirish

1. Kutubxonalarni o'rnating:
```bash
npm install
```

2. `.env` fayl yarating:
```bash
cp .env.example .env
```

3. Serverni ishga tushiring:
```bash
npm run dev
```

Server ishga tushganda default foydalanuvchilar avtomatik yaratiladi (agar shu telefon bilan user bo'lmasa):
- admin: `+998900000000` / `admin123`
- barber: `+998900000001` / `barber123`

Bu qiymatlarni `.env` ichida `DEFAULT_ADMIN_*` va `DEFAULT_BARBER_*` o'zgaruvchilari bilan o'zgartirishingiz mumkin.

4. Swagger hujjat:
`http://localhost:3000/docs`

## API bilan ishlash tartibi (yangi dasturchi uchun)

1. `POST /auth/register` bilan user yarating.
2. `POST /auth/login` bilan token oling.
3. Keyingi yopiq endpointlarda header yuboring:
`Authorization: Bearer <kirishToken>`
4. Role bo'yicha endpoint tanlang:
- oddiy user: `appointments`, `profile`
- barber: `barber/*`, `barbershops/my-shop`, `barbershops/:id/employees`
- admin: `admin/*`

## Muhim endpointlar

### Auth
- `POST /auth/register` - ro'yxatdan o'tish
- `POST /auth/login` - kirish tokeni olish

### Profile
- `GET /profile` - o'z profilingiz

### Barbershops
- `GET /barbershops` - barcha aktiv sartaroshxonalar
- `GET /barbershops/:id` - bitta sartaroshxona batafsil
- `GET /barbershops/my-shop` - barberning o'z sartaroshxonasi
- `PUT /barbershops/my-shop` - barber o'z sartaroshxonasini yangilaydi
- `POST /barbershops/:id/employees` - ishchi qo'shish (barber/admin)
- `GET /barbershops/:id/employees` - ishchilar ro'yxati
- `DELETE /barbershops/:id/employees/:employeeId` - ishchini nofaol qilish
- `PUT /barbershops/:id/working-hours` - ish vaqtlarini yangilash

### Appointments
- `POST /appointments` - navbat olish
- `GET /appointments/my` - foydalanuvchining navbatlari

### Barber panel
- `GET /barber/barbershop` - o'z sartaroshxonasi
- `PUT /barber/barbershop` - o'z sartaroshxonasini tahrirlash
- `GET /barber/appointments` - belgilangan sana navbatlari
- `PUT /barber/appointments/:id/complete` - navbatni tugatish
- `PUT /barber/appointments/:id/move-tomorrow` - navbatni ertaga ko'chirish
- `GET /barber/appointments/history` - tarix

### Admin panel
- `POST /admin/barbershops` - sartaroshxona yaratish
- `PUT /admin/barbershops/:id` - sartaroshxonani yangilash
- `DELETE /admin/barbershops/:id` - soft delete
- `GET /admin/users` - foydalanuvchilar ro'yxati
- `PUT /admin/users/:id/change-role` - role almashtirish

## So'rov namunasi

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998901112233","password":"123456"}'
```

```bash
curl http://localhost:3000/profile \
  -H "Authorization: Bearer TOKEN_SHU_YERGA"
```

## Loyiha strukturasi

```txt
src/
  server.js              # app va route ulash
  db.js                  # sqlite ulanish va jadvallar
  swagger.js             # swagger konfiguratsiya
  routes/                # barcha endpointlar
  middleware/            # auth/admin/barber tekshiruvlari
```
