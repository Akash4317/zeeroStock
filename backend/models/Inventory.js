const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier ID is required"],
    },
    product_name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity must be >= 0"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be > 0"],
    },
  },
  { timestamps: true }
);

// Index for performance on grouped queries
inventorySchema.index({ supplier_id: 1 });
inventorySchema.index({ price: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
