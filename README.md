# 🛒 D-Mart Smart Supermarket Billing System
### AI Powered Billing + Barcode Scan + Fast Checkout System

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Barcode Scanner | html5-qrcode |
| Charts | Recharts |
| Payments | Razorpay |
| PDF | PDFKit |
| AI | Rule-based ML + Anakin API |

---

## 📂 Project Structure

```
d-mart/
├── backend/          ← Express API Server
│   ├── config/       ← DB & Razorpay config
│   ├── controllers/  ← Route handlers
│   ├── models/       ← MongoDB schemas
│   ├── routes/       ← API endpoints
│   ├── middleware/   ← Auth & error handling
│   ├── services/     ← PDF, AI, Anakin
│   └── utils/        ← Barcode, GST, Seeder
└── frontend/         ← React + Vite App
    └── src/
        ├── components/  ← Scanner, Sidebar, Topbar
        ├── pages/       ← All 9 pages
        ├── context/     ← Auth & Cart context
        ├── services/    ← API service layer
        ├── layouts/     ← Main & Auth layouts
        └── utils/       ← Currency & date formatters
```

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/dmart
JWT_SECRET=your_secret_here
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXX
ANAKIN_API_KEY=your_anakin_key
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates demo users + 12 sample products + 3 customers.

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@dmart.com | admin123 |
| **Cashier** | cashier@dmart.com | cashier123 |
| **Staff** | staff@dmart.com | staff123 |

---

## ✨ Core Features

### 🎯 Billing System (POS)
- Mobile barcode scanning via camera
- Manual barcode entry
- Product text search
- Cart management (add/remove/qty)
- Auto GST + discount calculation
- Cash / UPI / Card / Razorpay payment
- Auto PDF invoice on checkout
- Stock auto-deduction after billing

### 📊 Admin Dashboard
- Total / Today / Weekly / Monthly revenue
- 7-day area chart
- Monthly bar chart
- Payment method pie chart
- Top 5 best sellers
- Recent transactions table
- Low stock alerts

### 📦 Product Management
- Full CRUD with image upload
- Auto EAN-13 barcode generation
- Price preview with GST/discount
- Margin calculator
- Supplier info per product

### 🏭 Inventory
- Live stock level tracking
- Progress bar stock indicator
- All stock movements history
- Supplier directory

### 👥 Customers
- Loyalty tier system (Bronze/Silver/Gold/Platinum)
- Loyalty points tracking
- Purchase history per customer

### 🤖 AI Insights
- Stock risk predictions (Critical/High/Medium/Low)
- Best-selling products analysis
- Slow-moving product detection
- Smart reorder suggestions
- **Anakin API** supplier price comparison

### 🧾 PDF Invoice
- Professional A4 invoice
- GST breakdown (CGST/SGST)
- Store details + customer info
- Payment status stamp
- Downloadable from any bill

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/products | List products |
| GET | /api/products/barcode/:code | Barcode lookup |
| POST | /api/billing | Create bill |
| GET | /api/billing/:id/pdf | Download invoice |
| POST | /api/payment/razorpay/order | Initiate payment |
| GET | /api/dashboard/stats | Dashboard data |
| GET | /api/ai/predictions | Stock AI predictions |
| GET | /api/ai/supplier-comparison | Anakin comparison |

---

## 🏗️ Production Deployment

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd backend
NODE_ENV=production npm start
```

