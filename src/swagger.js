const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mardonbek Sartaroshxona API",
      version: "1.0.0",
      description: "Sartaroshxona tizimi uchun RESTful API. Foydalanuvchilar ro'yxatdan o'tish, login qilish, sartaroshxonalar ko'rish va navbatga yozilish mumkin.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["phone", "name", "password"],
          properties: {
            phone: { type: "string", example: "+998901234567", description: "Telefon raqam" },
            name: { type: "string", example: "Mardonbek", description: "Ism" },
            password: { type: "string", example: "secret123", description: "Parol" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["phone", "password"],
          properties: {
            phone: { type: "string", example: "+998901234567", description: "Telefon raqam" },
            password: { type: "string", example: "secret123", description: "Parol" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            xabar: { type: "string", example: "Muvaffaqiyatli login qildingiz." },
            kirishToken: { type: "string", description: "Access token (15 daqiqa)" },
            yangilanishToken: { type: "string", description: "Refresh token (7 kun)" },
            foydalanuvchi: {
              type: "object",
              properties: {
                id: { type: "integer" },
                phone: { type: "string", description: "Telefon raqam" },
                name: { type: "string", description: "Ism" },
                role: { type: "string", description: "Foydalanuvchi roli (admin, barber, user)", example: "user" },
              },
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", description: "Refresh token" },
          },
        },
        RefreshResponse: {
          type: "object",
          properties: {
            xabar: { type: "string", example: "Tokenlar yangilandi." },
            kirishToken: { type: "string", description: "Yangi access token (15 daqiqa)" },
            yangilanishToken: { type: "string", description: "Yangi refresh token (7 kun)" },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            xabar: { type: "string" },
            foydalanuvchi: {
              type: "object",
              properties: {
                id: { type: "integer" },
                phone: { type: "string", description: "Telefon raqam" },
                name: { type: "string", description: "Ism" },
                role: { type: "string", description: "Foydalanuvchi roli (admin, barber, user)", example: "user" },
                yaratilganVaqt: { type: "string", description: "Ro'yxatdan o'tgan vaqt" },
              },
            },
          },
        },
        BarbershopSummary: {
          type: "object",
          properties: {
            id: { type: "integer" },
            nomi: { type: "string", description: "Sartaroshxona nomi" },
            rasm: { type: "string", description: "Rasm URL" },
            manzil: { type: "string", description: "To'liq manzil" },
            telefon: { type: "string", description: "Telefon raqam" },
            narx: { type: "integer", example: 30000, description: "Soch olish narxi (so'm)" },
            ochilishVaqti: { type: "string", example: "09:00", description: "Ochilish vaqti" },
            yopilishVaqti: { type: "string", example: "20:00", description: "Yopilish vaqti" },
          },
        },
        BarbershopDetail: {
          type: "object",
          properties: {
            sartaroshxona: {
              type: "object",
              properties: {
                id: { type: "integer" },
                nomi: { type: "string" },
                rasm: { type: "string" },
                manzil: { type: "string" },
                telefon: { type: "string" },
                malumot: { type: "string", description: "Tavsif" },
                narx: { type: "integer", description: "Narx (so'm)" },
                ochilishVaqti: { type: "string" },
                yopilishVaqti: { type: "string" },
                ishchilarSoni: { type: "integer", description: "Ishchilar soni" },
                ishVaqtlari: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      kun: { type: "string", description: "Hafta kuni" },
                      ochilishVaqti: { type: "string" },
                      yopilishVaqti: { type: "string" },
                      damKuni: { type: "integer", description: "Dam kuni (0/1)" },
                    },
                  },
                },
                bugungiNavbatlar: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      telefon: { type: "string", description: "Mijoz telefon raqami" },
                      ism: { type: "string", description: "Mijoz ismi" },
                      navbatVaqti: { type: "string", example: "10:00", description: "Yozilgan vaqt" },
                      navbatRaqami: { type: "integer", example: 1, description: "Nechanchi navbat" },
                    },
                  },
                },
              },
            },
          },
        },
        AppointmentRequest: {
          type: "object",
          required: ["barbershopId"],
          properties: {
            barbershopId: { type: "integer", example: 1, description: "Sartaroshxona ID" },
            sana: { type: "string", example: "2026-02-28", description: "Navbat sanasi (YYYY-MM-DD). Yuborilmasa bugungi sana olinadi." },
          },
        },
        AppointmentResponse: {
          type: "object",
          properties: {
            xabar: { type: "string" },
            navbat: {
              type: "object",
              properties: {
                sana: { type: "string", example: "2026-02-03", description: "Navbat sanasi" },
                vaqt: { type: "string", example: "14:00", description: "Avtomatik belgilangan vaqt" },
                sartaroshxonaNomi: { type: "string", description: "Sartaroshxona nomi" },
                manzil: { type: "string", description: "Sartaroshxona manzili" },
                navbatRaqami: { type: "integer", example: 4, description: "Sizning navbat raqamingiz" },
              },
            },
          },
        },
        MyAppointmentsResponse: {
          type: "object",
          properties: {
            navbatlar: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sana: { type: "string", example: "2026-02-10", description: "Navbat sanasi" },
                  vaqt: { type: "string", example: "14:00", description: "Navbat vaqti" },
                  holat: { type: "string", example: "completed", description: "confirmed/completed/rescheduled/cancelled" },
                  tugatilganVaqt: { type: "string", nullable: true, description: "Yakunlangan vaqt (agar completed bo'lsa)" },
                  sartaroshxonaNomi: { type: "string", description: "Sartaroshxona nomi" },
                  manzil: { type: "string", description: "Manzil" },
                  telefon: { type: "string", description: "Sartaroshxona telefoni" },
                },
              },
            },
          },
        },
        BarberBarbershopResponse: {
          type: "object",
          properties: {
            sartaroshxona: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string", description: "Nomi" },
                image: { type: "string", description: "Rasm URL" },
                address: { type: "string", description: "Manzil" },
                phone: { type: "string", description: "Telefon" },
                description: { type: "string", description: "Ma'lumot" },
                price: { type: "integer", description: "Narx" },
                opening_time: { type: "string", example: "09:00" },
                closing_time: { type: "string", example: "20:00" },
                owner_id: { type: "integer" },
                is_active: { type: "integer" },
                created_at: { type: "string" },
              },
            },
          },
        },
        BarberAppointmentsResponse: {
          type: "object",
          properties: {
            sana: { type: "string", example: "2026-02-03", description: "Qaysi kun uchun" },
            navbatlar: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  vaqt: { type: "string", example: "10:00", description: "Navbat vaqti" },
                  holat: { type: "string", example: "confirmed", description: "confirmed/completed/rescheduled/cancelled" },
                  tugatilganVaqt: { type: "string", description: "Tugatilgan vaqt" },
                  telefon: { type: "string", description: "Mijoz telefoni" },
                  ism: { type: "string", description: "Mijoz ismi" },
                  ishchiNomi: { type: "string", description: "Qaysi ishchi" },
                },
              },
            },
          },
        },
        BarberHistoryResponse: {
          type: "object",
          properties: {
            tarix: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sana: { type: "string", example: "2026-02-03" },
                  vaqt: { type: "string", example: "10:00" },
                  holat: { type: "string", example: "completed" },
                  tugatilganVaqt: { type: "string" },
                  telefon: { type: "string" },
                  ism: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJSDoc(options);
