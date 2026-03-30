const express = require("express");
const router = express.Router();
const inventoryData = require("../data/inventory.json");

/**
 * GET /search
 * Query params: q, category, minPrice, maxPrice
 * - Case-insensitive partial match on product name
 * - All filters combinable
 * - No filters → return all
 */
router.get("/", (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  // Validate price range
  const min = minPrice !== undefined ? parseFloat(minPrice) : null;
  const max = maxPrice !== undefined ? parseFloat(maxPrice) : null;

  if (minPrice !== undefined && isNaN(min)) {
    return res.status(400).json({ error: "Invalid minPrice value" });
  }
  if (maxPrice !== undefined && isNaN(max)) {
    return res.status(400).json({ error: "Invalid maxPrice value" });
  }
  if (min !== null && max !== null && min > max) {
    return res
      .status(400)
      .json({ error: "minPrice cannot be greater than maxPrice" });
  }

  let results = [...inventoryData];

  // Filter by product name (case-insensitive partial match)
  if (q && q.trim() !== "") {
    const query = q.trim().toLowerCase();
    results = results.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }

  // Filter by category (case-insensitive exact match)
  if (category && category.trim() !== "") {
    const cat = category.trim().toLowerCase();
    results = results.filter((item) => item.category.toLowerCase() === cat);
  }

  // Filter by price range
  if (min !== null) {
    results = results.filter((item) => item.price >= min);
  }
  if (max !== null) {
    results = results.filter((item) => item.price <= max);
  }

  return res.json({
    total: results.length,
    results,
  });
});

// Get all unique categories (for dropdown)
router.get("/categories", (req, res) => {
  const categories = [...new Set(inventoryData.map((item) => item.category))].sort();
  res.json(categories);
});

module.exports = router;
