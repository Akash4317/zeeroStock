const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Supplier = require("../models/Supplier");

// POST /inventory — Create a new inventory item
router.post("/", async (req, res) => {
  try {
    const { supplier_id, product_name, quantity, price } = req.body;

    // Validate supplier exists
    if (!supplier_id) {
      return res.status(400).json({ error: "supplier_id is required" });
    }
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(400).json({ error: "Supplier not found" });
    }

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ error: "product_name is required" });
    }
    if (quantity === undefined || quantity === null || quantity === "") {
      return res.status(400).json({ error: "quantity is required" });
    }
    if (isNaN(Number(quantity)) || Number(quantity) < 0) {
      return res.status(400).json({ error: "quantity must be >= 0" });
    }
    if (price === undefined || price === null || price === "") {
      return res.status(400).json({ error: "price is required" });
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: "price must be > 0" });
    }

    const item = new Inventory({
      supplier_id,
      product_name: product_name.trim(),
      quantity: Number(quantity),
      price: Number(price),
    });
    await item.save();

    const populated = await item.populate("supplier_id", "name city");
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid supplier_id format" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /inventory — All inventory; with optional ?grouped=true for the aggregation query
router.get("/", async (req, res) => {
  try {
    const { grouped } = req.query;

    if (grouped === "true") {
      // Required aggregation: group by supplier, sorted by total inventory value desc
      const result = await Inventory.aggregate([
        {
          $group: {
            _id: "$supplier_id",
            items: {
              $push: {
                product_name: "$product_name",
                quantity: "$quantity",
                price: "$price",
                totalValue: { $multiply: ["$quantity", "$price"] },
              },
            },
            totalValue: {
              $sum: { $multiply: ["$quantity", "$price"] },
            },
            totalItems: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        { $unwind: "$supplier" },
        { $sort: { totalValue: -1 } },
        {
          $project: {
            _id: 0,
            supplier: { _id: "$supplier._id", name: "$supplier.name", city: "$supplier.city" },
            items: 1,
            totalValue: 1,
            totalItems: 1,
          },
        },
      ]);
      return res.json(result);
    }

    // Default: all inventory flat list
    const items = await Inventory.find()
      .populate("supplier_id", "name city")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
