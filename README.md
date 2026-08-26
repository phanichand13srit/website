# Arshith Fresh - Full Stack Architecture (HTML/CSS Frontend + MongoDB Backend)

A complete, clean e-commerce platform for **Arshith Fresh**.

---

## 📁 Complete Clean Directory Structure

```text
folder3/
│
├── 📂 backend/                   # Complete MongoDB Database & REST API Layer
│   ├── 📂 config/
│   │   └── db.js                 # Self-hosted MongoDB connection (Mongoose)
│   ├── 📂 models/                # Database Schemas
│   │   ├── Product.js            # Product Schema (Oils, Spices, Ghee, Seeds, etc.)
│   │   ├── User.js               # Customer & Admin User accounts
│   │   ├── Order.js              # Checkout orders & status tracking
│   │   └── Collection.js         # Category collections
│   ├── 📂 routes/                # REST API Endpoints
│   │   ├── productRoutes.js      # /api/products (CRUD)
│   │   ├── orderRoutes.js        # /api/orders (Checkout & Admin)
│   │   ├── userRoutes.js         # /api/users (Login & Registration)
│   │   └── collectionRoutes.js   # /api/collections
│   ├── .env                      # Database URI & Port (mongodb://127.0.0.1:27017/arshith_fresh)
│   ├── seed.js                   # Starter database seeder (populates MongoDB with sample items)
│   ├── server.js                 # Express API server entry point
│   └── package.json              # Backend dependencies (express, mongoose, cors, dotenv)
│
├── 📂 admin/                     # Admin Portal (Clean HTML Pages)
│   ├── dashboard.html            # Main Admin dashboard & analytics
│   ├── products.html             # Product stock & catalog manager
│   ├── product-detail.html       # Add / Edit product
│   ├── orders.html               # Orders list & tracking
│   ├── collections.html          # Category manager
│   ├── inventory.html            # SKU & variant tracking
│   ├── customers.html            # Customer accounts
│   └── login.html                # Admin authentication
│
├── 📂 assets/                    # Shared Static Assets
│   ├── css/                      # Centralized, modular stylesheets
│   │   ├── style.css             # Main storefront styling
│   │   ├── admin.css             # Unified Admin portal styling
│   │   ├── auth.css              # Login & registration styling
│   │   ├── cart.css              # Cart & checkout styling
│   │   └── pages.css             # Subpages & policy styling
│   ├── js/
│   │   └── script.js             # Main interactive storefront JavaScript
│   └── images/
│       └── banners/              # Category hero & promotional banners
│
├── 📂 pages/                     # Storefront Subpages
│   ├── categories/               # Product category pages (spices, oils, ghee, etc.)
│   ├── auth/                     # Customer account pages (login, register, forgot-password)
│   ├── policies/                 # Privacy, Refund, Shipping, Terms
│   ├── about-us.html             # Brand story & company mission
│   ├── cart.html                 # Dedicated shopping cart page
│   ├── checkout.html             # Checkout flow
│   ├── collections.html          # Main collection directory
│   ├── product.html              # Product details page
│   ├── profile.html              # User account profile
│   ├── seller.html               # Seller onboarding
│   ├── blog.html                 # Blog & recipes
│   └── track-order.html          # Order tracking lookup page
│
├── 🌐 index.html                 # Main Homepage / Storefront Landing Page
└── 📄 README.md                  # Project documentation
```

---

## 🚀 How to Run

### 1. Start Your MongoDB Backend API
Ensure your self-hosted MongoDB is running, then start the backend server:
```bash
cd backend
npm start
```
- API will run at **`http://localhost:5000/api`**.

### 2. Populate Initial Database Items (Optional)
To insert starter organic products, collections, and an admin account into MongoDB:
```bash
cd backend
npm run seed
```

### 3. Open the Frontend
- **Customer Store**: Open [index.html](file:///c:/Users/Phani%20Chand/OneDrive/Desktop/folder3/index.html) or run with Live Server.
- **Admin Dashboard**: Open [admin/dashboard.html](file:///c:/Users/Phani%20Chand/OneDrive/Desktop/folder3/admin/dashboard.html).
