const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { router: userAuthRoutes } = require("./userAuth"); // ✅ Import userAuth.js routes
const vehicleRoutes = require("./vehicleRoutes");  // ✅ Import vehicle routes

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ CORS Configuration (Allow Local & Netlify Frontend)
const allowedOrigins = [
  "http://localhost:3000",
  "https://ukc-car-tracking-system.netlify.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ Allow cookies & authentication headers
  })
);

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// ✅ Use Routes from userAuth.js & vehicleRoutes.js
app.use("/api", userAuthRoutes); // 👈 User authentication routes
app.use("/api", vehicleRoutes);  // 👈 Vehicle tracking routes

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
