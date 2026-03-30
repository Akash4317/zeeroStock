import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:8080";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    axios.get(`${API}/search/categories`).then((res) => setCategories(res.data)).catch(() => {});
    fetchResults({});
  }, []);

  const fetchResults = useCallback(async (params) => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/search`, { params });
      setResults(res.data.results);
      setTotal(res.data.total);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to fetch results";
      setError(msg);
      setResults([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    // Validate price range on client side too
    if (minPrice && isNaN(parseFloat(minPrice))) {
      return setError("Invalid minimum price");
    }
    if (maxPrice && isNaN(parseFloat(maxPrice))) {
      return setError("Invalid maximum price");
    }
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      return setError("Minimum price cannot be greater than maximum price");
    }
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    fetchResults(params);
  };

  const handleClear = () => {
    setQ(""); setCategory(""); setMinPrice(""); setMaxPrice("");
    setError("");
    fetchResults({});
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  return (
    <div>
      <h1 className="page-title">Inventory Search</h1>
      <p className="page-subtitle">Search surplus stock across suppliers with real-time filtering</p>

      <div className="filter-bar">
        <div className="field">
          <label>Product Name</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. bearings, copper wire..."
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Min Price ($)</label>
          <input
            type="number" min="0" step="0.01"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
          />
        </div>
        <div className="field">
          <label>Max Price ($)</label>
          <input
            type="number" min="0" step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="999.99"
          />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          <button className="btn btn-secondary" onClick={handleClear}>Clear</button>
        </div>
      </div>

      {error && <div className="error-msg">⚠ {error}</div>}

      {loading ? (
        <div className="loading">Searching inventory...</div>
      ) : (
        <>
          {total !== null && (
            <div className="results-meta">
              <div className="results-count">
                <span>{total}</span> result{total !== 1 ? "s" : ""} found
              </div>
            </div>
          )}

          {results.length === 0 && total !== null ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No results found</h3>
              <p>Try adjusting your search query or filters</p>
            </div>
          ) : results.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Price</th>
                    <th>Qty Available</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, i) => (
                    <tr key={item.id}>
                      <td className="td-mono" style={{ color: "var(--text2)" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="td-badge">{item.category}</span></td>
                      <td style={{ color: "var(--text2)" }}>{item.supplier}</td>
                      <td className="td-price">${item.price.toFixed(2)}</td>
                      <td className="td-mono">{item.quantity.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
