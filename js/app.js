/**
 * MUSE ATELIER - Public Storefront Controller
 * 
 * Handles catalog display, filtering, search, sorting, product detail modal,
 * shopping cart, WhatsApp concierge ordering, and real-time synchronization.
 */

// Cart State Manager
class CartManager {
  constructor() {
    this.items = this.loadCart();
  }

  loadCart() {
    try {
      const data = localStorage.getItem('muse_atelier_cart_v2');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('muse_atelier_cart_v2', JSON.stringify(this.items));
      this.updateUI();
    } catch (e) {
      console.error('Cart save error:', e);
    }
  }

  addItem(product, size = 'M', quantity = 1, color = null) {
    const existingIndex = this.items.findIndex(item => 
      item.id === product.id && item.selectedSize === size && item.selectedColor === (color ? color.name : null)
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        selectedSize: size,
        selectedColor: color ? color.name : (product.colors && product.colors[0] ? product.colors[0].name : 'Default'),
        quantity: quantity
      });
    }

    this.saveCart();
    App.showToast(`Added "${product.name}" to your shopping bag.`);
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.saveCart();
    }
  }

  updateQuantity(index, delta) {
    if (this.items[index]) {
      this.items[index].quantity += delta;
      if (this.items[index].quantity <= 0) {
        this.removeItem(index);
      } else {
        this.saveCart();
      }
    }
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  clear() {
    this.items = [];
    this.saveCart();
  }

  updateUI() {
    const count = this.getTotalCount();
    const countBadges = document.querySelectorAll('.cart-count-badge');
    countBadges.forEach(badge => {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    });

    const cartDrawer = document.getElementById('cart-drawer-items');
    const cartFooter = document.getElementById('cart-drawer-footer');
    const cartSubtotal = document.getElementById('cart-drawer-subtotal');
    const freeShippingBar = document.getElementById('free-shipping-progress');
    const freeShippingText = document.getElementById('free-shipping-text');

    if (!cartDrawer) return;

    if (this.items.length === 0) {
      cartDrawer.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
          <svg class="w-12 h-12 mb-3 stroke-[1.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="font-serif-editorial text-2xl text-zinc-900 mb-1">Your bag is empty</p>
          <p class="text-xs text-zinc-500 max-w-xs mb-6">Discover timeless silhouettes and sartorial elegance in our latest collection.</p>
          <button onclick="App.closeCart(); App.scrollToCatalog();" class="btn-primary-luxury text-xs py-2 px-6">
            Explore Collection
          </button>
        </div>
      `;
      if (cartFooter) cartFooter.classList.add('hidden');
      return;
    }

    if (cartFooter) cartFooter.classList.remove('hidden');

    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const currency = settings.currencySymbol || '₹';
    const subtotal = this.getSubtotal();
    const threshold = settings.freeShippingThreshold || 1500;

    if (cartSubtotal) {
      cartSubtotal.textContent = `${currency}${subtotal.toLocaleString()}`;
    }

    if (freeShippingBar && freeShippingText) {
      freeShippingBar.style.width = '100%';
      freeShippingText.innerHTML = `✨ <strong>Complimentary Express Delivery</strong> across India`;
    }

    cartDrawer.innerHTML = this.items.map((item, idx) => `
      <div class="flex gap-4 py-4 border-b border-zinc-100 last:border-none">
        <img src="${item.image}" alt="${item.name}" class="w-20 h-24 object-cover object-top rounded-sm bg-zinc-100 flex-shrink-0" />
        <div class="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start gap-2">
              <h4 class="font-serif-editorial text-lg text-zinc-900 leading-snug line-clamp-1">${item.name}</h4>
              <button onclick="App.cart.removeItem(${idx})" class="text-zinc-400 hover:text-zinc-900 p-1 text-xs transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="text-xs text-zinc-500 mt-0.5">Size: <span class="font-medium text-zinc-700">${item.selectedSize}</span> · Color: <span class="font-medium text-zinc-700">${item.selectedColor}</span></p>
          </div>
          <div class="flex justify-between items-center mt-3">
            <div class="inline-flex items-center border border-zinc-200 rounded-sm">
              <button onclick="App.cart.updateQuantity(${idx}, -1)" class="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 text-sm">−</button>
              <span class="w-8 text-center text-xs font-medium">${item.quantity}</span>
              <button onclick="App.cart.updateQuantity(${idx}, 1)" class="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 text-sm">+</button>
            </div>
            <span class="font-medium text-sm text-zinc-900">${currency}${(item.price * item.quantity).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Update Customer details preview in cart drawer
    const customerSummary = document.getElementById('cart-customer-summary');
    const customerActionBtn = document.getElementById('cart-customer-action-btn');
    if (customerSummary && customerActionBtn) {
      const cust = App.loadCustomerInfo ? App.loadCustomerInfo() : null;
      if (cust && cust.name && cust.mobile) {
        customerSummary.innerHTML = `Order for: <strong class="text-zinc-900">${cust.name}</strong> (${cust.mobile})`;
        customerActionBtn.textContent = 'Edit';
      } else {
        customerSummary.textContent = 'Details will be verified before placing order';
        customerActionBtn.textContent = 'Enter Details';
      }
    }
  }
}

// Main Storefront Application
const App = {
  cart: null,
  activeCategory: 'Traditional Pattu Pavadai',
  viewMode: 'carousel', // 'carousel' or 'grid'
  searchQuery: '',
  sortBy: 'featured',
  onlyAvailable: false,
  selectedProduct: null,
  selectedSize: '2-3 Y',
  selectedColor: null,
  selectedQuantity: 1,
  modalGalleryImages: [],
  modalActiveImageIndex: 0,
  touchStartX: 0,
  touchEndX: 0,

  init() {
    this.cart = new CartManager();

    // Default to the first enabled category
    if (window.Store) {
      const categories = window.Store.getCategories().filter(c => c.enabled !== false);
      if (categories.length > 0) {
        this.activeCategory = categories[0].name;
      }
    }

    this.applySettings();
    this.renderMainCategories();
    this.renderCategoryShowcase();
    this.cart.updateUI();
    this.initEventListeners();

    // Fetch live settings directly from /api/settings on load to guarantee dynamic branding & categories
    fetch('/api/settings')
      .then(r => r.json())
      .then(liveSettings => {
        if (liveSettings && typeof liveSettings === 'object') {
          if (window.Store) {
            const current = window.Store.getSettings() || {};
            window.Store.settings = { ...current, ...liveSettings };
            try { localStorage.setItem('eluma_settings', JSON.stringify(window.Store.settings)); } catch (e) {}
          }
          this.applySettings();
          this.renderMainCategories();
        }
      })
      .catch(err => console.warn('Settings dynamic sync notice:', err));

    // Welcome Lead Capture Modal (2.5s delay for new visitors, non-intrusive)
    this.initWelcomeLeadModal();

    // Listen for live updates from Admin Panel
    if (window.Store) {
      window.Store.subscribe('products', () => {
        this.renderMainCategories();
        this.renderCategoryShowcase();
      });
      window.Store.subscribe('categories', () => {
        this.renderMainCategories();
        this.renderCategoryShowcase();
      });
      window.Store.subscribe('settings', () => {
        this.applySettings();
        this.renderMainCategories();
        this.renderCategoryShowcase();
      });
    }
  },

  initEventListeners() {
    // Keyboard escape to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeWelcomeLeadModal(true);
        this.closeCustomerModal();
        this.closeProductModal();
        this.closeCart();
        this.closeMobileMenu();
      }
    });
  },

  applySettings() {
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;

    // Company Brand Logo Dynamic Update (site_logo || brandLogo)
    const logoSrc = settings.site_logo || settings.brandLogo;
    if (logoSrc) {
      document.querySelectorAll('.brand-logo-img, #header-brand-logo, img[src*="logo.png"], img[src*="logo-round.png"]').forEach(img => {
        img.src = logoSrc;
      });
    }

    // Favicon Dynamic Update
    if (settings.favicon) {
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(fav => {
        fav.href = settings.favicon;
      });
    }

    // Brand name
    document.querySelectorAll('.store-name-text').forEach(el => {
      el.textContent = settings.storeName || "Elumalayan Garments";
    });

    // Tagline
    document.querySelectorAll('.store-tagline-text').forEach(el => {
      el.textContent = settings.tagline || "Traditional Elegance, Made for Little Princesses!";
    });

    // Announcement bar
    const announcementEl = document.getElementById('announcement-bar') || document.getElementById('announcement-banner');
    const announcementTextEl = document.getElementById('announcement-text');
    if (announcementEl && announcementTextEl) {
      if (settings.showAnnouncement && settings.announcementText) {
        announcementTextEl.textContent = settings.announcementText;
        announcementEl.classList.remove('hidden');
      } else {
        announcementEl.classList.add('hidden');
      }
    }

    // Apply Festival & Seasonal Appearance Theme
    this.applyFestivalTheme();

    // WhatsApp links (Primary contact)
    const n1 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber || '9940773278') : { clean: '919940773278' };
    const cleanPhone = n1.clean;
    document.querySelectorAll('.whatsapp-link').forEach(el => {
      el.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello ' + (settings.storeName || 'Elumalayan Garments') + '! I would like to inquire about your collection.')}`;
      el.target = '_blank';
    });

    // Instagram links
    document.querySelectorAll('.instagram-link').forEach(el => {
      const url = settings.instagramUrl || `https://www.instagram.com/${(settings.instagramHandle || 'poorani_pattu_pavadai').replace('@', '')}`;
      el.href = url;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });

    // Contact info
    const emailEl = document.getElementById('store-email-display');
    if (emailEl) emailEl.textContent = settings.supportEmail || "contact@elumalayangarments.com";

    const phoneEl = document.getElementById('store-phone-display');
    if (phoneEl) phoneEl.textContent = settings.supportPhone || "+91 99407 73278";

    const addressEl = document.getElementById('store-address-display');
    if (addressEl) {
      const addr = settings.address || "Elumalayan Garments\n97/12 D, Alraj St,\nSwaminathapuram,\nSalem – 636009,\nTamil Nadu, India.";
      addressEl.innerHTML = addr.replace(/\n/g, '<br>');
    }

    const hoursEl = document.getElementById('store-hours-display');
    if (hoursEl) hoursEl.innerHTML = (settings.openingHours || "Mon – Sat: 09:30 – 21:00\nSun: 10:00 – 20:00").replace(/\n/g, '<br>');
  },

  applyFestivalTheme() {
    if (window.FestivalEngine) {
      const settings = window.Store ? window.Store.getSettings() : (window.DEFAULT_STORE_CONFIG || {});
      const active = window.FestivalEngine.getCurrentFestival(settings);
      window.FestivalEngine.applyThemeToDOM(active);
    }
  },

  // ========================================================
  // 1. RENDER THE 4 CORE MAIN CATEGORIES DYNAMICALLY
  // Reads dynamic titles and cover photos from /api/settings:
  // - settings.category_X_title & settings.category_X_image
  // - settings.featured_categories array
  // - settings.categoryBanners map
  // - Fallback to Salem silk photography
  // ========================================================

  renderMainCategories() {
    const container = document.getElementById('main-categories-grid');
    if (!container) return;

    const allProducts = window.Store ? window.Store.getProducts() : [];
    const settings = window.Store ? window.Store.getSettings() : (window.DEFAULT_STORE_CONFIG || {});

    // Parse custom banners & featured categories
    let featuredList = [];
    if (settings.featured_categories) {
      try {
        featuredList = typeof settings.featured_categories === 'string' ? JSON.parse(settings.featured_categories) : settings.featured_categories;
      } catch (e) { featuredList = []; }
    }
    const customBanners = (settings.categoryBanners && typeof settings.categoryBanners === 'object') ? settings.categoryBanners : {};

    const DEFAULT_SLOTS = [
      {
        slot: 1,
        title: "Traditional Pattu Pavadai",
        subtitle: "Handwoven pure silk pattu pavadai with rich zari borders & traditional motifs",
        fallbackImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85"
      },
      {
        slot: 2,
        title: "Festive & Wedding Specials",
        subtitle: "Royal bridal & grand festive lehengas crafted for memorable celebrations",
        fallbackImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85"
      },
      {
        slot: 3,
        title: "Aari Work & Designer Pavadai",
        subtitle: "Exquisite hand-embroidered aari, zardozi & stone embellishments",
        fallbackImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85"
      },
      {
        slot: 4,
        title: "Little Princess Daily Wear",
        subtitle: "Comfortable, featherlight cotton-silk festive wear for young princesses",
        fallbackImage: "https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85"
      }
    ];

    const slotsData = DEFAULT_SLOTS.map((def, idx) => {
      const slotNum = idx + 1;
      const featItem = featuredList[idx] || {};

      // Title: settings.category_X_title -> featured_categories[idx].title -> default
      const title = settings[`category_${slotNum}_title`] || featItem.title || def.title;

      // Image: settings.category_X_image -> featured_categories[idx].image -> customBanners[title] -> latest product -> default
      let image = settings[`category_${slotNum}_image`] || featItem.image || customBanners[title] || '';

      const catProducts = allProducts.filter(p => {
        if (!p.category) return false;
        const pCat = p.category.toLowerCase();
        const sTitle = title.toLowerCase();
        return pCat === sTitle || pCat.includes(sTitle) || sTitle.includes(pCat);
      });

      if (!image && catProducts.length > 0) {
        const latestWithImg = catProducts.find(p => (Array.isArray(p.images) && p.images[0]) || p.image);
        if (latestWithImg) {
          image = (Array.isArray(latestWithImg.images) && latestWithImg.images[0]) || latestWithImg.image;
        }
      }

      if (!image) {
        image = def.fallbackImage;
      }

      return {
        slotNum,
        title,
        subtitle: def.subtitle,
        image,
        productCount: catProducts.length
      };
    });

    container.innerHTML = slotsData.map((item) => {
      const isActive = item.title.toLowerCase() === this.activeCategory.toLowerCase() ||
                       this.activeCategory.toLowerCase().includes(item.title.toLowerCase()) ||
                       item.title.toLowerCase().includes(this.activeCategory.toLowerCase());

      return `
        <div 
          onclick="App.selectCategory('${item.title.replace(/'/g, "\\'")}', true)"
          class="category-card group relative cursor-pointer border ${
            isActive 
              ? 'active-cat-card border-zinc-950 ring-2 ring-pink-700 bg-white' 
              : 'border-zinc-200 bg-zinc-50 hover:border-pink-300 hover:bg-white'
          } overflow-hidden transition-all duration-300 flex flex-col"
        >
          <!-- Image Container with Hover Zoom -->
          <div class="relative w-full aspect-[4/5] bg-zinc-100 overflow-hidden">
            <img 
              src="${item.image}" 
              alt="${item.title}" 
              loading="lazy" 
              class="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105" 
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

            <!-- Slot Number & Design Count Pill -->
            <div class="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span class="text-[10px] uppercase tracking-widest font-mono text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 border border-white/20">
                0${item.slotNum}
              </span>
              <span class="text-[10px] uppercase tracking-widest font-medium text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-0.5 border border-white/20">
                ${item.productCount} ${item.productCount === 1 ? 'Design' : 'Designs'}
              </span>
            </div>

            <!-- Active Selection Pill -->
            ${isActive ? `
              <div class="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-zinc-950 text-[10px] uppercase tracking-widest font-semibold shadow-md">
                <span class="w-1.5 h-1.5 rounded-full bg-pink-600 animate-pulse"></span>
                Active Collection
              </div>
            ` : ''}
          </div>

          <!-- Category Meta -->
          <div class="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white">
            <div>
              <h3 class="font-serif-editorial text-lg sm:text-xl text-zinc-900 font-semibold group-hover:text-pink-800 transition-colors">
                ${item.title}
              </h3>
              <p class="text-xs text-zinc-500 font-light mt-1.5 line-clamp-2 leading-relaxed">
                ${item.subtitle || 'Handcrafted traditional attire by Salem master weavers.'}
              </p>
            </div>
            
            <div class="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <span class="text-[11px] uppercase tracking-widest font-semibold ${isActive ? 'text-pink-700' : 'text-zinc-600'} group-hover:text-pink-700">
                ${isActive ? 'Viewing Collection' : 'Browse Collection'}
              </span>
              <span class="text-xs transition-transform duration-300 group-hover:translate-x-1 ${isActive ? 'text-pink-700' : 'text-zinc-400'}">
                &rarr;
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  selectCategory(categoryName, scrollTo = false) {
    if (!categoryName) return;

    // Fuzzy match in case called from legacy short name like 'Outerwear' or 'Tailoring'
    const categories = window.Store ? window.Store.getCategories() : [];
    const matched = categories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase() ||
      c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(c.slug || '')
    );

    if (matched) {
      this.activeCategory = matched.name;
    } else {
      this.activeCategory = categoryName;
    }

    this.renderMainCategories();
    this.renderCategoryShowcase();

    if (scrollTo) {
      const showcase = document.getElementById('category-showcase-container');
      if (showcase) {
        showcase.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  },

  // Backward compatibility alias
  setCategory(name) {
    this.selectCategory(name, true);
  },

  toggleCategoryViewMode() {
    this.viewMode = this.viewMode === 'carousel' ? 'grid' : 'carousel';
    this.renderCategoryShowcase();
  },

  scrollCarousel(direction) {
    const track = document.getElementById('design-carousel-track');
    if (!track) return;
    const scrollAmount = track.clientWidth * 0.75;
    track.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  },

  // ========================================================
  // 2. ACTIVE CATEGORY SHOWCASE & HORIZONTAL DESIGN SLIDER
  // ========================================================

  renderCategoryShowcase() {
    const container = document.getElementById('category-showcase-container');
    if (!container) return;

    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const currency = settings.currencySymbol || '₹';

    const currentCat = window.Store ? window.Store.getCategoryByName(this.activeCategory) : null;
    let products = window.Store ? window.Store.getProductsByCategory(this.activeCategory) : [];
    const totalInCat = products.length;

    // Apply Search Query if typed
    if (this.searchQuery) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(this.searchQuery) ||
        (p.description && p.description.toLowerCase().includes(this.searchQuery)) ||
        (p.badge && p.badge.toLowerCase().includes(this.searchQuery))
      );
    }

    // Apply Availability Filter
    if (this.onlyAvailable) {
      products = products.filter(p => p.isAvailable);
    }

    // Sort Products
    if (this.sortBy === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'newest') {
      products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (this.sortBy === 'alpha') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Build the Showcase HTML
    container.innerHTML = `
      <!-- Showcase Header with Category Title & Action Controls -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 border-b border-zinc-200">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[11px] uppercase tracking-[0.2em] font-semibold text-zinc-400">Current Discipline</span>
            <span class="text-zinc-300">/</span>
            <span class="text-[11px] uppercase tracking-widest text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5">
              ${totalInCat} ${totalInCat === 1 ? 'Design' : 'Designs Available'}
            </span>
          </div>
          <h3 class="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl text-zinc-950 font-light tracking-tight">
            ${this.activeCategory}
          </h3>
          <p class="text-sm text-zinc-500 font-light mt-1.5 max-w-xl leading-relaxed">
            ${currentCat && currentCat.subtitle ? currentCat.subtitle : 'Browse the complete archive of designs engineered for this discipline.'}
          </p>
        </div>

        <!-- Controls: View All Toggle & Carousel Navigation Arrows -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- View Mode Toggle Button -->
          <button 
            onclick="App.toggleCategoryViewMode()" 
            class="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-zinc-300 hover:border-zinc-900 bg-white text-zinc-900 transition-colors shadow-sm"
          >
            ${this.viewMode === 'carousel' ? `
              <svg class="w-4 h-4 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-13.5 18v-2.25z" />
              </svg>
              <span>View All Grid (${totalInCat})</span>
            ` : `
              <svg class="w-4 h-4 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span>Horizontal Slider</span>
            `}
          </button>

          <!-- Carousel Arrow Navigation (Visible in Carousel Mode) -->
          ${this.viewMode === 'carousel' ? `
            <div class="hidden sm:inline-flex items-center border border-zinc-300 divide-x divide-zinc-300 bg-white shadow-sm">
              <button 
                onclick="App.scrollCarousel(-1)" 
                class="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-900 hover:text-white transition-colors"
                title="Scroll Left"
                aria-label="Previous designs"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onclick="App.scrollCarousel(1)" 
                class="w-10 h-10 flex items-center justify-center text-zinc-700 hover:bg-zinc-900 hover:text-white transition-colors"
                title="Scroll Right"
                aria-label="Next designs"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Quick Filter Bar (Search within Category, In-stock toggle, Sorting) -->
      <div class="bg-zinc-50 border border-zinc-200 p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Search within category -->
        <div class="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder="Search inside ${this.activeCategory}..." 
            value="${this.searchQuery}"
            oninput="App.searchQuery = this.value.toLowerCase().trim(); App.renderCategoryShowcase();"
            class="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 text-xs focus:outline-none focus:border-zinc-900 placeholder:text-zinc-400"
          />
          <svg class="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <!-- In-stock only checkbox -->
          <label class="inline-flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
            <input 
              type="checkbox" 
              ${this.onlyAvailable ? 'checked' : ''}
              onchange="App.onlyAvailable = this.checked; App.renderCategoryShowcase();"
              class="rounded border-zinc-300 text-zinc-900 focus:ring-0" 
            />
            <span>Available Only</span>
          </label>

          <!-- Sort Selector -->
          <div class="flex items-center gap-2">
            <span class="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold hidden md:inline">Sort:</span>
            <select 
              onchange="App.sortBy = this.value; App.renderCategoryShowcase();"
              class="bg-white border border-zinc-200 text-xs py-2 px-3 focus:outline-none focus:border-zinc-900"
            >
              <option value="featured" ${this.sortBy === 'featured' ? 'selected' : ''}>Curated / Featured</option>
              <option value="newest" ${this.sortBy === 'newest' ? 'selected' : ''}>Newest Pieces</option>
              <option value="alpha" ${this.sortBy === 'alpha' ? 'selected' : ''}>Alphabetical (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Mobile Touch Swipe Hint (in Carousel Mode) -->
      ${this.viewMode === 'carousel' && products.length > 1 ? `
        <div class="sm:hidden flex items-center justify-between text-[11px] text-zinc-400 mb-3 px-1">
          <span class="flex items-center gap-1.5">
            <span>←</span> Swipe to explore designs <span>→</span>
          </span>
          <span class="text-[10px] font-mono">${products.length} Designs</span>
        </div>
      ` : ''}

      <!-- Design Products: Carousel or Grid Container -->
      ${products.length === 0 ? `
        <div class="py-16 text-center bg-zinc-50 border border-zinc-200">
          <div class="w-12 h-12 mx-auto mb-3 text-zinc-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full stroke-[1.2]">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h4 class="font-serif-editorial text-2xl text-zinc-800 mb-1">No Designs Found</h4>
          <p class="text-xs text-zinc-500 max-w-sm mx-auto mb-4 font-light">No garments inside "${this.activeCategory}" match your current filter keywords.</p>
          <button onclick="App.resetFilters()" class="btn-secondary-luxury text-xs py-2 px-5">
            Reset Category Filters
          </button>
        </div>
      ` : this.viewMode === 'carousel' ? `
        <!-- Horizontal Carousel Track -->
        <div id="design-carousel-track" class="carousel-track flex gap-4 sm:gap-5 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar">
          ${products.map(product => this.renderProductCardHtml(product, currency, 'carousel')).join('')}
        </div>
      ` : `
        <!-- Full Product Grid (Clean 2-Column on Mobile, Multi-Column on Desktop) -->
        <div class="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          ${products.map(product => this.renderProductCardHtml(product, currency, 'grid')).join('')}
        </div>
      `}
    `;
  },

  // Helper to render consistent, editorial product card HTML (Catalog-Only Mode)
  renderProductCardHtml(product, currency, mode = 'carousel') {
    const isSoldOut = !product.isAvailable;
    const primaryImg = (product.images && product.images[0]) || product.image;
    const secondaryImg = (product.images && product.images.length > 1) 
      ? product.images[1] 
      : (product.secondaryImage && product.secondaryImage !== primaryImg ? product.secondaryImage : null);
    const photoCount = (product.images && product.images.length) || 1;

    const cardClasses = mode === 'carousel' 
      ? 'carousel-item-card group flex flex-col bg-white border border-zinc-200/80 cursor-pointer transition-all hover:border-zinc-900 hover:shadow-lg'
      : 'product-card group flex flex-col bg-white border border-zinc-200/80 cursor-pointer transition-all hover:border-zinc-900 hover:shadow-lg';

    return `
      <div class="${cardClasses}" onclick="App.openProductModal('${product.id}')">
        <!-- Image Box with hover zoom and secondary image -->
        <div class="relative w-full aspect-[3/4] bg-zinc-100 overflow-hidden">
          <img 
            src="${primaryImg}" 
            alt="${product.name}" 
            loading="lazy" 
            decoding="async"
            class="responsive-garment-img w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105" 
          />

          ${secondaryImg ? `
            <img 
              src="${secondaryImg}" 
              alt="${product.name} alternate angle" 
              loading="lazy" 
              decoding="async"
              class="responsive-garment-img img-secondary absolute inset-0 w-full h-full object-cover object-top" 
            />
          ` : ''}

          <!-- Badges -->
          <div class="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1.5 z-10">
            ${isSoldOut ? `
              <span class="badge-luxury bg-zinc-900 text-white shadow-sm">
                Unavailable
              </span>
            ` : product.badge ? `
              <span class="badge-luxury bg-white/95 backdrop-blur-sm text-zinc-900 border border-zinc-200/80 shadow-sm">
                ${product.badge}
              </span>
            ` : ''}
            ${photoCount > 1 ? `
              <span class="badge-luxury bg-black/50 text-white backdrop-blur-xs text-[9px] font-mono shadow-xs">
                ${photoCount} Photos
              </span>
            ` : ''}
          </div>

          <!-- Quick WhatsApp Inquiry Floating Overlay -->
          <div class="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3 sm:bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex z-20">
            <button 
              type="button"
              onclick="event.stopPropagation(); App.inquireOnWhatsApp('${product.id}')"
              class="w-full min-h-[44px] bg-zinc-950/95 hover:bg-emerald-700 text-white text-[11px] uppercase tracking-wider py-2.5 px-3 backdrop-blur-sm transition-colors text-center font-medium flex items-center justify-center gap-1.5 shadow-md"
            >
              <svg class="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Inquire on WhatsApp</span>
            </button>
          </div>
        </div>

        <!-- Product Meta -->
        <div class="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block mb-1">
              ${product.category}
            </span>
            <h4 class="font-serif-editorial text-base sm:text-lg text-zinc-950 group-hover:text-zinc-600 transition-colors leading-snug line-clamp-1">
              ${product.name}
            </h4>
          </div>

          <div class="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between gap-1.5 sm:gap-2">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#4A0213] bg-pink-50 border border-pink-200/90 rounded truncate shadow-xs">
              Wholesale & Direct Orders
            </span>
            <button 
              type="button"
              onclick="event.stopPropagation(); App.inquireOnWhatsApp('${product.id}')"
              class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-emerald-700 hover:text-emerald-950 transition-colors py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90"
              title="Inquire on WhatsApp"
            >
              <svg class="w-3.5 h-3.5 fill-current text-emerald-600 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Inquire</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  resetFilters() {
    this.searchQuery = '';
    this.onlyAvailable = false;
    this.sortBy = 'featured';
    this.renderCategoryShowcase();
  },

  // --- PRODUCT MODAL ---

  openProductModal(id) {
    const product = window.Store ? window.Store.getProductById(id) : null;
    if (!product) return;

    this.selectedProduct = product;
    this.selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
    this.selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;
    this.selectedQuantity = 1;

    // Multi-image gallery preparation
    let galleryImages = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      galleryImages = [...product.images];
    } else {
      if (product.image) galleryImages.push(product.image);
      if (product.secondaryImage && product.secondaryImage !== product.image) galleryImages.push(product.secondaryImage);
    }
    if (galleryImages.length === 0) {
      galleryImages = ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85"];
    }

    this.modalGalleryImages = galleryImages;
    this.modalActiveImageIndex = 0;

    const modal = document.getElementById('product-detail-modal');
    const container = document.getElementById('product-detail-content');
    if (!modal || !container) return;

    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const currency = settings.currencySymbol || '₹';
    const isSoldOut = !product.isAvailable;
    const hasMultiple = galleryImages.length > 1;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12">
        <!-- Gallery Column -->
        <div class="md:col-span-6 flex flex-col gap-3">
          <!-- Main Image Display with Mobile CSS Scroll Snap Touch Carousel & Prev/Next Arrows -->
          <div 
            id="modal-main-image-container"
            class="relative w-full aspect-[3/4] bg-zinc-100 overflow-hidden border border-zinc-200/80 group"
          >
            <!-- Native Scroll Snap Touch Carousel Track -->
            <div 
              id="modal-gallery-carousel" 
              class="modal-gallery-track w-full h-full flex overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar"
              onscroll="App.handleModalGalleryScroll(this)"
            >
              ${galleryImages.map((img, idx) => `
                <div 
                  class="modal-gallery-slide snap-start w-full h-full flex-shrink-0 flex items-center justify-center bg-zinc-100 relative overflow-hidden" 
                  data-slide-index="${idx}"
                >
                  <img 
                    src="${img}" 
                    alt="${product.name} - Photo ${idx + 1}" 
                    loading="${idx === 0 ? 'eager' : 'lazy'}" 
                    decoding="async" 
                    class="w-full h-full object-contain sm:object-cover object-top select-none transition-transform duration-500 hover:scale-105 responsive-garment-img" 
                  />
                </div>
              `).join('')}
            </div>

            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
              ${isSoldOut ? `
                <div class="badge-luxury bg-zinc-900 text-white">Currently Unavailable</div>
              ` : product.badge ? `
                <div class="badge-luxury bg-white/95 backdrop-blur-sm text-zinc-900 border border-zinc-200">${product.badge}</div>
              ` : ''}
            </div>

            <!-- Counter Pill (Only if > 1 photo) -->
            ${hasMultiple ? `
              <div class="absolute bottom-3 right-3 z-10 pointer-events-none">
                <span id="modal-gallery-counter" class="text-[10px] font-mono bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded shadow-sm">
                  1 / ${galleryImages.length}
                </span>
              </div>
            ` : ''}

            <!-- Previous / Next Controls (Only if > 1 photo) -->
            ${hasMultiple ? `
              <button 
                type="button"
                onclick="event.stopPropagation(); App.prevModalGalleryImage()" 
                class="absolute left-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 hover:bg-zinc-950 hover:text-white text-zinc-900 flex items-center justify-center shadow-md transition-all z-20 focus:outline-none"
                title="Previous photo"
                aria-label="Previous photo"
              >
                <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              <button 
                type="button"
                onclick="event.stopPropagation(); App.nextModalGalleryImage()" 
                class="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 hover:bg-zinc-950 hover:text-white text-zinc-900 flex items-center justify-center shadow-md transition-all z-20 focus:outline-none"
                title="Next photo"
                aria-label="Next photo"
              >
                <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ` : ''}
          </div>

          <!-- Subtle Pagination Dots (Up to 10 photos) -->
          ${hasMultiple ? `
            <div id="modal-gallery-dots" class="flex items-center justify-center gap-1.5 py-1">
              ${galleryImages.map((_, idx) => `
                <button 
                  type="button" 
                  onclick="App.scrollToModalGallerySlide(${idx})" 
                  data-dot-index="${idx}"
                  class="modal-dot no-min-touch ${idx === 0 ? 'active' : ''} focus:outline-none" 
                  aria-label="Go to photo ${idx + 1}"
                ></button>
              `).join('')}
            </div>
          ` : ''}

          <!-- Thumbnails Strip (Only if > 1 photo) -->
          ${hasMultiple ? `
            <div id="modal-thumbnails-carousel" class="flex gap-2.5 overflow-x-auto pb-1 scroll-smooth hide-scrollbar">
              ${galleryImages.map((img, idx) => `
                <button 
                  type="button"
                  onclick="App.scrollToModalGallerySlide(${idx})" 
                  data-gallery-idx="${idx}"
                  class="modal-thumb-btn flex-shrink-0 w-14 h-18 sm:w-16 sm:h-20 border transition-all overflow-hidden focus:outline-none bg-white p-0.5 ${
                    idx === 0 ? 'border-zinc-950 ring-2 ring-zinc-950 shadow-xs' : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                  }"
                  title="View photo ${idx + 1}"
                >
                  <img src="${img}" alt="${product.name} view ${idx + 1}" loading="lazy" decoding="async" class="w-full h-full object-contain sm:object-cover" />
                </button>
              `).join('')}
            </div>
            <p class="text-[11px] text-zinc-400 text-center sm:hidden">
              Swipe photo or tap thumbnails to explore collection
            </p>
          ` : ''}
        </div>

        <!-- Details Column -->
        <div class="md:col-span-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 mb-2">
              <span>${product.category}</span>
              <span>·</span>
              <span class="${isSoldOut ? 'text-rose-500 font-semibold' : 'text-emerald-700 font-medium'}">
                ${isSoldOut ? 'Sold Out' : 'Available for Order'}
              </span>
            </div>

            <h1 class="font-serif-editorial text-3xl lg:text-4xl text-zinc-900 leading-tight mb-3">
              ${product.name}
            </h1>

            <div class="flex items-center gap-2.5 mb-6">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#4A0213] bg-pink-50 border border-pink-200/90 rounded shadow-xs">
                Wholesale & Direct Orders
              </span>
              <span class="text-xs font-medium text-zinc-500">· Direct Factory Pricing</span>
            </div>

            <hr class="border-zinc-200 my-6" />

            <!-- Editorial Description -->
            <p class="text-sm text-zinc-600 leading-relaxed mb-6 font-light">
              ${product.description}
            </p>

            <!-- Color Swatches -->
            ${product.colors && product.colors.length > 0 ? `
              <div class="mb-6">
                <div class="flex justify-between items-center text-xs mb-2">
                  <span class="uppercase tracking-wider font-semibold text-zinc-800">Color</span>
                  <span id="selected-color-label" class="text-zinc-500">${product.colors[0].name}</span>
                </div>
                <div class="flex gap-2">
                  ${product.colors.map((c, i) => `
                    <button 
                      onclick="App.selectModalColor('${c.name}', this)"
                      class="color-swatch-btn w-7 h-7 rounded-full border-2 p-0.5 transition-all ${i === 0 ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-400'}"
                      title="${c.name}"
                    >
                      <span class="block w-full h-full rounded-full" style="background-color: ${c.hex}"></span>
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Size Selector -->
            ${product.sizes && product.sizes.length > 0 ? `
              <div class="mb-6">
                <div class="flex justify-between items-center text-xs mb-2">
                  <span class="uppercase tracking-wider font-semibold text-zinc-800">Select Size</span>
                  <button onclick="App.showToast('True to luxury size. Order your regular fit.', 'info')" class="text-zinc-500 underline hover:text-zinc-900">Size Guide</button>
                </div>
                <div class="flex flex-wrap gap-2">
                  ${product.sizes.map((s, i) => `
                    <button 
                      onclick="App.selectModalSize('${s}', this)"
                      class="size-pill-btn px-4 py-2 text-xs font-medium border transition-all ${
                        s === this.selectedSize 
                          ? 'border-zinc-900 bg-zinc-900 text-white' 
                          : 'border-zinc-200 text-zinc-800 hover:border-zinc-900'
                      }"
                    >
                      ${s}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

          </div>

          <!-- Inquire on WhatsApp Action -->
          <div class="flex flex-col gap-3 pt-6 border-t border-zinc-200">
            <button 
              type="button"
              onclick="App.inquireModalOnWhatsApp()"
              class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md group"
            >
              <svg class="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Inquire on WhatsApp</span>
            </button>
            <p class="text-[11px] text-zinc-500 text-center font-light">
              Chat directly with our Salem showroom concierge for exact sizing, fabric samples, and pricing.
            </p>
          </div>

          <!-- Product Specs Accordion -->
          <div class="mt-4 border-t border-zinc-200 divide-y divide-zinc-200 text-xs">
            <details class="py-3 group cursor-pointer">
              <summary class="flex justify-between items-center font-medium text-zinc-900 list-none">
                <span>Composition & Garment Care</span>
                <span class="group-open:rotate-180 transition-transform text-zinc-400">▼</span>
              </summary>
              <p class="pt-2 text-zinc-500 leading-relaxed">
                ${product.details || "100% Premium Noble Fibers. Sustainably woven and finished by certified artisans."}
              </p>
            </details>
            <details class="py-3 group cursor-pointer">
              <summary class="flex justify-between items-center font-medium text-zinc-900 list-none">
                <span>Complimentary Shipping & Atelier Service</span>
                <span class="group-open:rotate-180 transition-transform text-zinc-400">▼</span>
              </summary>
              <p class="pt-2 text-zinc-500 leading-relaxed">
                Complimentary express delivery across Salem & across India. Direct atelier coordination via WhatsApp.
              </p>
            </details>
          </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  scrollToModalGallerySlide(index) {
    if (!this.modalGalleryImages || this.modalGalleryImages.length === 0) return;
    if (index < 0 || index >= this.modalGalleryImages.length) return;

    this.modalActiveImageIndex = index;
    const carousel = document.getElementById('modal-gallery-carousel');
    if (carousel) {
      const slideWidth = carousel.clientWidth || carousel.offsetWidth;
      carousel.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
    }

    this.updateModalGalleryIndicators(index);
  },

  handleModalGalleryScroll(carouselEl) {
    if (!carouselEl) return;
    const slideWidth = carouselEl.clientWidth || carouselEl.offsetWidth;
    if (!slideWidth) return;
    const newIdx = Math.round(carouselEl.scrollLeft / slideWidth);
    if (newIdx !== this.modalActiveImageIndex && newIdx >= 0 && newIdx < this.modalGalleryImages.length) {
      this.modalActiveImageIndex = newIdx;
      this.updateModalGalleryIndicators(newIdx);
    }
  },

  updateModalGalleryIndicators(index) {
    const counter = document.getElementById('modal-gallery-counter');
    if (counter) {
      counter.textContent = `${index + 1} / ${this.modalGalleryImages.length}`;
    }

    // Update Pagination Dots
    document.querySelectorAll('#modal-gallery-dots .modal-dot').forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update Thumbnail Strip
    document.querySelectorAll('.modal-thumb-btn').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-gallery-idx'), 10);
      if (idx === index) {
        btn.className = 'modal-thumb-btn flex-shrink-0 w-14 h-18 sm:w-16 sm:h-20 border transition-all overflow-hidden focus:outline-none bg-white p-0.5 border-zinc-950 ring-2 ring-zinc-950 shadow-xs opacity-100';
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        btn.className = 'modal-thumb-btn flex-shrink-0 w-14 h-18 sm:w-16 sm:h-20 border transition-all overflow-hidden focus:outline-none bg-white p-0.5 border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100';
      }
    });
  },

  setModalGalleryImage(index) {
    this.scrollToModalGallerySlide(index);
  },

  prevModalGalleryImage() {
    if (!this.modalGalleryImages || this.modalGalleryImages.length <= 1) return;
    const newIdx = (this.modalActiveImageIndex - 1 + this.modalGalleryImages.length) % this.modalGalleryImages.length;
    this.scrollToModalGallerySlide(newIdx);
  },

  nextModalGalleryImage() {
    if (!this.modalGalleryImages || this.modalGalleryImages.length <= 1) return;
    const newIdx = (this.modalActiveImageIndex + 1) % this.modalGalleryImages.length;
    this.scrollToModalGallerySlide(newIdx);
  },

  launchDirectWhatsApp(e) {
    if (e && e.preventDefault) e.preventDefault();
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const numbers = [
      settings.whatsappNumber1 || '9940773278',
      settings.whatsappNumber2 || '9940773278',
      settings.whatsappNumber3 || '9940773278'
    ].filter(Boolean);
    const targetNumber = numbers[0].replace(/\D/g, '');
    const cleanNum = targetNumber.length === 10 ? '91' + targetNumber : targetNumber;
    const text = encodeURIComponent(`Hello ${settings.storeName || 'Elumalayan Garments'}, I would like to inquire about your fine clothing collection.`);
    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
  },

  selectModalSize(size, btnEl) {
    this.selectedSize = size;
    document.querySelectorAll('.size-pill-btn').forEach(btn => {
      btn.className = 'size-pill-btn px-4 py-2 text-xs font-medium border border-zinc-200 text-zinc-800 hover:border-zinc-900 transition-all';
    });
    btnEl.className = 'size-pill-btn px-4 py-2 text-xs font-medium border border-zinc-900 bg-zinc-900 text-white transition-all';
  },

  selectModalColor(colorName, btnEl) {
    this.selectedColor = { name: colorName };
    const label = document.getElementById('selected-color-label');
    if (label) label.textContent = colorName;

    document.querySelectorAll('.color-swatch-btn').forEach(btn => {
      btn.classList.remove('border-zinc-900', 'ring-1', 'ring-zinc-900');
      btn.classList.add('border-zinc-200');
    });
    btnEl.classList.remove('border-zinc-200');
    btnEl.classList.add('border-zinc-900', 'ring-1', 'ring-zinc-900');
  },

  changeModalQty(delta) {
    this.selectedQuantity = Math.max(1, this.selectedQuantity + delta);
    const display = document.getElementById('modal-qty-display');
    if (display) display.textContent = this.selectedQuantity;
  },

  closeProductModal() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  // --- NEW VISITOR VIP WHATSAPP LEAD CAPTURE SYSTEM ---

  initWelcomeLeadModal() {
    try {
      if (localStorage.getItem('eluma_popup_closed') === 'true') {
        return;
      }
    } catch (e) {
      return;
    }

    // Elegant 2.5 second trigger after visitor arrives
    setTimeout(() => {
      try {
        if (localStorage.getItem('eluma_popup_closed') === 'true') {
          return;
        }
      } catch (e) {}

      this.openWelcomeLeadModal();
    }, 2500);
  },

  openWelcomeLeadModal() {
    const modal = document.getElementById('welcome-lead-modal');
    const backdrop = document.getElementById('welcome-lead-backdrop');
    const card = document.getElementById('welcome-lead-card');
    if (!modal) return;

    modal.classList.remove('hidden');
    setTimeout(() => {
      if (backdrop) {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
      }
      if (card) {
        card.classList.remove('opacity-0', 'scale-95');
        card.classList.add('opacity-100', 'scale-100');
      }
    }, 20);
  },

  closeWelcomeLeadModal(skipped = true) {
    try {
      localStorage.setItem('eluma_popup_closed', 'true');
    } catch (e) {}

    const modal = document.getElementById('welcome-lead-modal');
    const backdrop = document.getElementById('welcome-lead-backdrop');
    const card = document.getElementById('welcome-lead-card');
    if (!modal) return;

    if (backdrop && card) {
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0');
      card.classList.remove('opacity-100', 'scale-100');
      card.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 300);
    } else {
      modal.classList.add('hidden');
    }
  },

  handleWelcomeLeadSubmit(e) {
    e.preventDefault();
    const phoneInput = document.getElementById('welcome-lead-phone');
    const errorEl = document.getElementById('welcome-lead-error');
    if (!phoneInput) return;

    const raw = phoneInput.value.trim();
    const sanitized = this.sanitizeIndianPhone(raw);

    if (!sanitized.isValid) {
      phoneInput.classList.add('input-invalid');
      if (errorEl) {
        errorEl.textContent = 'Please enter a valid 10-digit Indian WhatsApp number.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    // Persist closed state immediately so popup is never shown again
    try {
      localStorage.setItem('eluma_popup_closed', 'true');
    } catch (e) {}

    // Save/update phone into local storage so future forms have it
    try {
      const existing = this.loadCustomerInfo() || {};
      existing.mobile = sanitized.formatted;
      existing.whatsapp = sanitized.formatted;
      existing.mobileDigits = sanitized.digits10;
      existing.whatsappDigits = sanitized.digits10;
      this.saveCustomerInfo(existing);
    } catch (err) {}

    // Register VIP lead in store database
    if (window.Store && typeof window.Store.addOrder === 'function') {
      window.Store.addOrder({
        customerName: 'VIP WhatsApp Member (' + sanitized.formatted + ')',
        mobile: sanitized.formatted,
        whatsapp: sanitized.formatted,
        email: '',
        address: '',
        items: [{
          productId: 'vip-lead',
          name: 'VIP WhatsApp Updates Registration',
          category: 'VIP Lead',
          size: 'N/A',
          color: 'N/A',
          quantity: 1,
          price: 0
        }],
        totalPrice: 0,
        status: 'New'
      }).catch(err => console.warn('Lead dispatch note:', err));
    }

    this.showToast('Thank you! You are now subscribed to VIP WhatsApp updates.', 'success');
    this.closeWelcomeLeadModal(false);
  },

  clearWelcomeLeadError() {
    const phoneInput = document.getElementById('welcome-lead-phone');
    const errorEl = document.getElementById('welcome-lead-error');
    if (phoneInput) phoneInput.classList.remove('input-invalid');
    if (errorEl) errorEl.classList.add('hidden');
  },

  // --- CATALOG-ONLY WHATSAPP INQUIRY HANDLERS ---

  inquireOnWhatsApp(productId) {
    const product = window.Store ? window.Store.getProductById(productId) : null;
    if (!product) return;
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const storeName = settings.storeName || 'Elumalayan Garments';
    const n1 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber || '9940773278') : { clean: '919940773278' };
    const cleanPhone = n1.clean || '919940773278';

    const message = `Hi ${storeName}, I would like to inquire about ${product.name}.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.showToast(`Connecting to WhatsApp concierge for "${product.name}"...`, 'success');
  },

  inquireModalOnWhatsApp() {
    if (!this.selectedProduct) return;
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const storeName = settings.storeName || 'Elumalayan Garments';
    const n1 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber || '9940773278') : { clean: '919940773278' };
    const cleanPhone = n1.clean || '919940773278';

    let message = `Hi ${storeName}, I would like to inquire about ${this.selectedProduct.name}.`;
    if (this.selectedSize || (this.selectedColor && this.selectedColor.name)) {
      const details = [];
      if (this.selectedSize) details.push(`Size: ${this.selectedSize}`);
      if (this.selectedColor && this.selectedColor.name) details.push(`Color: ${this.selectedColor.name}`);
      message += ` (${details.join(', ')})`;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    this.showToast(`Opening WhatsApp concierge for "${this.selectedProduct.name}"...`, 'success');
  },

  addModalToCart() {
    if (!this.selectedProduct) return;
    this.cart.addItem(this.selectedProduct, this.selectedSize, this.selectedQuantity, this.selectedColor);
    this.closeProductModal();
    this.openCart();
  },

  // --- CUSTOMER IDENTIFICATION & ORDER SYSTEM ---

  pendingCheckoutType: 'cart', // 'cart' or 'single'
  pendingSingleProduct: null,

  loadCustomerInfo() {
    try {
      const stored = localStorage.getItem('muse_customer_info_v2');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  saveCustomerInfo(info) {
    try {
      localStorage.setItem('muse_customer_info_v2', JSON.stringify(info));
      if (this.cart) {
        this.cart.updateUI();
      }
    } catch (e) {
      console.warn('Customer info save warning:', e);
    }
  },

  sanitizeIndianPhone(raw) {
    if (!raw) return { isValid: false, digits10: '', formatted: '', raw: '' };
    // Remove spaces, hyphens, brackets, dots
    let cleaned = String(raw).trim().replace(/[\s\-\(\)\.]/g, '');

    // Support +91, 91, or leading 0 prefix
    if (cleaned.startsWith('+91')) {
      cleaned = cleaned.slice(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }

    // Must be exactly 10 digits starting with 6, 7, 8, or 9
    const isValid = /^[6-9]\d{9}$/.test(cleaned);

    return {
      isValid,
      digits10: cleaned,
      formatted: isValid ? `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}` : raw,
      raw
    };
  },

  validateCustomerInfo(data) {
    const errors = {};
    const name = (data.name || '').trim();
    const mobileRaw = (data.mobile || '').trim();
    const whatsappRaw = (data.whatsapp || '').trim();
    const email = (data.email || '').trim();
    const address = (data.address || '').trim();

    // 1. Name validation (required, cannot be empty)
    if (!name || name.length < 2) {
      errors.name = 'Please enter your full name.';
    }

    // 2. Mobile number validation (required, valid Indian 10-digit number)
    const mobileCheck = this.sanitizeIndianPhone(mobileRaw);
    if (!mobileRaw) {
      errors.mobile = 'Mobile number is required.';
    } else if (!mobileCheck.isValid) {
      errors.mobile = 'Please enter a valid Indian 10-digit mobile number (e.g. 9876543210).';
    }

    // 3. WhatsApp number validation (required, supports +91 format)
    const whatsappCheck = this.sanitizeIndianPhone(whatsappRaw);
    if (!whatsappRaw) {
      errors.whatsapp = 'WhatsApp number is required.';
    } else if (!whatsappCheck.isValid) {
      errors.whatsapp = 'Please enter a valid WhatsApp number supporting +91 (e.g. +91 9876543210).';
    }

    // 4. Optional Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address (or leave blank).';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        name,
        mobile: mobileCheck.formatted || mobileRaw,
        mobileDigits: mobileCheck.digits10 || mobileRaw,
        whatsapp: whatsappCheck.formatted || whatsappRaw,
        whatsappDigits: whatsappCheck.digits10 || whatsappRaw,
        email,
        address
      }
    };
  },

  handleSameAsMobileToggle(checked) {
    const mobileInput = document.getElementById('cust-mobile');
    const whatsappInput = document.getElementById('cust-whatsapp');
    if (!whatsappInput) return;

    if (checked && mobileInput) {
      const val = mobileInput.value.trim();
      whatsappInput.value = val ? (val.startsWith('+91') ? val : `+91 ${val}`) : '';
      this.clearFieldError('cust-whatsapp');
    }
  },

  handleMobileInput(val) {
    this.clearFieldError('cust-mobile');
    const sameCheckbox = document.getElementById('cust-same-as-mobile');
    if (sameCheckbox && sameCheckbox.checked) {
      const whatsappInput = document.getElementById('cust-whatsapp');
      if (whatsappInput) {
        const cleanVal = (val || '').trim();
        whatsappInput.value = cleanVal ? (cleanVal.startsWith('+91') ? cleanVal : `+91 ${cleanVal}`) : '';
        this.clearFieldError('cust-whatsapp');
      }
    }
  },

  clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.remove('input-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
    const alertBox = document.getElementById('customer-form-alert');
    if (alertBox) alertBox.classList.add('hidden');
  },

  openCustomerModal(orderType = 'cart') {
    this.pendingCheckoutType = orderType;
    const modal = document.getElementById('customer-info-modal');
    if (!modal) return;

    // Pre-fill inputs with stored customer details if available
    const saved = this.loadCustomerInfo();
    const nameInput = document.getElementById('cust-name');
    const mobileInput = document.getElementById('cust-mobile');
    const whatsappInput = document.getElementById('cust-whatsapp');
    const emailInput = document.getElementById('cust-email');
    const addressInput = document.getElementById('cust-address');
    const sameCheckbox = document.getElementById('cust-same-as-mobile');

    if (saved) {
      if (nameInput) nameInput.value = saved.name || '';
      if (mobileInput) mobileInput.value = (saved.mobileDigits || saved.mobile || '').replace('+91', '').trim();
      if (whatsappInput) whatsappInput.value = saved.whatsapp || '';
      if (emailInput) emailInput.value = saved.email || '';
      if (addressInput) addressInput.value = saved.address || '';
      if (sameCheckbox) {
        sameCheckbox.checked = (saved.mobileDigits && saved.whatsappDigits && saved.mobileDigits === saved.whatsappDigits);
      }
    } else {
      if (sameCheckbox) sameCheckbox.checked = true;
    }

    // Update Order Summary Preview inside Customer Modal
    const countEl = document.getElementById('cust-modal-items-count');
    const totalEl = document.getElementById('cust-modal-total-price');
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const currency = settings.currencySymbol || '₹';

    if (orderType === 'single' && this.pendingSingleProduct) {
      const p = this.pendingSingleProduct;
      if (countEl) countEl.textContent = `1 Garment (${p.product.name})`;
      if (totalEl) totalEl.textContent = `${currency}${(p.product.price * p.quantity).toLocaleString()}`;
    } else {
      const itemsCount = this.cart ? this.cart.getTotalCount() : 0;
      const subtotal = this.cart ? this.cart.getSubtotal() : 0;
      if (countEl) countEl.textContent = `${itemsCount} Garment${itemsCount === 1 ? '' : 's'}`;
      if (totalEl) totalEl.textContent = `${currency}${subtotal.toLocaleString()}`;
    }

    // Reset error states
    ['cust-name', 'cust-mobile', 'cust-whatsapp', 'cust-email'].forEach(id => this.clearFieldError(id));
    const alertBox = document.getElementById('customer-form-alert');
    if (alertBox) alertBox.classList.add('hidden');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Focus first empty field
    setTimeout(() => {
      if (nameInput && !nameInput.value) {
        nameInput.focus();
      } else if (mobileInput && !mobileInput.value) {
        mobileInput.focus();
      }
    }, 100);
  },

  closeCustomerModal() {
    const modal = document.getElementById('customer-info-modal');
    if (modal) {
      modal.classList.add('hidden');
      const cartDrawer = document.getElementById('cart-drawer');
      const prodModal = document.getElementById('product-detail-modal');
      const cartOpen = cartDrawer && !cartDrawer.classList.contains('hidden');
      const prodOpen = prodModal && !prodModal.classList.contains('hidden');
      if (!cartOpen && !prodOpen) {
        document.body.style.overflow = '';
      }
    }
  },

  // Called when customer clicks "Checkout via WhatsApp"
  initiateCheckout() {
    if (this.cart.items.length === 0) {
      this.showToast('Your shopping bag is empty. Please select garments to order.', 'error');
      return;
    }

    const saved = this.loadCustomerInfo();
    // If customer details haven't been entered, ask for details
    if (!saved || !saved.name || !saved.mobile || !saved.whatsapp) {
      this.openCustomerModal('cart');
      return;
    }

    // If details already exist, open modal pre-filled for review/confirmation
    this.openCustomerModal('cart');
  },

  // Called when customer submits the customer information form
  async handleCustomerFormSubmit(e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById('cust-name').value,
      mobile: document.getElementById('cust-mobile').value,
      whatsapp: document.getElementById('cust-whatsapp').value,
      email: document.getElementById('cust-email').value,
      address: document.getElementById('cust-address').value
    };

    const validation = this.validateCustomerInfo(formData);

    if (!validation.isValid) {
      // Highlight invalid fields and display error messages
      for (const [field, errorMsg] of Object.entries(validation.errors)) {
        const inputId = `cust-${field}`;
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(`${inputId}-error`);
        if (input) input.classList.add('input-invalid');
        if (errorEl) {
          errorEl.textContent = errorMsg;
          errorEl.classList.remove('hidden');
        }
      }

      const alertBox = document.getElementById('customer-form-alert');
      const alertMsg = document.getElementById('customer-form-alert-msg');
      if (alertBox && alertMsg) {
        alertMsg.textContent = 'Please fill in all required customer details correctly.';
        alertBox.classList.remove('hidden');
      }
      return;
    }

    // Persist details if requested
    const saveCheck = document.getElementById('cust-save-details');
    if (saveCheck && saveCheck.checked) {
      this.saveCustomerInfo(validation.sanitized);
    }

    // Store & WhatsApp Configuration
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const currency = settings.currencySymbol || '₹';
    const storeName = settings.storeName || 'Elumalayan Garments';
    const c = validation.sanitized;

    let productsText = '';
    let totalFormatted = '';
    let orderItems = [];
    let numericTotal = 0;

    if (this.pendingCheckoutType === 'single' && this.pendingSingleProduct) {
      const p = this.pendingSingleProduct;
      const subtotal = (p.product.price * p.quantity).toLocaleString();
      productsText = `- ${p.product.name}\n- Size: ${p.size}\n- Color: ${p.color ? p.color.name : 'Default'}\n- Quantity: ${p.quantity}\n- Price: ${currency}${p.product.price}${p.quantity > 1 ? ` (Subtotal: ${currency}${subtotal})` : ''}`;
      totalFormatted = `${currency}${subtotal}`;
      orderItems = [{
        productId: p.product.id,
        name: p.product.name,
        category: p.product.category,
        size: p.size,
        color: p.color ? p.color.name : 'Default',
        quantity: p.quantity,
        price: p.product.price
      }];
      numericTotal = p.product.price * p.quantity;
    } else {
      const itemsList = this.cart.items.map(item => 
        `- ${item.name}\n- Size: ${item.selectedSize}\n- Color: ${item.selectedColor || 'Default'}\n- Quantity: ${item.quantity}\n- Price: ${currency}${(item.price * item.quantity).toLocaleString()}${item.quantity > 1 ? ` (${currency}${item.price} each)` : ''}`
      ).join('\n\n');
      productsText = itemsList;
      totalFormatted = `${currency}${this.cart.getSubtotal().toLocaleString()}`;
      orderItems = this.cart.items.map(item => ({
        productId: item.id,
        name: item.name,
        category: item.category,
        size: item.selectedSize,
        color: item.selectedColor || 'Default',
        quantity: item.quantity,
        price: item.price
      }));
      numericTotal = this.cart.getSubtotal();
    }

    // Save order in Database / Store ONLY ONCE
    let savedOrder = null;
    if (window.Store && typeof window.Store.addOrder === 'function') {
      savedOrder = await window.Store.addOrder({
        customerName: c.name,
        mobile: c.mobile,
        whatsapp: c.whatsapp,
        email: c.email || '',
        address: c.address || '',
        items: orderItems,
        totalPrice: numericTotal,
        status: 'New'
      });
    }

    const orderId = savedOrder ? savedOrder.id : ('ord-' + Math.floor(1000 + Math.random() * 9000));

    // Customer details block
    let customerBlock = `Order ID: #${orderId}\nCustomer Name: ${c.name}\nMobile: ${c.mobile}\nWhatsApp: ${c.whatsapp}`;
    if (c.email) {
      customerBlock += `\nEmail: ${c.email}`;
    }
    if (c.address) {
      customerBlock += `\nDelivery Address: ${c.address}`;
    }

    // Final formatted WhatsApp message
    const fullMessage = `NEW ORDER — ${storeName}\n\n${customerBlock}\n\nProducts:\n${productsText}\n\nTotal Price: ${totalFormatted}\n\n----------------------------------\nPlease confirm order availability and payment details. Thank you!`;

    // Close checkout modals
    this.closeCustomerModal();
    this.closeCart();
    this.closeProductModal();

    // Clear cart if completed cart checkout
    if (this.pendingCheckoutType === 'cart' && this.cart) {
      this.cart.clear();
    }

    // Collect all configured active WhatsApp numbers
    const contacts = [];
    const norm1 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber || '9940773278') : { isValid: true, display: '+91 99407 73278', clean: '919940773278' };
    if (norm1.isValid) {
      contacts.push({
        id: 1,
        label: 'WhatsApp 1 (Primary Concierge)',
        display: norm1.display,
        clean: norm1.clean
      });
    }
    if (settings.whatsappNumber2) {
      const norm2 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber2) : { isValid: false };
      if (norm2.isValid) {
        contacts.push({
          id: 2,
          label: 'WhatsApp 2 (Showroom)',
          display: norm2.display,
          clean: norm2.clean
        });
      }
    }
    if (settings.whatsappNumber3) {
      const norm3 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber3) : { isValid: false };
      if (norm3.isValid) {
        contacts.push({
          id: 3,
          label: 'WhatsApp 3 (Dispatch)',
          display: norm3.display,
          clean: norm3.clean
        });
      }
    }

    if (contacts.length === 0) {
      contacts.push({
        id: 1,
        label: 'WhatsApp 1 (Primary Concierge)',
        display: '+91 99407 73278',
        clean: '919940773278'
      });
    }

    // Launch Multi-WhatsApp Dispatch Modal
    this.openOrderDispatchModal({
      id: orderId,
      customerName: c.name,
      totalFormatted: totalFormatted,
      message: fullMessage,
      contacts: contacts
    });
  },

  // Called when customer clicks "Skip Contact Details & Chat Directly on WhatsApp"
  async skipCustomerModalToWhatsApp() {
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const currency = settings.currencySymbol || '₹';
    const storeName = settings.storeName || 'Elumalayan Garments';

    let productsText = '';
    let totalFormatted = '';
    let orderItems = [];
    let numericTotal = 0;

    if (this.pendingCheckoutType === 'single' && this.pendingSingleProduct) {
      const p = this.pendingSingleProduct;
      const subtotal = (p.product.price * p.quantity).toLocaleString();
      productsText = `- ${p.product.name}\n- Size: ${p.size}\n- Color: ${p.color ? p.color.name : 'Default'}\n- Quantity: ${p.quantity}\n- Price: ${currency}${p.product.price}${p.quantity > 1 ? ` (Subtotal: ${currency}${subtotal})` : ''}`;
      totalFormatted = `${currency}${subtotal}`;
      orderItems = [{
        productId: p.product.id,
        name: p.product.name,
        category: p.product.category,
        size: p.size,
        color: p.color ? p.color.name : 'Default',
        quantity: p.quantity,
        price: p.product.price
      }];
      numericTotal = p.product.price * p.quantity;
    } else {
      if (!this.cart || this.cart.items.length === 0) {
        this.showToast('Your shopping bag is empty. Please select garments to order.', 'error');
        return;
      }
      const itemsList = this.cart.items.map(item => 
        `- ${item.name}\n- Size: ${item.selectedSize}\n- Color: ${item.selectedColor || 'Default'}\n- Quantity: ${item.quantity}\n- Price: ${currency}${(item.price * item.quantity).toLocaleString()}${item.quantity > 1 ? ` (${currency}${item.price} each)` : ''}`
      ).join('\n\n');
      productsText = itemsList;
      totalFormatted = `${currency}${this.cart.getSubtotal().toLocaleString()}`;
      orderItems = this.cart.items.map(item => ({
        productId: item.id,
        name: item.name,
        category: item.category,
        size: item.selectedSize,
        color: item.selectedColor || 'Default',
        quantity: item.quantity,
        price: item.price
      }));
      numericTotal = this.cart.getSubtotal();
    }

    // Register order in database for store records
    let savedOrder = null;
    if (window.Store && typeof window.Store.addOrder === 'function') {
      try {
        savedOrder = await window.Store.addOrder({
          customerName: 'Direct WhatsApp Guest',
          mobile: 'Via WhatsApp Chat',
          whatsapp: 'Via WhatsApp Chat',
          email: '',
          address: '',
          items: orderItems,
          totalPrice: numericTotal,
          status: 'New'
        });
      } catch (e) {
        console.warn('Could not save guest order to backend:', e);
      }
    }

    const orderId = savedOrder ? savedOrder.id : ('ord-' + Math.floor(1000 + Math.random() * 9000));
    const fullMessage = `NEW ORDER INQUIRY — ${storeName}\n\nOrder ID: #${orderId}\nCustomer: Direct WhatsApp Guest (Contact details via chat)\n\nProducts:\n${productsText}\n\nTotal Price: ${totalFormatted}\n\n----------------------------------\nPlease confirm garment availability and tailored sizing. Thank you!`;

    // Close checkout modals
    this.closeCustomerModal();
    this.closeCart();
    this.closeProductModal();

    if (this.pendingCheckoutType === 'cart' && this.cart) {
      this.cart.clear();
    }

    // Collect all configured active WhatsApp numbers
    const contacts = [];
    const norm1 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber || '9940773278') : { isValid: true, display: '+91 99407 73278', clean: '919940773278' };
    if (norm1.isValid) {
      contacts.push({
        id: 1,
        label: 'WhatsApp 1 (Primary Concierge)',
        display: norm1.display,
        clean: norm1.clean
      });
    }
    if (settings.whatsappNumber2) {
      const norm2 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber2) : { isValid: false };
      if (norm2.isValid) {
        contacts.push({ id: 2, label: 'WhatsApp 2 (Showroom)', display: norm2.display, clean: norm2.clean });
      }
    }
    if (settings.whatsappNumber3) {
      const norm3 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(settings.whatsappNumber3) : { isValid: false };
      if (norm3.isValid) {
        contacts.push({ id: 3, label: 'WhatsApp 3 (Dispatch)', display: norm3.display, clean: norm3.clean });
      }
    }
    if (contacts.length === 0) {
      contacts.push({
        id: 1,
        label: 'WhatsApp 1 (Primary Concierge)',
        display: '+91 99407 73278',
        clean: '919940773278'
      });
    }

    this.showToast('Connecting to WhatsApp concierge with selected garments...', 'success');

    // Launch Multi-WhatsApp Dispatch Modal
    this.openOrderDispatchModal({
      id: orderId,
      customerName: 'Direct WhatsApp Guest',
      totalFormatted: totalFormatted,
      message: fullMessage,
      contacts: contacts
    });
  },

  // ========================================================
  // MULTI-WHATSAPP ORDER DISPATCH METHODS
  // ========================================================

  openOrderDispatchModal(dispatchData) {
    this.currentDispatch = dispatchData;
    this.dispatchedContacts = new Set();

    const modal = document.getElementById('order-dispatch-modal');
    if (!modal) return;

    const idEl = document.getElementById('dispatch-modal-order-id');
    const nameEl = document.getElementById('dispatch-customer-name');
    const totalEl = document.getElementById('dispatch-total-amount');

    if (idEl) idEl.textContent = `#${dispatchData.id}`;
    if (nameEl) nameEl.textContent = dispatchData.customerName;
    if (totalEl) totalEl.textContent = dispatchData.totalFormatted;

    this.renderDispatchContacts();

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // If only 1 number configured, open chat directly for instant convenience
    if (dispatchData.contacts.length === 1) {
      this.launchWhatsAppContact(0, false);
    }
  },

  renderDispatchContacts() {
    const container = document.getElementById('dispatch-contacts-container');
    if (!container || !this.currentDispatch) return;

    const contacts = this.currentDispatch.contacts;
    const total = contacts.length;
    const sentCount = this.dispatchedContacts ? this.dispatchedContacts.size : 0;

    // Update Progress Bar
    const progressText = document.getElementById('dispatch-progress-text');
    const progressBar = document.getElementById('dispatch-progress-bar');
    if (progressText) {
      if (sentCount === total && total > 0) {
        progressText.innerHTML = `All ${total} Contacted! ✓`;
        progressText.className = 'font-semibold text-emerald-600';
      } else {
        progressText.textContent = `${sentCount} of ${total} Sent`;
        progressText.className = 'font-semibold text-zinc-700';
      }
    }
    if (progressBar) {
      const pct = total > 0 ? Math.round((sentCount / total) * 100) : 0;
      progressBar.style.width = `${pct}%`;
    }

    container.innerHTML = contacts.map((c, idx) => {
      const isSent = this.dispatchedContacts && this.dispatchedContacts.has(idx);
      return `
        <div class="p-3.5 border ${isSent ? 'border-emerald-300 bg-emerald-50/60' : 'border-zinc-200 bg-white'} transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-zinc-900">${c.label}</span>
              ${isSent ? `
                <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded">
                  <svg class="w-3 h-3 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                  Opened ✓
                </span>
              ` : `
                <span class="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Pending</span>
              `}
            </div>
            <p class="text-xs font-mono text-zinc-600 mt-0.5">${c.display}</p>
          </div>

          <button 
            type="button" 
            onclick="App.launchWhatsAppContact(${idx})" 
            class="${isSent ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} text-xs font-semibold uppercase tracking-wider px-4 py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm flex-shrink-0"
          >
            <svg class="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>${isSent ? 'Reopen Chat' : 'Open Chat & Send'}</span>
          </button>
        </div>
      `;
    }).join('');
  },

  launchWhatsAppContact(index, showToastMsg = true) {
    if (!this.currentDispatch || !this.currentDispatch.contacts[index]) return;
    const contact = this.currentDispatch.contacts[index];
    const waUrl = `https://wa.me/${contact.clean}?text=${encodeURIComponent(this.currentDispatch.message)}`;

    if (!this.dispatchedContacts) this.dispatchedContacts = new Set();
    this.dispatchedContacts.add(index);
    this.renderDispatchContacts();

    window.open(waUrl, '_blank');
    if (showToastMsg) {
      this.showToast(`Opening WhatsApp chat for ${contact.label}...`, 'success');
    }
  },

  closeOrderDispatchModal() {
    const modal = document.getElementById('order-dispatch-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  copyOrderSummaryToClipboard() {
    if (!this.currentDispatch || !this.currentDispatch.message) return;
    navigator.clipboard.writeText(this.currentDispatch.message).then(() => {
      this.showToast('Order summary copied to clipboard! You can paste it into any chat.', 'success');
      const textEl = document.getElementById('dispatch-copy-btn-text');
      if (textEl) {
        textEl.textContent = 'Copied! ✓';
        setTimeout(() => { textEl.textContent = 'Copy Summary'; }, 2500);
      }
    }).catch(() => {
      this.showToast('Order summary copied.', 'info');
    });
  },

  orderModalViaWhatsApp() {
    if (!this.selectedProduct) return;
    this.pendingSingleProduct = {
      product: this.selectedProduct,
      size: this.selectedSize,
      color: this.selectedColor,
      quantity: this.selectedQuantity
    };
    this.openCustomerModal('single');
  },

  quickAddToCart(id) {
    const product = window.Store ? window.Store.getProductById(id) : null;
    if (!product || !product.isAvailable) return;
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
    this.cart.addItem(product, defaultSize, 1);
  },

  quickWhatsAppOrder(id) {
    const product = window.Store ? window.Store.getProductById(id) : null;
    if (!product) return;
    this.selectedProduct = product;
    this.selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
    this.selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;
    this.selectedQuantity = 1;
    this.pendingSingleProduct = {
      product: this.selectedProduct,
      size: this.selectedSize,
      color: this.selectedColor,
      quantity: this.selectedQuantity
    };
    this.openCustomerModal('single');
  },

  // --- CART DRAWER ---

  openCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    const panel = document.getElementById('cart-panel');
    if (!drawer || !backdrop || !panel) return;

    this.cart.updateUI();
    drawer.classList.remove('hidden');
    setTimeout(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      panel.classList.remove('translate-x-full');
      panel.classList.add('translate-x-0');
    }, 10);
    document.body.style.overflow = 'hidden';
  },

  closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    const panel = document.getElementById('cart-panel');
    if (!drawer || !backdrop || !panel) return;

    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');

    setTimeout(() => {
      drawer.classList.add('hidden');
      document.body.style.overflow = '';
    }, 350);
  },

  checkoutViaWhatsApp() {
    this.initiateCheckout();
  },

  // --- UI NAVIGATION & TOASTS ---

  scrollToCatalog() {
    const catalog = document.getElementById('catalog-section');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  },

  toggleMobileMenu() {
    const menu = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const panel = document.getElementById('mobile-drawer-panel');
    if (!menu || !backdrop || !panel) return;

    if (menu.classList.contains('hidden')) {
      menu.classList.remove('hidden');
      setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        panel.classList.remove('-translate-x-full');
        panel.classList.add('translate-x-0');
      }, 10);
      document.body.style.overflow = 'hidden';
    } else {
      this.closeMobileMenu();
    }
  },

  closeMobileMenu() {
    const menu = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const panel = document.getElementById('mobile-drawer-panel');
    if (!menu || !backdrop || !panel) return;

    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    panel.classList.remove('translate-x-0');
    panel.classList.add('-translate-x-full');

    setTimeout(() => {
      menu.classList.add('hidden');
      document.body.style.overflow = '';
    }, 350);
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    
    let icon = `
      <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    `;

    if (type === 'error') {
      icon = `
        <svg class="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      `;
    }

    toast.innerHTML = `
      ${icon}
      <span class="flex-1 text-xs tracking-wide">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  handleContactSubmit(e) {
    e.preventDefault();
    this.showToast('Thank you for your message. Our atelier concierge will respond within 4 hours.');
    e.target.reset();
  }
};

// Initialize storefront on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
