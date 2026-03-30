const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const searchRoutes = require("./routes/search");
const supplierRoutes = require("./routes/suppliers");
const inventoryRoutes = require("./routes/inventory");

app.get('/',(req,res)=>{
  res.send('connected to zeerostock server');
})

app.use("/search", searchRoutes);
app.use("/supplier", supplierRoutes);
app.use("/inventory", inventoryRoutes);

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// MongoDB connection
const MONGO_URI =  "mongodb://localhost:27017/zeerostock";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT} (no DB - search only mode)`)
    );
  });
