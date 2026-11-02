/**
 * MUSE ATELIER - Reactive Storage Engine & State Manager (v3.0)
 * 
 * Manages 4 core categories, designs/products inside each category,
 * customer orders, store settings, and real-time cross-tab synchronization.
 */

const STORAGE_KEYS = {
  PRODUCTS: 'muse_atelier_products_v3',
  CATEGORIES: 'muse_atelier_categories_v3',
  ORDERS: 'muse_atelier_orders_v3',
  SETTINGS: 'muse_atelier_settings_v3',
  CART: 'muse_atelier_cart_v2',
  WISHLIST: 'muse_atelier_wishlist_v2'
};

/**
 * Normalizes any phone number into international WhatsApp format.
 * - Handles Indian 10-digit, 11-digit (with 0), and 12-digit (with 91).
 * - Avoids duplicate +91 or double country codes.
 * - Returns clean digits for wa.me URL and formatted string for UI.
 */
function normalizeWhatsAppNumber(raw) {
  if (!raw) return { raw: '', display: '', clean: '', isValid: false, isEmpty: true };
  const str = String(raw).trim();
  if (!str) return { raw: '', display: '', clean: '', isValid: false, isEmpty: true };

  const digits = str.replace(/\D/g, '');
  if (!digits) return { raw, display: '', clean: '', isValid: false, isEmpty: true };

  // Indian numbers (10 digits)
  if (digits.length === 10) {
    const clean = '91' + digits;
    const display = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    return { raw, display, clean, isValid: true, isEmpty: false };
  }
  // 11 digits starting with 0
  if (digits.length === 11 && digits.startsWith('0')) {
    const d10 = digits.slice(1);
    const clean = '91' + d10;
    const display = `+91 ${d10.slice(0, 5)} ${d10.slice(5)}`;
    return { raw, display, clean, isValid: true, isEmpty: false };
  }
  // 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    const d10 = digits.slice(2);
    const clean = digits;
    const display = `+91 ${d10.slice(0, 5)} ${d10.slice(5)}`;
    return { raw, display, clean, isValid: true, isEmpty: false };
  }
  // Generic international numbers (7 - 15 digits)
  if (digits.length >= 7 && digits.length <= 15) {
    return { raw, display: '+' + digits, clean: digits, isValid: true, isEmpty: false };
  }

  return { raw, display: str, clean: digits, isValid: false, isEmpty: false };
}

if (typeof window !== 'undefined') {
  window.normalizeWhatsAppNumber = normalizeWhatsAppNumber;
}

// 4 Signature Tamil Ethnic Categories
const DEFAULT_CATEGORIES = [
  {
    id: "cat-traditional",
    name: "Traditional Pattu Pavadai",
    slug: "traditional-pattu-pavadai",
    subtitle: "Handwoven pure silk pattu pavadai with rich zari borders & traditional motifs",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
    enabled: true,
    order: 1
  },
  {
    id: "cat-festive",
    name: "Festive & Wedding Specials",
    slug: "festive-wedding",
    subtitle: "Royal bridal & grand festive lehengas crafted for memorable celebrations",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85",
    enabled: true,
    order: 2
  },
  {
    id: "cat-aari",
    name: "Aari Work & Designer Pavadai",
    slug: "aari-work-designer",
    subtitle: "Exquisite hand-embroidered aari, zardozi & stone embellishments",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
    enabled: true,
    order: 3
  },
  {
    id: "cat-daily",
    name: "Little Princess Daily Ethnic Wear",
    slug: "daily-ethnic",
    subtitle: "Comfortable, featherlight cotton-silk festive wear for young princesses",
    image: "https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85",
    enabled: true,
    order: 4
  }
];

// Curated designs mapped strictly into the 4 signature traditional categories
const DEFAULT_PRODUCTS = [
  // --- CATEGORY 1: TRADITIONAL PATTU PAVADAI ---
  {
    id: "prod-102",
    name: "Salem Pure Kanchipuram Silk Pattu Pavadai",
    category: "Traditional Pattu Pavadai",
    price: 1850,
    comparePrice: 2400,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85",
    description: "Handcrafted pure Kanchipuram mulberry silk pattu pavadai with rich golden zari borders and contrast pleating.",
    details: "100% Pure Mulberry Silk; Real Zari Weave; Salem Direct Manufacturer; Dry clean only.",
    sizes: ["2-3 Y", "4-5 Y", "6-8 Y", "9-11 Y"],
    colors: [
      { name: "Traditional Red", hex: "#8B0000" },
      { name: "Mustard Gold", hex: "#D4AF37" }
    ],
    isAvailable: true,
    badge: "Bestseller",
    order: 1,
    createdAt: "2026-02-01T12:00:00Z"
  },
  {
    id: "prod-107",
    name: "Royal Magenta Handloom Pattu Pavadai",
    category: "Traditional Pattu Pavadai",
    price: 2150,
    comparePrice: null,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
    description: "Traditional magenta and green silk pavadai with temple border detailing crafted for auspicious celebrations.",
    details: "Handloom Pure Silk; Rich Pallu / Daavani finish; Handcrafted in Salem.",
    sizes: ["1-2 Y", "3-4 Y", "5-6 Y", "7-8 Y"],
    colors: [
      { name: "Magenta & Parrot Green", hex: "#C71585" }
    ],
    isAvailable: true,
    badge: "New Arrival",
    order: 2,
    createdAt: "2026-03-01T15:20:00Z"
  },

  // --- CATEGORY 2: FESTIVE & WEDDING SPECIALS ---
  {
    id: "prod-101",
    name: "Grand Temple Border Wedding Pavadai",
    category: "Festive & Wedding Specials",
    price: 2800,
    comparePrice: 3500,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
    description: "Regal wedding festive pavadai set with broad temple borders and zari butta embroidery.",
    details: "Pure Raw Silk with Brocade; Double Zari Border; Matching Blouse Material included.",
    sizes: ["2-4 Y", "5-7 Y", "8-10 Y", "11-13 Y"],
    colors: [
      { name: "Temple Gold & Maroon", hex: "#800000" }
    ],
    isAvailable: true,
    badge: "Wedding Special",
    order: 1,
    createdAt: "2026-01-15T10:00:00Z"
  },
  {
    id: "prod-105",
    name: "Peacock Blue Festive Brocade Pattu Set",
    category: "Festive & Wedding Specials",
    price: 2250,
    comparePrice: null,
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
    description: "Vibrant peacock blue brocade pavadai with antique zari border designed for festivals and family celebrations.",
    details: "Brocade Silk; Comfortable Inner Cotton Lining; Salem Craftsmanship.",
    sizes: ["1-2 Y", "3-5 Y", "6-8 Y"],
    colors: [
      { name: "Peacock Blue", hex: "#005f73" }
    ],
    isAvailable: true,
    badge: null,
    order: 2,
    createdAt: "2026-02-18T09:15:00Z"
  },

  // --- CATEGORY 3: AARI WORK & DESIGNER PAVADAI ---
  {
    id: "prod-103",
    name: "Intricate Hand-Stitched Aari Work Designer Pavadai",
    category: "Aari Work & Designer Pavadai",
    price: 3200,
    comparePrice: null,
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
    description: "Bespoke designer pattu pavadai adorned with intricate Maggam & Aari stone embroidery, pearls, and cut-work.",
    details: "Hand Embroidered Aari Work; Raw Silk Base; Soft Butter Crepe Lining; Custom Stitching Available.",
    sizes: ["2-3 Y", "4-5 Y", "6-8 Y", "9-11 Y"],
    colors: [
      { name: "Royal Emerald & Rani Pink", hex: "#097969" }
    ],
    isAvailable: true,
    badge: "Designer Exclusive",
    order: 1,
    createdAt: "2026-02-14T16:00:00Z"
  },

  // --- CATEGORY 4: LITTLE PRINCESS DAILY ETHNIC WEAR ---
  {
    id: "prod-104",
    name: "Little Princess Floral Cotton Silk Pavadai",
    category: "Little Princess Daily Ethnic Wear",
    price: 950,
    comparePrice: 1200,
    image: "https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85",
    secondaryImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
    description: "Soft, breathable featherlight cotton-silk ethnic wear designed with vibrant floral motifs for playful comfort.",
    details: "Cotton-Silk Blend; Hypoallergenic Soft Inner Lining; Easy Care Hand Wash.",
    sizes: ["0-1 Y", "1-2 Y", "2-3 Y", "4-5 Y"],
    colors: [
      { name: "Pastel Pink & Yellow", hex: "#FFB6C1" }
    ],
    isAvailable: true,
    badge: "Daily Essential",
    order: 1,
    createdAt: "2026-02-22T11:00:00Z"
  }
];

// Initial Sample Orders for immediate demonstration in Admin
const DEFAULT_ORDERS = [
  {
    id: "ord-8041",
    customerName: "Aarav Sharma",
    mobile: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    email: "aarav.sharma@example.com",
    address: "42 MG Road, Indiranagar, Bengaluru - 560038",
    items: [
      { name: "Double-Breasted Italian Wool Blazer", size: "M", color: "Onyx Black", quantity: 1, price: 380 },
      { name: "Heavyweight Cotton Poplin Shirt", size: "L", color: "Optic White", quantity: 2, price: 145 }
    ],
    totalPrice: 670,
    status: "Confirmed",
    createdAt: "2026-03-30T14:20:00Z"
  },
  {
    id: "ord-8040",
    customerName: "Eleanor Vance",
    mobile: "+91 98112 34567",
    whatsapp: "+91 98112 34567",
    email: "eleanor@atelier.luxury",
    address: "B-14 Colaba Causeway, Mumbai - 400005",
    items: [
      { name: "Cocoon Cashmere & Wool Overcoat", size: "M", color: "Camel", quantity: 1, price: 650 }
    ],
    totalPrice: 650,
    status: "New",
    createdAt: "2026-03-30T10:15:00Z"
  },
  {
    id: "ord-8038",
    customerName: "Priya Patel",
    mobile: "+91 97234 56789",
    whatsapp: "+91 97234 56789",
    email: "priya.p@corp.in",
    address: "702 Jubilee Hills, Road No. 36, Hyderabad - 500033",
    items: [
      { name: "Silk Charmeuse Bias Evening Dress", size: "S", color: "Champagne", quantity: 1, price: 420 }
    ],
    totalPrice: 420,
    status: "Shipped",
    createdAt: "2026-03-29T18:40:00Z"
  }
];

class StoreManager {
  constructor() {
    this.broadcastChannel = null;
    this.subscribers = {
      products: [],
      categories: [],
      orders: [],
      settings: []
    };
    this.initBroadcastChannel();
    this.initStorageSync();
    this.normalizeData();
    this.syncFromBackend();
  }

  initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('muse_atelier_sync_v3');
        this.broadcastChannel.onmessage = (event) => {
          if (!event.data) return;
          const { type } = event.data;
          if (type === 'PRODUCTS_UPDATED') {
            this.notifySubscribers('products', this.getProducts());
          } else if (type === 'CATEGORIES_UPDATED') {
            this.notifySubscribers('categories', this.getCategories());
          } else if (type === 'ORDERS_UPDATED') {
            this.notifySubscribers('orders', this.getOrders());
          } else if (type === 'SETTINGS_UPDATED') {
            this.notifySubscribers('settings', this.getSettings());
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported:', err);
      }
    }
  }

  initStorageSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEYS.PRODUCTS) {
          this.notifySubscribers('products', this.getProducts());
        } else if (event.key === STORAGE_KEYS.CATEGORIES) {
          this.notifySubscribers('categories', this.getCategories());
        } else if (event.key === STORAGE_KEYS.ORDERS) {
          this.notifySubscribers('orders', this.getOrders());
        } else if (event.key === STORAGE_KEYS.SETTINGS) {
          this.notifySubscribers('settings', this.getSettings());
        }
      });
    }
  }

  subscribe(event, callback) {
    if (this.subscribers[event]) {
      this.subscribers[event].push(callback);
    }
  }

  notifySubscribers(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error('Subscriber callback error:', e); }
      });
    }
  }

  broadcast(type, payload = {}) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type, payload });
      } catch (e) {
        console.warn('Broadcast send failed:', e);
      }
    }
  }

  // Normalizes existing products to ensure they map cleanly to the 4 main categories and have images array
  normalizeData() {
    try {
      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProds) {
        let prods = JSON.parse(storedProds);
        let changed = false;
        prods = prods.map(p => {
          let cat = p.category;
          if (cat === "Outerwear") { cat = "Outerwear & Coats"; changed = true; }
          else if (cat === "Tailoring") { cat = "Tailoring & Suits"; changed = true; }
          else if (cat === "Dresses") { cat = "Dresses & Eveningwear"; changed = true; }
          else if (cat === "Knitwear" || cat === "Essentials" || cat === "Accessories") { cat = "Knitwear & Essentials"; changed = true; }

          // Ensure images array is present
          let images = p.images;
          if (!Array.isArray(images) || images.length === 0) {
            const imgs = [];
            if (p.image) imgs.push(p.image);
            if (p.secondaryImage && p.secondaryImage !== p.image) imgs.push(p.secondaryImage);
            images = imgs;
            changed = true;
          }

          return {
            ...p,
            category: cat,
            images,
            image: (images && images[0]) || p.image || "",
            secondaryImage: (images && images[1]) || p.secondaryImage || p.image || ""
          };
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
        }
      }
    } catch (e) {
      console.warn('Normalization warning:', e);
    }
  }

  getAuthToken() {
    try {
      if (window.Auth && typeof window.Auth.getSession === 'function') {
        const s = window.Auth.getSession();
        if (s && s.token) return s.token;
      }
      const raw = sessionStorage.getItem('muse_auth_session_v2') || localStorage.getItem('muse_auth_session_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token) return parsed.token;
      }
    } catch (e) {}
    return null;
  }

  async syncFromBackend() {
    try {
      // 1. Sync Settings from REST API
      const setRes = await fetch('/api/settings');
      if (setRes.ok) {
        const remoteSettings = await setRes.json();
        if (remoteSettings && typeof remoteSettings === 'object' && Object.keys(remoteSettings).length > 0) {
          const current = this.getSettings();
          const merged = { ...current, ...remoteSettings };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
          this.notifySubscribers('settings', merged);
        }
      }
    } catch (e) {
      // Backend may be offline or static
    }

    try {
      // 2. Sync Categories from REST API
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const remoteCats = await catRes.json();
        if (Array.isArray(remoteCats) && remoteCats.length > 0) {
          this.saveCategories(remoteCats, false);
          this.notifySubscribers('categories', remoteCats);
        }
      }
    } catch (e) {}

    try {
      // 3. Sync Products from REST API
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const remoteProds = await prodRes.json();
        if (Array.isArray(remoteProds) && remoteProds.length > 0) {
          const normalized = remoteProds.map(p => {
            const imgs = Array.isArray(p.images) && p.images.length > 0 
              ? p.images 
              : [p.image, p.secondaryImage].filter(Boolean);
            return {
              ...p,
              images: imgs,
              image: imgs[0] || p.image || '',
              secondaryImage: imgs[1] || p.secondaryImage || imgs[0] || ''
            };
          });
          this.saveProducts(normalized, false);
          this.notifySubscribers('products', normalized);
        }
      }
    } catch (e) {}

    // 4. Sync Orders if authenticated
    await this.syncOrdersFromBackend();
  }

  // ==========================================
  // 1. THE 4 MAIN CATEGORIES CRUD
  // ==========================================

  getCategories() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      }
    } catch (e) {
      console.warn('Categories read error:', e);
    }
    this.saveCategories(DEFAULT_CATEGORIES, false);
    return DEFAULT_CATEGORIES;
  }

  getCategoryById(id) {
    return this.getCategories().find(c => String(c.id) === String(id)) || null;
  }

  getCategoryByName(name) {
    if (!name) return null;
    return this.getCategories().find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
  }

  saveCategories(cats, triggerBroadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
      if (triggerBroadcast) {
        this.broadcast('CATEGORIES_UPDATED');
        this.notifySubscribers('categories', cats);
      }
      return true;
    } catch (e) {
      console.error('Failed to save categories:', e);
      return false;
    }
  }

  updateCategory(id, updates) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => String(c.id) === String(id));
    if (index === -1) return null;

    const oldName = categories[index].name;
    const updated = {
      ...categories[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    categories[index] = updated;

    // If category name was updated, update products that belong to this category as well
    if (updates.name && updates.name !== oldName) {
      const products = this.getProducts().map(p => {
        if (p.category === oldName) {
          return { ...p, category: updates.name };
        }
        return p;
      });
      this.saveProducts(products, false);
    }

    this.saveCategories(categories);
    return updated;
  }

  moveCategory(id, direction) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => String(c.id) === String(id));
    if (index === -1) return false;

    if (direction === 'up' && index > 0) {
      const temp = categories[index];
      categories[index] = categories[index - 1];
      categories[index - 1] = temp;
    } else if (direction === 'down' && index < categories.length - 1) {
      const temp = categories[index];
      categories[index] = categories[index + 1];
      categories[index + 1] = temp;
    } else {
      return false;
    }

    // Reassign order indices
    categories.forEach((cat, idx) => {
      cat.order = idx + 1;
    });

    this.saveCategories(categories);
    return true;
  }

  toggleCategoryStatus(id) {
    const category = this.getCategoryById(id);
    if (!category) return null;
    return this.updateCategory(id, { enabled: !category.enabled });
  }

  // ==========================================
  // 2. PRODUCTS / DESIGNS CRUD (WITHIN CATEGORIES)
  // ==========================================

  getProducts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => {
            if (!Array.isArray(p.images) || p.images.length === 0) {
              const imgs = [];
              if (p.image) imgs.push(p.image);
              if (p.secondaryImage && p.secondaryImage !== p.image) imgs.push(p.secondaryImage);
              p.images = imgs;
            }
            p.image = (p.images && p.images[0]) || p.image || '';
            p.secondaryImage = (p.images && p.images[1]) || p.secondaryImage || p.image || '';
            return p;
          });
        }
      }
    } catch (e) {
      console.warn('Products read error:', e);
    }
    const defaults = DEFAULT_PRODUCTS.map(p => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [p.image, p.secondaryImage].filter(Boolean)
    }));
    this.saveProducts(defaults, false);
    return defaults;
  }

  getProductsByCategory(categoryName) {
    const products = this.getProducts();
    if (!categoryName) return products;
    return products.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
  }

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => String(p.id) === String(id)) || null;
  }

  saveProducts(products, triggerBroadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      if (triggerBroadcast) {
        this.broadcast('PRODUCTS_UPDATED');
        this.notifySubscribers('products', products);
      }
      return true;
    } catch (e) {
      console.error('Failed to save products:', e);
      return false;
    }
  }

  addProduct(newProduct) {
    const products = this.getProducts();
    const id = newProduct.id || ('prod-' + Date.now());
    const images = Array.isArray(newProduct.images) && newProduct.images.length > 0
      ? newProduct.images
      : (newProduct.image ? [newProduct.image] : ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85"]);
    const image = images[0] || newProduct.image || "";
    const secondaryImage = images[1] || newProduct.secondaryImage || image;

    const product = {
      id,
      name: newProduct.name || "Untitled Garment",
      category: newProduct.category || "Traditional Pattu Pavadai",
      price: parseFloat(newProduct.price) || 0,
      comparePrice: newProduct.comparePrice ? parseFloat(newProduct.comparePrice) : null,
      images,
      image,
      secondaryImage,
      description: newProduct.description || "Crafted with precision and noble materials for contemporary elegance.",
      details: newProduct.details || "100% Premium Noble Fibers; Hand-finished seams; Dry clean.",
      sizes: Array.isArray(newProduct.sizes) && newProduct.sizes.length > 0 ? newProduct.sizes : ["S", "M", "L"],
      colors: Array.isArray(newProduct.colors) && newProduct.colors.length > 0 ? newProduct.colors : [{ name: "Onyx Black", hex: "#111111" }],
      isAvailable: typeof newProduct.isAvailable === 'boolean' ? newProduct.isAvailable : true,
      badge: newProduct.badge || null,
      order: Date.now(),
      createdAt: new Date().toISOString()
    };

    products.unshift(product);
    this.saveProducts(products);

    const token = this.getAuthToken();
    if (token) {
      fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      }).catch(err => console.warn('Backend product POST warning:', err));
    }

    return product;
  }

  async addProductAsync(newProduct) {
    const products = this.getProducts();
    const id = newProduct.id || ('prod-' + Date.now());
    const rawImages = Array.isArray(newProduct.images) && newProduct.images.length > 0
      ? newProduct.images
      : (newProduct.image ? [newProduct.image] : ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85"]);
    const images = rawImages.slice(0, 10);
    const image = images[0] || newProduct.image || "";
    const secondaryImage = images[1] || newProduct.secondaryImage || image;

    const product = {
      id,
      name: newProduct.name || "Untitled Garment",
      category: newProduct.category || "Traditional Pattu Pavadai",
      price: parseFloat(newProduct.price) || 0,
      comparePrice: newProduct.comparePrice ? parseFloat(newProduct.comparePrice) : null,
      images,
      image,
      secondaryImage,
      description: newProduct.description || "Crafted with precision and noble materials for contemporary elegance.",
      details: newProduct.details || "100% Premium Noble Fibers; Hand-finished seams; Dry clean.",
      sizes: Array.isArray(newProduct.sizes) && newProduct.sizes.length > 0 ? newProduct.sizes : ["S", "M", "L"],
      colors: Array.isArray(newProduct.colors) && newProduct.colors.length > 0 ? newProduct.colors : [{ name: "Onyx Black", hex: "#111111" }],
      isAvailable: typeof newProduct.isAvailable === 'boolean' ? newProduct.isAvailable : true,
      badge: newProduct.badge || null,
      order: Date.now(),
      createdAt: new Date().toISOString()
    };

    products.unshift(product);
    this.saveProducts(products);

    const token = this.getAuthToken();
    if (token) {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Server responded with HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      if (data && data.id) {
        product.id = data.id;
      }
    }

    return product;
  }

  async updateProductAsync(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => String(p.id) === String(id));
    if (index === -1) throw new Error(`Product #${id} not found in local catalog`);

    const existing = products[index];

    let images = updates.images;
    if (!Array.isArray(images)) {
      if (updates.image) {
        images = [updates.image, ...(existing.images || []).filter(img => img !== updates.image)];
      } else {
        images = existing.images || [existing.image, existing.secondaryImage].filter(Boolean);
      }
    }
    images = (images || []).slice(0, 10);
    const image = images[0] || updates.image || existing.image || "";
    const secondaryImage = images[1] || updates.secondaryImage || existing.secondaryImage || image;

    const updated = {
      ...existing,
      ...updates,
      images,
      image,
      secondaryImage,
      price: updates.price !== undefined ? parseFloat(updates.price) : existing.price,
      comparePrice: updates.comparePrice !== undefined ? (updates.comparePrice ? parseFloat(updates.comparePrice) : null) : existing.comparePrice,
      isAvailable: updates.isAvailable !== undefined ? Boolean(updates.isAvailable) : existing.isAvailable,
      updatedAt: new Date().toISOString()
    };

    products[index] = updated;
    this.saveProducts(products);

    const token = this.getAuthToken();
    if (token) {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Server responded with HTTP ${res.status}`);
      }
    }

    return updated;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => String(p.id) === String(id));
    if (index === -1) return null;

    const existing = products[index];

    let images = updates.images;
    if (!Array.isArray(images)) {
      if (updates.image) {
        images = [updates.image, ...(existing.images || []).filter(img => img !== updates.image)];
      } else {
        images = existing.images || [existing.image, existing.secondaryImage].filter(Boolean);
      }
    }
    const image = images[0] || updates.image || existing.image || "";
    const secondaryImage = images[1] || updates.secondaryImage || existing.secondaryImage || image;

    const updated = {
      ...existing,
      ...updates,
      images,
      image,
      secondaryImage,
      price: updates.price !== undefined ? parseFloat(updates.price) : existing.price,
      comparePrice: updates.comparePrice !== undefined ? (updates.comparePrice ? parseFloat(updates.comparePrice) : null) : existing.comparePrice,
      isAvailable: updates.isAvailable !== undefined ? Boolean(updates.isAvailable) : existing.isAvailable,
      updatedAt: new Date().toISOString()
    };

    products[index] = updated;
    this.saveProducts(products);

    const token = this.getAuthToken();
    if (token) {
      fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      }).catch(err => console.warn('Backend product PUT warning:', err));
    }

    return updated;
  }

  async deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => String(p.id) !== String(id));
    if (filtered.length === products.length) return false;
    this.saveProducts(filtered);

    const token = this.getAuthToken();
    let serverOk = true;
    if (token) {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        serverOk = res.ok;
      } catch (e) {
        console.warn('Backend product DELETE warning:', e);
      }
    }
    return serverOk;
  }

  toggleAvailability(id) {
    const product = this.getProductById(id);
    if (!product) return null;
    return this.updateProduct(id, { isAvailable: !product.isAvailable });
  }

  moveProduct(id, direction) {
    const products = this.getProducts();
    const index = products.findIndex(p => String(p.id) === String(id));
    if (index === -1) return false;

    const product = products[index];
    // Find all products in the same category
    const catProducts = products.filter(p => p.category === product.category);
    const catIndex = catProducts.findIndex(p => String(p.id) === String(id));

    if (direction === 'up' && catIndex > 0) {
      const prevProduct = catProducts[catIndex - 1];
      const realPrevIdx = products.findIndex(p => String(p.id) === String(prevProduct.id));
      products[index] = prevProduct;
      products[realPrevIdx] = product;
    } else if (direction === 'down' && catIndex < catProducts.length - 1) {
      const nextProduct = catProducts[catIndex + 1];
      const realNextIdx = products.findIndex(p => String(p.id) === String(nextProduct.id));
      products[index] = nextProduct;
      products[realNextIdx] = product;
    } else {
      return false;
    }

    this.saveProducts(products);
    return true;
  }

  // ==========================================
  // 3. CUSTOMER ORDERS TRACKING
  // ==========================================

  getOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
      }
    } catch (e) {
      console.warn('Orders read error:', e);
    }
    this.saveOrders(DEFAULT_ORDERS, false);
    return DEFAULT_ORDERS;
  }

  getOrderById(id) {
    return this.getOrders().find(o => String(o.id) === String(id)) || null;
  }

  saveOrders(orders, triggerBroadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      if (triggerBroadcast) {
        this.broadcast('ORDERS_UPDATED');
        this.notifySubscribers('orders', orders);
      }
      return true;
    } catch (e) {
      console.error('Failed to save orders:', e);
      return false;
    }
  }

  async syncOrdersFromBackend() {
    const token = this.getAuthToken();
    if (!token) return this.getOrders();

    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const remoteOrders = await res.json();
        if (Array.isArray(remoteOrders)) {
          this.saveOrders(remoteOrders, false);
          this.notifySubscribers('orders', remoteOrders);
          return remoteOrders;
        }
      }
    } catch (err) {
      console.warn('Backend orders sync failed:', err);
    }
    return this.getOrders();
  }

  async addOrder(orderData) {
    const payload = {
      customerName: orderData.customerName || 'Anonymous Client',
      mobile: orderData.mobile || '',
      whatsapp: orderData.whatsapp || orderData.mobile || '',
      email: orderData.email || '',
      address: orderData.address || '',
      items: Array.isArray(orderData.items) ? orderData.items : [],
      totalPrice: parseFloat(orderData.totalPrice) || 0,
      status: orderData.status || 'New'
    };

    let serverOrder = null;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        serverOrder = await res.json();
      }
    } catch (e) {
      console.warn('Backend order save failed, saving locally:', e);
    }

    const newOrder = serverOrder || {
      id: 'ord-' + Math.floor(1000 + Math.random() * 9000),
      ...payload,
      createdAt: new Date().toISOString()
    };

    const orders = this.getOrders();
    const exists = orders.some(o => String(o.id) === String(newOrder.id));
    if (!exists) {
      orders.unshift(newOrder);
      this.saveOrders(orders);
    }
    return newOrder;
  }

  async updateOrderStatus(id, newStatus) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => String(o.id) === String(id));
    if (index === -1) return null;

    orders[index].status = newStatus;
    orders[index].updatedAt = new Date().toISOString();
    this.saveOrders(orders);

    const token = this.getAuthToken();
    if (token) {
      try {
        await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (e) {
        console.warn('Backend order status update failed:', e);
      }
    }
    return orders[index];
  }

  async deleteOrder(id) {
    const token = this.getAuthToken();
    let serverSuccess = false;

    if (token) {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          serverSuccess = Boolean(data && data.success);
        } else if (res.status === 404) {
          serverSuccess = true;
        } else if (res.status === 401) {
          console.error('Unauthorized deletion attempt on order:', id);
          return false;
        }
      } catch (err) {
        console.warn('Backend deleteOrder error:', err);
      }
    } else {
      serverSuccess = true;
    }

    const orders = this.getOrders();
    const filtered = orders.filter(o => String(o.id) !== String(id));
    this.saveOrders(filtered);
    return serverSuccess;
  }

  // ==========================================
  // 4. STORE SETTINGS
  // ==========================================

  getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.categoryBanners === 'string') {
          try { parsed.categoryBanners = JSON.parse(parsed.categoryBanners); } catch (e) {}
        }
        return { ...window.DEFAULT_STORE_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Error reading settings from localStorage:', e);
    }
    return window.DEFAULT_STORE_CONFIG || {};
  }

  async saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      this.broadcast('SETTINGS_UPDATED');
      this.notifySubscribers('settings', updated);

      const token = this.getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers,
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.warn('Backend settings save error:', err);
      }

      return updated;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return null;
    }
  }

  // ==========================================
  // 5. METRICS & STATS
  // ==========================================

  getMetrics() {
    const products = this.getProducts();
    const categories = this.getCategories();
    const orders = this.getOrders();

    const total = products.length;
    const available = products.filter(p => p.isAvailable).length;
    const unavailable = total - available;
    const totalCategories = categories.length;
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => o.status === 'New').length;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price || 0), 0);

    return {
      total,
      available,
      unavailable,
      categories: totalCategories,
      totalOrders,
      newOrders,
      totalInventoryValue: totalInventoryValue.toLocaleString()
    };
  }

  // ==========================================
  // 6. FACTORY RESET & BACKUP
  // ==========================================

  resetToDefaults() {
    this.saveProducts(DEFAULT_PRODUCTS);
    this.saveCategories(DEFAULT_CATEGORIES);
    this.saveOrders(DEFAULT_ORDERS);
    if (window.DEFAULT_STORE_CONFIG) {
      this.saveSettings(window.DEFAULT_STORE_CONFIG);
    }
    return true;
  }

  exportData() {
    return JSON.stringify({
      version: "3.0",
      exportDate: new Date().toISOString(),
      settings: this.getSettings(),
      categories: this.getCategories(),
      products: this.getProducts(),
      orders: this.getOrders()
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.categories && Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      if (data.products && Array.isArray(data.products)) {
        this.saveProducts(data.products);
      }
      if (data.orders && Array.isArray(data.orders)) {
        this.saveOrders(data.orders);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(data.settings);
      }
      return { success: true, count: data.products ? data.products.length : 0 };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Global Singleton Instance
window.Store = new StoreManager();
