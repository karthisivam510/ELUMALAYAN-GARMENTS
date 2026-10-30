# MUSE ATELIER — Modern Luxury Clothing Store & Management System

An ultra-modern, premium clothing-store website featuring a public luxury storefront and an authenticated private admin panel. Built with an editorial aesthetic inspired by high-fashion houses (clean monochrome palette, sophisticated typography, large imagery, and mobile-first responsiveness).

---

## 🌟 Key Highlights

### 1. Public Storefront (`index.html`)
- **Strict 4 Main Categories Discipline**:
  - The storefront is organized strictly around **4 core foundational disciplines**:
    1. *Outerwear & Coats*
    2. *Tailoring & Suits*
    3. *Dresses & Eveningwear*
    4. *Knitwear & Essentials*
  - Curated category cards displaying large editorial photography, discipline index (`01` to `04`), and designs count.
- **Dynamic Category Showcase & Horizontal Design Slider**:
  - Selecting any category opens its dedicated design showcase.
  - **Mobile Touch Slider**: Fluid horizontal swipe/slider with native touch snap.
  - **Desktop Navigation**: Smooth horizontal scroll track with next/prev arrow controls.
  - **"View All Grid" Toggle**: Switch seamlessly between horizontal carousel mode and full responsive product grid without leaving the discipline.
  - Quick keyword search within the active category, in-stock availability toggle, and sorting options.
- **Product & Design Cards**:
  - Large portrait (3:4) photography with smooth zoom and secondary back view on hover.
  - Quick action floating overlay: **Quick Add** and **Instant WhatsApp Order**.
  - Price, compare-at discount price, stock status badge, and promotional tags (*New Arrival, Bestseller, Limited Edition*).
- **Interactive Product Detail Modal**:
  - High-resolution image zoom and secondary view thumbnails.
  - Dynamic stock indicator (*Available for Order* vs. *Currently Unavailable*).
  - Size selector with visual active states (*XS, S, M, L, XL, One Size*) and size guide.
  - Color swatches with live hex preview.
  - Quantity controls with live total computation.
  - Direct **"Instant Order via WhatsApp"** button.
  - Expandable accordion for Composition & Care, Complimentary Shipping & Global Returns.
- **Shopping Bag Slide-Over Drawer**:
  - Item listing with size, color, quantity adjustments, and removal.
  - Free shipping progress bar.
  - Real-time customer delivery status preview (`Order for: Aarav Sharma (+91 9876543210)`).
  - Direct **"Checkout via WhatsApp"** button.
- **Customer Identification & Order System (`#customer-info-modal`)**:
  - Pre-checkout customer identification step before dispatching WhatsApp orders.
  - **Required Fields**:
    - **Full Name**: Non-empty, minimum 2 characters.
    - **Mobile Number**: Strictly validated Indian 10-digit mobile number (`^[6-9]\d{9}$`) supporting `+91` format.
    - **WhatsApp Number**: Supports `+91` format or 10-digit mobile number, with convenient "Same as Mobile" auto-sync toggle.
  - **Optional Fields**:
    - **Email Address**: Validates standard email syntax if provided.
    - **Delivery Address**: Formatted into the order manifest if provided.
  - **Instant Field Validation**:
    - Highlights invalid fields with rose borders and contextual inline error messages.
    - Top alert banner notifying the user if information is missing or invalid.
  - **Structured WhatsApp Order Generation & Automatic Admin Tracking**:
    - Formats order manifest sent to store's WhatsApp number:
      ```
      NEW ORDER — MUSE ATELIER

      Customer Name: [Customer Name]
      Mobile: [Customer Number]
      WhatsApp: [WhatsApp Number]
      Email: [Email] (if provided)
      Delivery Address: [Address] (if provided)

      Products:
      - [Product Name]
      - Size: [Size]
      - Color: [Color]
      - Quantity: [Quantity]
      - Price: [Price]

      Total Price: [Total]
      ```
    - Automatically records the order in local database so it instantly appears in the Admin Orders tab!
- **Dedicated Concierge & Showroom Section**:
  - Instant WhatsApp chat launcher, showroom address, opening hours, and inquiry form.
- **Floating WhatsApp Concierge**: Persistent pulsating button on the bottom right corner.

---

### 2. Private Admin Console (`admin.html`)
The Admin Panel is reorganized into **5 streamlined primary sections** with a desktop sidebar and a compact mobile bottom navigation bar:

1. **DASHBOARD**:
   - Live KPI cards: Total Products, Available to Order, Unavailable / Sold, Categories (4), Customer Orders count.
   - Quick action bar: *+ Add Design*, *Manage Categories*, *View Orders*.
   - Side-by-side tables for **Recent Garments** (with instant status toggles) and **Recent Orders** (with live status pills and review links).

2. **CATEGORIES**:
   - Strictly showcases the **4 core main categories**.
   - View cover image, discipline index, description, and designs count inside each category.
   - **Reorder Categories**: Move Up (▲) and Move Down (▼) buttons.
   - **Enable / Disable Toggle**: Easily hide or show any category on the storefront.
   - **Edit Category Modal**: Update category title, subtitle description, and cover image.
   - Direct "Browse Designs →" shortcut to jump straight into editing products for that category.

3. **PRODUCTS / DESIGNS**:
   - **Category Selector Tabs**: Filter designs by *All* or any of the 4 categories with live design count badges.
   - **Within-Category Reordering**: Move designs Up (▲) or Down (▼) to customize visual sequence inside the category.
   - Search toolbar by title, ID, tag, and stock status.
   - **1-Click Availability Toggle**: Instantly flip any product between *Available* and *Unavailable*.
   - Add, Edit, and Delete designs with double-confirmation dialogs.

4. **ORDERS**:
   - Comprehensive customer order management.
   - Filter by status tabs: *All Orders*, *New*, *Confirmed*, *Shipped*, *Completed*, *Cancelled*.
   - Customer details: Full Name, Mobile, WhatsApp, Email, Delivery address.
   - **1-Click WhatsApp Concierge Button**: Directly open WhatsApp chat with the customer pre-filled with their order reference!
   - Ordered products breakdown: designs, selected sizes, colors, quantities, and item totals.
   - Live Status Dropdown (`New`, `Confirmed`, `Shipped`, `Completed`, `Cancelled`) with instant saving.

5. **STORE SETTINGS**:
   - **Essential Settings Form**: Store Name, Tagline, WhatsApp Concierge Number, Instagram Handle, Currency Symbol, Showroom Address, Concierge Email, Support Phone, and Top Announcement banner.
   - **Collapsible "Advanced Settings" Accordion**:
     - Keeps advanced options neatly hidden to eliminate visual clutter.
     - Master Password update form.
     - 1-Click JSON Catalog Backup Export & Import.
     - Factory Reset button to revert to initial curated sample archive.

---

## 🔑 Default Admin Credentials

| Parameter | Value |
| :--- | :--- |
| **Admin URL** | `http://localhost:8000/admin.html` (or `admin.html`) |
| **Username** | `admin` |
| **Password** | `muse2026!` |

> [!TIP]
> You can change the master password anytime in the Admin Panel under **Store Settings** → **Admin Security & Password**.

---

## 🚀 How to Run Locally

### Method 1: 1-Click Windows Launcher (Recommended)
Simply double-click:
```
start.bat
```
This automatically starts the server and opens `http://localhost:8000` in your default browser.

---

### Method 2: Using Python (Windows, macOS, Linux)
Open your terminal in the project directory (`d:\2 muse`) and execute:
```bash
python server.py
```
*(On macOS/Linux, you can also run `python3 server.py` or `./start.sh`)*

Then open your browser:
- Public Store: **[http://localhost:8000](http://localhost:8000)**
- Admin Panel: **[http://localhost:8000/admin.html](http://localhost:8000/admin.html)**

---

### Method 3: Direct File Opening (Zero Server Required)
Because the application is built with modern browser storage standards:
1. Double-click `index.html` in your file explorer to view the store.
2. Double-click `admin.html` to access the Admin Panel.

---

## 🌐 How to Deploy Online Easily

### Option 1: Netlify (Fastest — Under 1 Minute)
1. Go to **[Netlify Drop](https://app.netlify.com/drop)**.
2. Drag and drop the `d:\2 muse` folder into your browser window.
3. Your luxury store is instantly deployed online with a free SSL certificate!

---

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel` (or connect your GitHub repository at [vercel.com](https://vercel.com)).
2. In the project folder, run:
   ```bash
   vercel
   ```
3. Follow the prompts (use default settings). Deployment completes in seconds.

---

### Option 3: GitHub Pages (100% Free Hosting)
1. Initialize a git repository and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of MUSE ATELIER luxury clothing store"
   ```
2. Create a new repository on [GitHub](https://github.com) and push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
3. Go to **Settings** → **Pages** on your repository.
4. Under **Branch**, select `main` and root `/`, then click **Save**.
5. Your store will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

---

### Option 4: Render / Railway (Deploy with Python Server)
If you want to run `server.py` with SQLite:
- Build Command: *(None needed)*
- Start Command: `python server.py 8000`

---

## 🛠️ How to Customize Your Store

### 1. Store Name & Brand Logo
- **Via Admin Panel**: Navigate to **Store Settings** → Edit **Store Name** & **Tagline** → Click **Save & Sync Settings**.
- **Via Code**: Open `js/config.js` and modify `storeName` and `tagline`.

### 2. WhatsApp Number & Instagram
- In the Admin Panel under **Store Settings**:
  - Set your phone number in international format (e.g. `+14155552671` or `+919876543210`).
  - Set your Instagram handle (e.g. `yourbrand`).
  - When customers click "Order via WhatsApp", their chosen item, size, quantity, and price are pre-formatted for direct ordering.

### 3. Adding New Products & Changing Images
- Go to the **Admin Panel** (`admin.html`) → Click **+ Add Garment**.
- Enter the garment title, price, category, and size availability.
- Under **Garment Imagery**:
  - Click **Upload Image File** to select any photo from your computer.
  - Or paste any image URL.
  - Or choose from the **Curated Luxury Presets** gallery.
- Click **Save Garment**. It immediately appears on the public website!

---

## 📂 Project Structure

```
d:/2 muse/
│
├── index.html                 # Public Storefront Single-Page Application
├── admin.html                 # Private Authenticated Admin Portal
│
├── css/
│   └── style.css              # Bespoke typography, luxury monochrome theme & animations
│
├── js/
│   ├── config.js              # Store configuration, default parameters & photo presets
│   ├── storage.js             # Reactive storage engine, sample catalog & sync broadcast
│   ├── auth.js                # SHA-256 authentication manager & session security
│   ├── app.js                 # Storefront catalog, filtering, modal & cart controller
│   └── admin.js               # Admin dashboard, CRUD actions & settings management
│
├── server.py                  # Standalone Python HTTP & SQLite server
├── start.bat                  # 1-click Windows quick starter
├── start.sh                   # 1-click macOS / Linux starter
└── README.md                  # Detailed documentation & deployment guide
```

---

## ⚖️ License
Crafted with precision for **MUSE ATELIER**. Open for commercial and personal customization.
