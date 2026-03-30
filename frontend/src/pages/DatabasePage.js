import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080";

function SupplierForm({ onSuccess }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!name.trim()) return setError("Supplier name is required");
    if (!city.trim()) return setError("City is required");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/supplier`, { name: name.trim(), city: city.trim() });
      setSuccess(`Supplier "${res.data.name}" created successfully`);
      setName(""); setCity("");
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">Add Supplier</div>
      <div className="form-field">
        <label>Supplier Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MetalWorks Co." />
      </div>
      <div className="form-field">
        <label>City</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" />
      </div>
      {error && <div className="error-msg" style={{ marginTop: 0 }}>⚠ {error}</div>}
      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
        {loading ? "Saving..." : "Create Supplier"}
      </button>
      {success && <div className="success-msg">✓ {success}</div>}
    </div>
  );
}

function InventoryForm({ suppliers, onSuccess }) {
  const [supplierId, setSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!supplierId) return setError("Please select a supplier");
    if (!productName.trim()) return setError("Product name is required");
    if (quantity === "" || isNaN(Number(quantity)) || Number(quantity) < 0)
      return setError("Quantity must be a number >= 0");
    if (price === "" || isNaN(Number(price)) || Number(price) <= 0)
      return setError("Price must be a number > 0");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/inventory`, {
        supplier_id: supplierId,
        product_name: productName.trim(),
        quantity: Number(quantity),
        price: Number(price),
      });
      setSuccess(`"${res.data.product_name}" added to inventory`);
      setProductName(""); setQuantity(""); setPrice(""); setSupplierId("");
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add inventory item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">Add Inventory Item</div>
      <div className="form-field">
        <label>Supplier</label>
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Select a supplier...</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.name} — {s.city}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Product Name</label>
        <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Copper Wire Spools" />
      </div>
      <div className="form-field">
        <label>Quantity (≥ 0)</label>
        <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 500" />
      </div>
      <div className="form-field">
        <label>Price per unit ($) (&gt; 0)</label>
        <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 45.99" />
      </div>
      {error && <div className="error-msg" style={{ marginTop: 0 }}>⚠ {error}</div>}
      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || suppliers.length === 0} style={{ marginTop: 4 }}>
        {loading ? "Saving..." : "Add to Inventory"}
      </button>
      {suppliers.length === 0 && <p style={{ color: "var(--text2)", fontSize: "0.8rem", marginTop: 8 }}>Create a supplier first</p>}
      {success && <div className="success-msg">✓ {success}</div>}
    </div>
  );
}

function GroupedView({ data }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏭</div>
        <h3>No inventory data</h3>
        <p>Add suppliers and inventory items to see the grouped view</p>
      </div>
    );
  }

  return (
    <div>
      {data.map((group) => {
        const id = group.supplier._id;
        const isOpen = expanded[id];
        return (
          <div className="grouped-card" key={id}>
            <div className="grouped-header" onClick={() => toggle(id)}>
              <div>
                <div className="grouped-supplier">{group.supplier.name}</div>
                <div className="grouped-city">📍 {group.supplier.city} · {group.totalItems} item{group.totalItems !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="grouped-value">
                  <div className="val">${group.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="lbl">total value</div>
                </div>
                <span style={{ color: "var(--text2)", fontFamily: "var(--mono)", fontSize: "0.8rem" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>
            </div>
            {isOpen && (
              <div className="table-wrap" style={{ borderRadius: 0, border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, i) => (
                      <tr key={i}>
                        <td><strong>{item.product_name}</strong></td>
                        <td className="td-mono">{item.quantity.toLocaleString()}</td>
                        <td className="td-price">${item.price.toFixed(2)}</td>
                        <td className="td-mono" style={{ color: "var(--accent2)" }}>
                          ${item.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FlatInventory({ items }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <h3>No inventory items</h3>
        <p>Add inventory items using the form above</p>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Supplier</th>
            <th>City</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td><strong>{item.product_name}</strong></td>
              <td>{item.supplier_id?.name || "—"}</td>
              <td style={{ color: "var(--text2)" }}>{item.supplier_id?.city || "—"}</td>
              <td className="td-mono">{item.quantity.toLocaleString()}</td>
              <td className="td-price">${item.price.toFixed(2)}</td>
              <td className="td-mono" style={{ color: "var(--accent2)" }}>
                ${(item.quantity * item.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuppliersTable({ suppliers }) {
  if (suppliers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏭</div>
        <h3>No suppliers yet</h3>
        <p>Create your first supplier using the form above</p>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>City</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s, i) => (
            <tr key={s._id}>
              <td className="td-mono" style={{ color: "var(--text2)" }}>{String(i + 1).padStart(2, "0")}</td>
              <td><strong>{s.name}</strong></td>
              <td>{s.city}</td>
              <td className="td-mono" style={{ color: "var(--text2)", fontSize: "0.75rem" }}>{s._id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DatabasePage() {
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [tab, setTab] = useState("all");
  const [dbError, setDbError] = useState("");

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API}/supplier`);
      setSuppliers(res.data);
      setDbError("");
    } catch {
      setDbError("Cannot connect to database. Make sure MongoDB is running and the backend is started.");
    }
  };

  const fetchInventory = async () => {
    try {
      const [flat, grp] = await Promise.all([
        axios.get(`${API}/inventory`),
        axios.get(`${API}/inventory?grouped=true`),
      ]);
      setInventory(flat.data);
      setGrouped(grp.data);
    } catch {}
  };

  const refresh = () => { fetchSuppliers(); fetchInventory(); };
  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <h1 className="page-title">Inventory Database</h1>
      <p className="page-subtitle">Manage suppliers and inventory items with relational data</p>

      {dbError && <div className="error-msg">⚠ {dbError}</div>}

      <div className="db-grid">
        <SupplierForm onSuccess={refresh} />
        <InventoryForm suppliers={suppliers} onSuccess={refresh} />
      </div>

      <div className="tab-bar">
        <button className={`tab${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")}>All Inventory</button>
        <button className={`tab${tab === "grouped" ? " active" : ""}`} onClick={() => setTab("grouped")}>Grouped by Supplier ↓ Value</button>
        <button className={`tab${tab === "suppliers" ? " active" : ""}`} onClick={() => setTab("suppliers")}>All Suppliers</button>
      </div>

      {tab === "all" && <FlatInventory items={inventory} />}
      {tab === "grouped" && <GroupedView data={grouped} />}
      {tab === "suppliers" && <SuppliersTable suppliers={suppliers} />}
    </div>
  );
}
