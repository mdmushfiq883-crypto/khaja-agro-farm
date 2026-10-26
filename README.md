# Khaja Agro Farm — E-Commerce Platform

A production-ready, full-stack Bangladeshi farm-to-home e-commerce web platform for **Khaja Agro Farm** (খাজা এগ্রো ফার্ম), built for selling 100% pure cow milk, grass-fed halal beef, danedar desi ghee, naturally grown seasonal vegetables, and farm poultry.

---

## 🌟 Key Features

1. **Brand Identity & Aesthetic:**
   - Agricultural color palette: Forest Green (`#075B35`), Primary Farm Green (`#087A3E`), Leaf Green (`#42A85A`), Soft Ivory (`#FAFAF5`), and Light Sage (`#EDF5EC`).
   - Official cutout circular badge logo.
   - High-fidelity visual alignment with official homepage mockup.

2. **Customer Storefront:**
   - **Announcement Bar:** Top notification banner with toggle and editable text from admin.
   - **Main Header:** Product search (name & category), authentication links, social icons, and live cart button.
   - **Green Navigation:** Dynamic "All Categories" dropdown, Home, Shop, About Us, Contact Us.
   - **Hero Carousel Banner:** High-res farm banner with headline, tagline, and call-to-action.
   - **Shop by Category:** 5 dedicated cards with images and arrow navigation.
   - **Latest Products Grid:** Responsive cards with badges (Fresh, Best Seller, Popular, New), prices, ratings, and Add to Cart.
   - **Side Shopping Cart Drawer:** Slide-in cart with quantity steppers, live subtotal, and checkout shortcut.
   - **Dynamic Product Detail Page:** Image gallery, interactive variation switcher (size/weight/cut) updating SKU, price, stock status, and image dynamically.
   - **Trust & Benefits Strip:** 100% Fresh & Natural, Secure Payment, Reliable Delivery, Direct Hotline.
   - **Dark Green Footer:** Farm location, contact hotline, payment options, and policy links.

3. **Product Attributes & Variation Engine:**
   - Define custom attributes (Size, Weight, Volume, Packaging).
   - Multi-variation support per product (e.g., 500 ml vs. 1 Ltr, 500 gm vs. 1 Kg).
   - Independent SKU, regular price, sale price, stock quantity, and variation images.
   - Add-to-cart variation validation and server-side price protection.

4. **Inventory & Stock Management:**
   - Real-time stock tracking for simple and variable items.
   - Low-stock and out-of-stock warning badges.
   - Manual stock adjustment modal with audit movement ledger and reasons.
   - Prevention of negative stock.
   - Atomic stock deduction on checkout.
   - Automatic stock restoration upon order cancellation.

5. **Checkout & Payment:**
   - Server-side price recalculation (strictly rejects client-side price tampering).
   - Human-readable order numbering: `KAF-YYYYMMDD-XXXX`.
   - Immutable order snapshot preserving purchased product details, options, and prices.
   - Support for Cash on Delivery, bKash, Nagad, Rocket, and Manual Bank Transfer.
   - Admin-managed Send Money numbers (`01970271398`) and payment instructions.
   - Customer Transaction ID (TrxID) input for mobile banking verification.
   - Printable invoice and order confirmation receipt.

6. **Admin Dashboard (`/admin`):**
   - Role-based protected access.
   - Live metrics (Total orders, sales, low stock, customer counts).
   - Order management (order status transitions, payment verification, internal notes, printable receipts).
   - Product & Category management (safe category deletion with product reassignment).
   - Store settings, payment numbers, delivery charges, and social media channels.

7. **Security & Performance:**
   - Salted `scrypt` password hashing.
   - HttpOnly, SameSite session cookies.
   - SQL injection prevention via parameterized queries.
   - Sliding-window rate limiter for checkout and authentication.
   - Zero third-party runtime dependencies.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v22+ or v24+ (e.g. `agy-node` or system `node`)

### 1. Database Initialization & Seeding
```bash
agy-node src/db/seed.js
```

### 2. Start the Server
```bash
agy-node server.js
```
The server will start at:
- **Storefront:** [http://localhost:3000](http://localhost:3000)
- **Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)

### 3. Run Automated Tests
```bash
agy-node --test tests/all.test.js tests/server.test.js
```

---

## 🔐 Administrator Access

- **Admin Portal URL:** `/admin`
- **Default Admin Phone:** `01970271398`
- **Default Admin Email:** `mdmudhfiq883@gmail.com`
- **Default Initial Password:** Configured via `ADMIN_INITIAL_PASSWORD` environment variable (default: `KhajaAgro@2026`).

> [!IMPORTANT]
> Immediately change the administrator password upon first login via the admin profile settings.

---

## 📁 Project Structure

```
khaja-agro-farm/
├── server.js                     # HTTP server, routing, static asset server
├── package.json                  # Project definition
├── .env.example                  # Environment configuration template
├── src/
│   ├── config/config.js          # App constants, colors, business info
│   ├── db/
│   │   ├── database.js           # SQLite connection & transactions via node:sqlite
│   │   ├── schema.sql            # Relational database schema
│   │   └── seed.js               # Database migrations & seed data
│   ├── middleware/
│   │   ├── auth.js               # Cookie session parser & RBAC guards
│   │   └── rateLimiter.js        # IP rate limiter
│   ├── services/
│   │   ├── authService.js        # Customer & admin auth with scrypt
│   │   ├── productService.js     # Products & variations CRUD
│   │   ├── categoryService.js    # Category management & safe delete
│   │   ├── attributeService.js   # Dynamic attributes & values
│   │   ├── inventoryService.js   # Stock adjustments & movement ledger
│   │   ├── orderService.js       # Cart calculation, checkout & lifecycle
│   │   ├── settingService.js     # Payments, delivery, banners, social links
│   │   └── customerService.js    # Customer management & status
│   ├── routes/
│   │   ├── pageRoutes.js         # Storefront page rendering
│   │   ├── apiRoutes.js          # REST APIs
│   │   └── adminRoutes.js        # Admin portal routes
│   ├── views/
│   │   ├── layout.js             # Master HTML shell & header/footer
│   │   ├── homeView.js           # Homepage matching mockup
│   │   ├── shopView.js           # Product catalog & filters
│   │   ├── productDetailView.js  # Interactive variation product view
│   │   ├── checkoutView.js       # Checkout form & payment options
│   │   ├── orderSuccessView.js   # Confirmation & printable invoice
│   │   ├── customerViews.js      # Login, Register, Account
│   │   ├── adminViews.js         # Admin dashboard & login
│   │   ├── adminOrdersView.js    # Orders management
│   │   ├── adminProductsView.js  # Product & variation builder
│   │   ├── adminInventoryView.js # Inventory & stock adjustment modal
│   │   ├── adminCategoriesView.js# Categories & reassignment
│   │   ├── adminAttributesView.js# Dynamic attributes & options
│   │   └── adminSettingsView.js  # Payment & store settings
│   └── utils/
│       ├── formatters.js         # BDT (৳) currency & date formatters
│       └── security.js           # Scrypt hashing, random order numbers
├── public/
│   ├── css/style.css             # Brand styling & responsive layout
│   ├── js/app.js                 # Cart drawer & dynamic variation switcher
│   └── images/                   # Cropped mockup assets & official logo
└── tests/
    ├── all.test.js               # Business logic, variations & inventory tests
    └── server.test.js            # HTTP server & REST API integration tests
```
