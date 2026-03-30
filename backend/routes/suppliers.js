const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");

// POST /supplier — Create a new supplier
router.post("/", async (req, res) => {
  try {
    const { name, city } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Supplier name is required" });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ error: "City is required" });
    }

    const supplier = new Supplier({ name: name.trim(), city: city.trim() });
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /supplier — List all suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
