require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const barbershopsRoutes = require("./routes/barbershops");
const appointmentsRoutes = require("./routes/appointments");
const adminRoutes = require("./routes/admin");
const barberRoutes = require("./routes/barber");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const isWildcard = allowedOrigins.includes("*");
  const isAllowedOrigin = isWildcard || (requestOrigin && allowedOrigins.includes(requestOrigin));

  if (isAllowedOrigin) {
    res.header("Access-Control-Allow-Origin", isWildcard ? "*" : requestOrigin);
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/barbershops", barbershopsRoutes);
app.use("/appointments", appointmentsRoutes);
app.use("/admin", adminRoutes);
app.use("/barber", barberRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
});
