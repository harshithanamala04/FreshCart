# 🌿 FreshCart — Farm-Fresh Organic E-Commerce Platform

> Production-grade, full-stack farm-to-table e-commerce platform specializing in 100% certified organic Indian fruits and vegetables.

---

## 📸 Screenshots & UI Preview

### 🌿 Landing Page & Hero Section
*Editorial aesthetic with live produce highlights, direct-from-farm guarantees, location selection, and instant search.*

![FreshCart Landing Page](screenshots/landing_page.png)

### 🧺 Harvest Selection & Produce Catalog
*Interactive produce catalog featuring dynamic category filters, freshness badges, ratings, stock indicators, and instant cart additions in ₹ INR.*

![FreshCart Harvest Selection](screenshots/dashboard.png)

### 🔐 Customer Sign-In & Authentication Modal
*Clean, responsive modal for user login and account creation with quick farm access guarantees.*

![FreshCart Sign-In Modal](screenshots/login.png)

---

## 📋 Table of Contents
1. [📸 Screenshots & UI Preview](#-screenshots--ui-preview)
2. [Architectural Overview](#-architectural-overview)
3. [Design System & Botanical Pastel Theme](#-design-system--botanical-pastel-theme)
4. [Technology Stack](#-technology-stack)
5. [Project Structure](#-project-structure)
6. [Prerequisites](#-prerequisites)
7. [Backend Setup (Django & PostgreSQL)](#-backend-setup-django--postgresql)
8. [Frontend Setup (Angular 18+ Standalone)](#-frontend-setup-angular-18-standalone)
9. [Database Schema & Models](#-database-schema--models)
10. [REST API Endpoints & Testing](#-rest-api-endpoints--testing)
11. [Angular Signals & Cart Architecture](#-angular-signals--cart-architecture)

---

## 🏛️ Architectural Overview

FreshCart employs a decoupled, production-ready micro-monorepo architecture:

- **Frontend (`:4200`)**: Angular (v18+) with standalone components, native Angular Signals reactivity, and custom SCSS design system.
- **Backend (`:8000`)**: Django 5.x with Django REST Framework (DRF), `django-cors-headers`, and `psycopg2`.
- **Database**: PostgreSQL (`freshcart_db`) running on port `5432` with transactional order placement and automatic stock deduction.
- **Localization**: Indian Rupee (`₹ INR`) currency formatting throughout, Indian produce varieties (e.g., *Shimla Royal Apples, Ratnagiri Alphonso Mangoes, Hydroponic Palak, Nashik Pink Onions, Nagpur Sweet Oranges, Kodaikanal Avocados*), and Indian delivery slot windows (Dawn Harvest 6-9 AM, Express 2-hour, Evening 5-8 PM).

```
   ┌────────────────────────────────┐         REST JSON API
   │   Angular 18+ Frontend         │ ◄──────────────────────────► ┌──────────────────────────────┐
   │   • Standalone Components      │     http://localhost:8000/   │   Django 5 REST Backend      │
   │   • Angular Signals (Cart)     │                              │   • DRF ModelViewSets        │
   │   • Botanical Pastel System    │                              │   • Stock Deductions (Atomic)│
   └────────────────────────────────┘                              │   • Seed Data (14 items)     │
                                                                   └──────────────┬───────────────┘
                                                                                  │ psycopg2
                                                                                  ▼
                                                                   ┌──────────────────────────────┐
                                                                   │   PostgreSQL 18 Database     │
                                                                   │   DB: freshcart_db           │
                                                                   └──────────────────────────────┘
```

---

## 🎨 Design System & Botanical Pastel Theme

FreshCart is built around a calming, editorial aesthetic inspired by morning dew on organic farm leaves:

| Token / Layer | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#FAF8F5` | Warm oat milk / cream canvas for clean readability |
| **Surface Cards** | `#FFFFFF` | Elevated produce cards with soft ambient shadow |
| **Primary Botanical** | `#2E5C3E` / `#417050` | Forest & sage green for primary actions & organic badges |
| **Sage Light Accent** | `#EEF5F0` | Pill background, badge background, and active states |
| **Sage Border** | `#D8EADB` | Subtle border around pills, inputs, and delivery meters |
| **Peach Blush** | `#FDEEE9` / `#C86842` | Discount badges, notifications, and secondary highlights |
| **Morning Lemon** | `#FEF8EB` / `#9E7418` | Free delivery threshold progress meter alert & guarantees |
| **Editorial Headings**| `Playfair Display` | Editorial serif typography for headings |
| **Geometric Body** | `Plus Jakarta Sans` | Modern geometric sans-serif for UI, numbers, and tags |

---

## 🛠️ Technology Stack

- **Frontend**:
  - Angular 18+ (Standalone Components, Signals, `computed`, `effect`)
  - SCSS / Vanilla CSS Custom Design Tokens
  - Modern Web APIs (`@keyframes`, backdrop blur, CSS grid, touch-friendly scroll)
- **Backend**:
  - Python 3.12+ & Django 5.x / 6.x
  - Django REST Framework (DRF) 3.14+
  - `django-cors-headers` (configured for `:4200`)
  - `django-filter` for category & search filters
- **Database**:
  - PostgreSQL with `psycopg2-binary`

---

## 📂 Project Structure

```
FreshCart/
├── backend/
│   ├── freshcart_core/
│   │   ├── __init__.py
│   │   ├── settings.py           # PostgreSQL DB, CORS, DRF, & static/media settings
│   │   ├── urls.py               # Main URL router
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── store/
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py             # Category, Product, Order, OrderItem
│   │   ├── serializers.py        # Nested & transactional DRF serializers
│   │   ├── views.py              # CategoryViewSet, ProductViewSet, OrderViewSet
│   │   ├── urls.py               # DefaultRouter endpoints
│   │   ├── admin.py              # Django Admin with inlines & search
│   │   └── management/
│   │       └── commands/
│   │           └── seed_data.py  # 14 authentic Indian organic produce items
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                      # Local environment variables
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── index.html            # Google Fonts (Playfair Display & Plus Jakarta Sans)
│   │   ├── styles.scss           # Global botanical pastel design system tokens
│   │   ├── main.ts               # Standalone bootstrap with provideHttpClient()
│   │   └── app/
│   │       ├── app.ts / .html / .scss  # Shell layout, footer & toast alerts
│   │       ├── models/
│   │       │   ├── category.model.ts
│   │       │   ├── product.model.ts
│   │       │   ├── order.model.ts
│   │       │   └── cart.model.ts
│   │       ├── services/
│   │       │   ├── api.service.ts      # DRF API integration with graceful fallback
│   │       │   └── cart.service.ts     # Angular Signals reactive cart & delivery meter
│   │       └── components/
│   │           ├── navbar/             # Logo, location picker, search, basket trigger
│   │           ├── hero-banner/        # Guarantees, dawn harvest badge, pillars
│   │           ├── category-filter/    # Scrollable pill filters
│   │           ├── product-card/       # Image lock, ₹ pricing, strikethrough, steppers
│   │           ├── product-grid/       # Responsive grid with sorting & empty states
│   │           ├── cart-drawer/        # Slide-over cart, free delivery progress, slots
│   │           ├── checkout-modal/     # Multi-step checkout, slot & UPI/COD selectors
│   │           └── order-success-modal/# Order confirmation with unique FC-2026 reference
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
├── screenshots/
│   ├── landing_page.png          # Hero banner & navigation showcase
│   ├── dashboard.png             # Produce catalog & dynamic category filters
│   └── login.png                 # Member authentication modal
└── README.md
```

---

## ⚡ Prerequisites

- **Node.js**: v18+ (tested with v24) & npm
- **Python**: 3.10+ (tested with 3.12)
- **PostgreSQL**: 14+ (installed and running on port 5432)

---

## 🚀 Backend Setup (Django & PostgreSQL)

### 1. Create PostgreSQL Database
Ensure your PostgreSQL server is running. Create the `freshcart_db` database:

**Using psql:**
```bash
psql -U postgres -c "CREATE DATABASE freshcart_db;"
```

**Or using Python:**
```python
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

conn = psycopg2.connect(dbname='postgres', user='postgres', password='YOUR_PASSWORD', host='localhost', port=5432)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()
cur.execute("CREATE DATABASE freshcart_db;")
cur.close()
conn.close()
```

### 2. Configure Environment
In `backend/.env`, verify or update your database credentials:
```env
DEBUG=True
SECRET_KEY=django-insecure-freshcart-organic-super-secret-key-2026-prod
DB_NAME=freshcart_db
DB_USER=postgres
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
```

### 3. Install Dependencies & Run Migrations
```bash
cd backend
python -m pip install -r requirements.txt
python manage.py makemigrations store
python manage.py migrate
```

### 4. Seed Indian Farm-Fresh Produce Data
Populate the database with authentic Indian organic produce:
```bash
python manage.py seed_data
```
*Output: Seeds 4 categories ("Fresh Fruits", "Leafy Greens", "Daily Veggies", "Exotic & Gourmet") and 14 authentic items.*

### 5. Start the Django Server
```bash
python manage.py runserver 127.0.0.1:8000
```
Backend API will be accessible at: `http://127.0.0.1:8000/api/`
Django Admin: `http://127.0.0.1:8000/admin/`

---

## 🅰️ Frontend Setup (Angular 18+ Standalone)

### 1. Install NPM Dependencies
```bash
cd frontend
npm install
```

### 2. Start Angular Development Server
```bash
npm start
# or: npx ng serve --port 4200
```

### 3. Open in Browser
Navigate to `http://localhost:4200/`

---

## 📊 Database Schema & Models

### `Category`
- `name`: CharField (e.g., "Fresh Fruits", "Leafy Greens")
- `slug`: SlugField (unique, e.g., `fruits`, `greens`, `veggies`, `exotic`)
- `icon`: CharField (e.g. `🍎`, `🥬`, `🥕`, `🥑`)
- `display_order`: PositiveIntegerField

### `Product`
- `category`: ForeignKey to `Category`
- `name`: CharField (e.g., "Ratnagiri Alphonso Mangoes (Hapus)")
- `tagline`: CharField (e.g., "Naturally ripened GI-tagged authentic Alphonso mangoes")
- `description`: TextField
- `price`: DecimalField (`₹ INR`, e.g. `799.00`)
- `original_price`: DecimalField (e.g. `999.00` for strikethrough discount)
- `unit`: CharField (e.g., `1 kg`, `250g bunch`, `6 pcs box`)
- `stock_quantity`: PositiveIntegerField
- `freshness_tag`: CharField (e.g. `Just Harvested`, `GI Tagged GI-12`, `Pesticide Free`)
- `is_organic`: BooleanField (`True`)
- `image_url`: URLField
- `rating`: DecimalField (e.g. `4.9`)
- `review_count`: PositiveIntegerField
- `is_featured`: BooleanField

### `Order` & `OrderItem`
- `order_number`: Unique alphanumeric reference (`FC-2026-XXXXXX`)
- `customer_name`, `customer_phone`, `customer_email`, `delivery_address`
- `delivery_slot`: Selected delivery window (`Express 2 Hours`, `Morning 6-9 AM`, `Evening 5-8 PM`)
- `subtotal`: DecimalField
- `delivery_fee`: DecimalField (`₹0.00` if subtotal ≥ ₹299, else `₹40.00`)
- `total_amount`: DecimalField (`subtotal + delivery_fee`)
- `payment_method`: CharField (`UPI`, `CARD`, `COD`)
- `status`: CharField (`CONFIRMED`, `PACKING`, `OUT_FOR_DELIVERY`, `DELIVERED`)
- `items`: Relational `OrderItem`s created transactionally with stock deduction.

---

## 🌐 REST API Endpoints & Testing

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/categories/` | List all produce categories with item counts |
| `GET` | `/api/products/` | List all produce (supports `?category=greens`, `?search=spinach`, `?ordering=price`) |
| `GET` | `/api/products/<id>/` | Retrieve specific product details |
| `POST` | `/api/orders/` | Place order (validates stock, calculates totals, creates items) |
| `GET` | `/api/orders/track/<order_number>/` | Track order by reference code (`FC-2026-XXXXX`) |

### Example Order Placement Payload:
```json
POST /api/orders/
Content-Type: application/json

{
  "customer_name": "Priya Sharma",
  "customer_phone": "9876543210",
  "customer_email": "priya.sharma@example.in",
  "delivery_address": "Flat 402, Green Glen Orchid, 14th Main Road, Bandra West, Mumbai 400050",
  "delivery_slot": "Express Delivery: Within 2 Hours",
  "payment_method": "UPI",
  "notes": "Leave with building security if not available",
  "order_items": [
    { "product_id": 1, "quantity": 1 },
    { "product_id": 5, "quantity": 2 }
  ]
}
```

---

## 💡 Angular Signals & Cart Architecture

The application manages state via Angular Signals in `CartService`:

- **Signals**:
  - `cartItems = signal<CartItem[]>([])`
  - `isCartOpen = signal<boolean>(false)`
  - `isCheckoutOpen = signal<boolean>(false)`
  - `selectedLocation = signal<string>('Bandra West, Mumbai')`
  - `activeCategory = signal<string>('all')`
  - `searchQuery = signal<string>('')`

- **Computed Signals**:
  - `subtotal`: Sum of all items (`item.price * item.quantity`).
  - `deliveryFee`: Free (`₹0`) if `subtotal >= 299`, else `₹40`.
  - `grandTotal`: `subtotal + deliveryFee`.
  - `deliveryProgress`: Reactive calculation of percentage toward free delivery and remaining amount in ₹ INR.

---

## 🛡️ License
MIT License. Built for organic farm collectives and modern Indian households.
