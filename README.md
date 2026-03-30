# Zeerostock — Inventory Search & Database

A MERN stack application covering two assignments:
- **Assignment A**: Search API + UI (static in-memory data)
- **Assignment B**: Relational Database API (MongoDB + Mongoose)

---

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Frontend**: React (Create React App), React Router, Axios

---

## Project Structure

```
zeerostock/
├── backend/
│   ├── server.js              # Express entry point
│   ├── data/inventory.json    # 15 static inventory records (Assignment A)
│   ├── models/
│   │   ├── Supplier.js        # Supplier schema
│   │   └── Inventory.js       # Inventory schema with supplier ref
│   └── routes/
│       ├── search.js          # GET /search (Assignment A)
│       ├── suppliers.js       # POST /supplier, GET /supplier
│       └── inventory.js       # POST /inventory, GET /inventory
└── frontend/
    └── src/
        ├── App.js             # Router + Header
        ├── App.css            # Global styles
        └── pages/
            ├── SearchPage.js  # Assignment A UI
            └── DatabasePage.js# Assignment B UI
```

---

## Setup & Running

### Prerequisites
- Node.js v16+
- MongoDB running locally (`mongod`) OR set `MONGO_URI` env variable

### 1. Backend
```bash
cd backend
npm install
node server.js
# Server starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
# App starts on http://localhost:3000
```

### Environment Variables (optional)
Create `backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/zeerostock
PORT=5000
```

---

## Assignment A — Search API

### Endpoint
```
GET /search
```

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Partial product name (case-insensitive) |
| `category` | string | Exact category match (case-insensitive) |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |

### Rules
- All filters are optional and combinable
- No filters → returns all 15 records
- Case-insensitive partial match on product name
- Invalid price values return `400` with error message
- `minPrice > maxPrice` returns `400` with error message

### Example Requests
```
GET /search                          → all 15 items
GET /search?q=copper                 → items with "copper" in name
GET /search?category=Electrical      → all Electrical items
GET /search?minPrice=10&maxPrice=50  → items priced $10–$50
GET /search?q=wire&category=Electrical&maxPrice=200  → combined
```

### Search Logic
1. Start with full dataset (15 items from `data/inventory.json`)
2. If `q` is present: filter where `name.toLowerCase().includes(q.toLowerCase())`
3. If `category` is present: filter where `category.toLowerCase() === category.toLowerCase()`
4. If `minPrice` is present: filter where `price >= minPrice`
5. If `maxPrice` is present: filter where `price <= maxPrice`

### GET /search/categories
Returns all unique category names for the dropdown.

### Performance Improvement for Large Datasets
For large datasets, I would replace the static JSON with MongoDB full-text search:
```js
// Add text index on product name
db.inventory.createIndex({ name: "text" })
// Then use $text operator instead of in-memory filter
db.inventory.find({ $text: { $search: "copper wire" } })
```
This allows MongoDB to use an inverted index instead of scanning every document, reducing search from O(n) to O(log n). For price range queries, a compound index `{ price: 1, category: 1 }` would further speed up filtered queries.

---

## Assignment B — Database API

### Database Schema

#### Suppliers Collection
```js
{
  _id: ObjectId,       // auto-generated
  name: String,        // required
  city: String,        // required
  createdAt: Date,
  updatedAt: Date
}
```

#### Inventory Collection
```js
{
  _id: ObjectId,
  supplier_id: ObjectId,  // ref: Supplier (required, must exist)
  product_name: String,   // required
  quantity: Number,       // required, >= 0
  price: Number,          // required, > 0
  createdAt: Date,
  updatedAt: Date
}
```

**Relationship**: One Supplier → Many Inventory items (via `supplier_id` foreign key)

### Why MongoDB (NoSQL)?
- **Flexible schema**: Inventory items for different industries may have varying attributes
- **Aggregation Pipeline**: MongoDB's `$group`, `$lookup`, `$sort` make the "grouped by supplier" query clean and efficient
- **Horizontal scaling**: Suitable for high-volume surplus inventory data across many suppliers
- **Embedded documents**: Future features like product images or spec sheets fit naturally

### Indexing & Optimization
Indexes defined in `Inventory.js`:
```js
inventorySchema.index({ supplier_id: 1 })  // speeds up grouping queries
inventorySchema.index({ price: 1 })         // speeds up price range filters
```
**Additional suggestion**: Add a compound index `{ supplier_id: 1, price: -1 }` to cover the grouped + sorted aggregation query in a single index scan. For text search on product names, a `{ product_name: "text" }` index would allow full-text search.

### API Endpoints

#### POST /supplier
```json
// Request body
{ "name": "MetalWorks Co.", "city": "Mumbai" }

// Response 201
{ "_id": "...", "name": "MetalWorks Co.", "city": "Mumbai", "createdAt": "..." }
```

#### GET /supplier
Returns all suppliers sorted by name.

#### POST /inventory
```json
// Request body
{
  "supplier_id": "<valid ObjectId>",
  "product_name": "Copper Wire Spools",
  "quantity": 200,
  "price": 120.00
}

// Response 201 — populated with supplier details
```

Validation:
- `supplier_id` must reference an existing Supplier document
- `quantity` must be a number ≥ 0
- `price` must be a number > 0

#### GET /inventory
Returns all inventory items with supplier details populated.

#### GET /inventory?grouped=true
Returns inventory **grouped by supplier**, **sorted by total value descending** (quantity × price).

```json
[
  {
    "supplier": { "_id": "...", "name": "MetalWorks Co.", "city": "Mumbai" },
    "items": [
      { "product_name": "...", "quantity": 500, "price": 45.99, "totalValue": 22995 }
    ],
    "totalValue": 22995,
    "totalItems": 3
  }
]
```

MongoDB Aggregation Pipeline used:
1. `$group` — group items by `supplier_id`, sum `quantity × price`
2. `$lookup` — join with `suppliers` collection
3. `$unwind` — flatten the supplier array
4. `$sort` — sort by `totalValue: -1`
5. `$project` — shape the output

---

