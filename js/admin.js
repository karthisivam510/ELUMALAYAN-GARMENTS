/**
 * MUSE ATELIER - Private Admin Console Controller (v3.0)
 * 
 * Manages the 5 core sections:
 * 1. DASHBOARD: KPIs, Recent Garments, Recent Customer Orders
 * 2. CATEGORIES: The 4 Core Disciplines, Reordering, Visibility, Edit Modal
 * 3. PRODUCTS / DESIGNS: Category Selector, Designs Grid/Table, Within-Category Reorder, CRUD
 * 4. ORDERS: Customer Information, WhatsApp Concierge Launcher, Live Status Tracking
 * 5. STORE SETTINGS: Brand Identity, Currencies, Collapsible Advanced Settings (Security, JSON Backups, Reset)
 */

/**
 * ImageOptimizer - Client-side image resizing & compression engine.
 * - Scales down large device/camera photographs (e.g. 10MB-25MB) preserving aspect ratio.
 * - Prevents localStorage quota overflows while maintaining luxury editorial fidelity.
 * - Exports high-efficiency WebP/JPEG data URLs.
 */
const ImageOptimizer = {
  /**
   * Client-Side Image Compression Engine:
   * - Max dimensions: 1000px × 1000px (width or height, maintaining original aspect ratio).
   * - Export format: canvas.toDataURL('image/jpeg', 0.78).
   * - Converts HEIC/PNG/WebP/JPEG photos into clean, compressed JPEG Base64 strings staying below ~180 KB.
   * - Feeds compressed Base64 string directly into product image payload.
   */
  async compress(file, maxDimension = 1000, quality = 0.78) {
    return new Promise((resolve, reject) => {
      try {
        if (!file) {
          return reject(new Error('No image file selected. Please select a valid photo.'));
        }

        const originalSize = file.size || 0;
        const fileName = file.name || 'photo';
        const fileType = (file.type || '').toLowerCase();

        // Support JPEG, JPG, PNG, WebP, HEIC/HEIF
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
        const hasValidExt = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
        const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        const hasValidMime = validMimes.includes(fileType);

        if (!hasValidExt && !hasValidMime && fileType && !fileType.startsWith('image/')) {
          return reject(new Error(`Unsupported file format (${fileType || 'unknown'}). Please choose a JPG, PNG, or WebP photo.`));
        }

        const reader = new FileReader();

        reader.onerror = (readErr) => {
          console.error('[Upload Debug] FileReader error:', readErr);
          reject(new Error(`Failed to read file "${fileName}". File may be inaccessible.`));
        };

        reader.onload = (e) => {
          try {
            const dataUri = e.target && e.target.result;
            if (!dataUri) {
              return reject(new Error(`Empty data loaded from "${fileName}".`));
            }

            const img = new Image();

            img.onerror = (imgErr) => {
              console.error('[Upload Debug] Image decode error:', imgErr);
              if (fileName.toLowerCase().endsWith('.heic') || fileType.includes('heic')) {
                reject(new Error(`HEIC format is not supported directly by your browser. Please select a JPG or PNG copy.`));
              } else {
                reject(new Error(`Failed to decode image "${fileName}". Please check image format.`));
              }
            };

            img.onload = () => {
              try {
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;
                const originalWidth = width;
                const originalHeight = height;

                if (!width || !height) {
                  return reject(new Error(`Invalid image dimensions (${width}x${height}) for "${fileName}".`));
                }

                // Strictly preserve original aspect ratio with max dimension of 1000px × 1000px
                if (width > height) {
                  if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                  }
                } else {
                  if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                  }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  return reject(new Error('HTML5 Canvas 2D context is unavailable.'));
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Clean white backdrop avoids dark borders on transparent PNGs/WebPs when converting to JPEG
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Export format: clean compressed JPEG Base64 string at quality 0.78
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // If Base64 string exceeds ~180 KB (~240,000 chars), perform a second pass to ensure it stays below ~180 KB
                if (dataUrl.length > 240000) {
                  dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                }

                const optimizedSize = Math.round((dataUrl.length * 3) / 4);
                const savedBytes = Math.max(0, originalSize - optimizedSize);
                const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

                // Clean aspect ratio label
                const ratioVal = width / height;
                let ratioLabel = `${width} × ${height}px`;
                if (Math.abs(ratioVal - 0.75) < 0.05) ratioLabel += ' (3:4 Portrait)';
                else if (Math.abs(ratioVal - 1.0) < 0.05) ratioLabel += ' (1:1 Square)';
                else if (Math.abs(ratioVal - 0.67) < 0.05) ratioLabel += ' (2:3 Portrait)';

                resolve({
                  dataUrl,
                  originalWidth,
                  originalHeight,
                  width,
                  height,
                  originalSize,
                  optimizedSize,
                  ratioLabel,
                  savedPercent
                });
              } catch (canvasErr) {
                console.error('[Upload Debug] Canvas compression error:', canvasErr);
                reject(new Error(`Compression processing failed: ${canvasErr.message || canvasErr}`));
              }
            };

            img.src = dataUri;
          } catch (loadErr) {
            console.error('[Upload Debug] Error processing reader result:', loadErr);
            reject(new Error(`Image preparation failed: ${loadErr.message || loadErr}`));
          }
        };

        reader.readAsDataURL(file);
      } catch (initErr) {
        console.error('[Upload Debug] Compression initialization error:', initErr);
        reject(new Error(`Upload initialization error: ${initErr.message || initErr}`));
      }
    });
  },

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};

const Admin = {
  currentTab: 'dashboard',
  selectedCategory: 'All',
  selectedOrderFilter: 'all',
  editingProductId: null,
  uploadedImageBase64: null,
  productImages: [],
  activePreviewIndex: 0,
  replaceTargetIndex: null,
  quickUploadTargetProductId: null,
  deleteTargetId: null,
  deleteTargetType: 'product', // 'product' or 'order'

  init() {
    this.checkAuthentication();
    this.initEventListeners();
  },

  async checkAuthentication() {
    const isAuth = window.Auth && window.Auth.isAuthenticated();
    const loginSection = document.getElementById('admin-login-view');
    const panelSection = document.getElementById('admin-panel-view');

    if (!isAuth) {
      if (loginSection) loginSection.classList.remove('hidden');
      if (panelSection) panelSection.classList.add('hidden');
      return;
    }

    // Authenticated
    if (loginSection) loginSection.classList.add('hidden');
    if (panelSection) panelSection.classList.remove('hidden');

    const currentUser = window.Auth.getCurrentUser();
    const userDisplay = document.getElementById('admin-username-display');
    if (userDisplay && currentUser) {
      userDisplay.textContent = currentUser.username;
    }

    // Synchronize orders from backend
    if (window.Store && typeof window.Store.syncOrdersFromBackend === 'function') {
      await window.Store.syncOrdersFromBackend();
    }

    this.renderDashboard();
    this.renderCategoriesView();
    this.renderCategorySelectorTabs();
    this.renderProductsTable();
    this.renderOrdersTable();
    this.populateSettingsForm();
    this.renderPhotoPresets();
  },

  // --- AUTHENTICATION HANDLERS ---

  async handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const rememberMeInput = document.getElementById('login-remember');
    const errorEl = document.getElementById('login-error');

    if (errorEl) errorEl.classList.add('hidden');

    const username = usernameInput ? usernameInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    const remember = rememberMeInput ? rememberMeInput.checked : false;

    const res = await window.Auth.login(username, password, remember);
    if (res.success) {
      this.checkAuthentication();
      this.showToast('Welcome back, Curator.', 'success');
    } else {
      if (errorEl) {
        errorEl.textContent = res.message || 'Invalid credentials.';
        errorEl.classList.remove('hidden');
      }
    }
  },

  fillDemoCredentials() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    if (usernameInput) usernameInput.value = 'admin';
    if (passwordInput) passwordInput.value = 'muse2026!';
    this.showToast('Demo credentials inserted: admin / muse2026!');
  },

  logout() {
    window.Auth.logout();
    this.checkAuthentication();
    this.showToast('Logged out securely.');
  },

  // --- TAB NAVIGATION (5 SECTIONS) ---

  setTab(tab) {
    this.currentTab = tab;

    // Update Desktop Nav Links
    document.querySelectorAll('.admin-nav-item').forEach(el => {
      const target = el.getAttribute('data-tab');
      if (target === tab) {
        el.className = 'admin-nav-item w-full flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wider font-semibold bg-zinc-900 text-white transition-colors';
      } else {
        el.className = 'admin-nav-item w-full flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wider font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors';
      }
    });

    // Update Mobile Bottom Nav Links
    document.querySelectorAll('[data-mobile-tab]').forEach(el => {
      const target = el.getAttribute('data-mobile-tab');
      if (target === tab) {
        el.className = 'flex flex-col items-center justify-center p-1.5 text-white font-bold flex-1';
      } else {
        el.className = 'flex flex-col items-center justify-center p-1.5 text-zinc-400 hover:text-white flex-1';
      }
    });

    // Toggle Section Views
    document.querySelectorAll('.admin-tab-view').forEach(view => {
      view.classList.add('hidden');
    });

    const targetView = document.getElementById(`tab-view-${tab}`);
    if (targetView) targetView.classList.remove('hidden');

    // Update Section Title in Header
    const titleEl = document.getElementById('admin-section-title');
    if (titleEl) {
      const titles = {
        dashboard: 'Atelier Dashboard',
        categories: 'The 4 Core Categories',
        products: 'Products & Designs Archive',
        orders: 'Customer Orders & Inquiries',
        settings: 'Store Settings'
      };
      titleEl.textContent = titles[tab] || 'Atelier Management';
    }

    // Refresh Active Section Content
    if (tab === 'dashboard') {
      this.renderDashboard();
    } else if (tab === 'categories') {
      this.renderCategoriesView();
    } else if (tab === 'products') {
      this.renderCategorySelectorTabs();
      this.renderProductsTable();
    } else if (tab === 'orders') {
      this.renderOrdersTable();
    } else if (tab === 'settings') {
      this.populateSettingsForm();
    }

    // Scroll to top of main area
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  },

  // ==========================================
  // SECTION 1: DASHBOARD
  // ==========================================

  renderDashboard() {
    const metrics = window.Store.getMetrics();
    const settings = window.Store.getSettings();
    const currency = settings.currencySymbol || '₹';

    // Update KPI counters
    const totalEl = document.getElementById('kpi-total-products');
    const availEl = document.getElementById('kpi-available-products');
    const unavailEl = document.getElementById('kpi-unavailable-products');
    const catsEl = document.getElementById('kpi-categories');
    const ordersEl = document.getElementById('kpi-total-orders');
    const newPill = document.getElementById('kpi-new-orders-pill');

    if (totalEl) totalEl.textContent = metrics.total;
    if (availEl) availEl.textContent = metrics.available;
    if (unavailEl) unavailEl.textContent = metrics.unavailable;
    if (catsEl) catsEl.textContent = metrics.categories;
    if (ordersEl) ordersEl.textContent = metrics.totalOrders;
    if (newPill) newPill.textContent = `${metrics.newOrders} new`;

    // Update Order badges in nav
    const navBadge = document.getElementById('nav-orders-badge');
    const mobileBadge = document.getElementById('mobile-orders-badge');
    if (navBadge) {
      navBadge.textContent = metrics.totalOrders;
      navBadge.classList.toggle('hidden', metrics.totalOrders === 0);
    }
    if (mobileBadge) {
      mobileBadge.classList.toggle('hidden', metrics.newOrders === 0);
    }

    // 1. Recent Garments Table (top 5)
    const recentTable = document.getElementById('dashboard-recent-table');
    if (recentTable) {
      const products = window.Store.getProducts().slice(0, 5);
      if (products.length === 0) {
        recentTable.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-xs text-zinc-400">No garments currently in catalog.</td></tr>`;
      } else {
        recentTable.innerHTML = products.map(p => `
          <tr class="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
            <td class="py-3 px-4 flex items-center gap-3">
              <img src="${p.image}" class="w-8 h-11 object-cover bg-zinc-100 border border-zinc-200 flex-shrink-0" />
              <div>
                <p class="font-medium text-zinc-900 text-xs line-clamp-1">${p.name}</p>
                <p class="text-[10px] text-zinc-400 uppercase tracking-widest">${p.category}</p>
              </div>
            </td>
            <td class="py-3 px-4 text-xs font-semibold text-zinc-900 whitespace-nowrap">${currency}${p.price.toLocaleString()}</td>
            <td class="py-3 px-4 text-xs whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full ${p.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                <span class="w-1.5 h-1.5 rounded-full ${p.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                ${p.isAvailable ? 'In Stock' : 'Out of Stock'}
              </span>
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap">
              <button onclick="Admin.openEditModal('${p.id}')" class="text-xs text-zinc-600 hover:text-zinc-950 font-medium underline">
                Edit
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    // 2. Recent Customer Orders Table (top 5)
    const recentOrdersTable = document.getElementById('dashboard-recent-orders-table');
    if (recentOrdersTable) {
      const orders = window.Store.getOrders().slice(0, 5);
      if (orders.length === 0) {
        recentOrdersTable.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-xs text-zinc-400">No incoming customer orders yet.</td></tr>`;
      } else {
        recentOrdersTable.innerHTML = orders.map(o => {
          const itemsCount = (o.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
          return `
            <tr class="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
              <td class="py-3 px-4">
                <p class="font-medium text-zinc-900 text-xs">${o.customerName}</p>
                <p class="text-[10px] text-zinc-400 font-mono">${o.mobile || o.whatsapp || 'No Phone'}</p>
              </td>
              <td class="py-3 px-4 text-xs whitespace-nowrap">
                <span class="font-semibold text-zinc-900">${currency}${(o.totalPrice || 0).toLocaleString()}</span>
                <span class="text-[10px] text-zinc-400 block">${itemsCount} item${itemsCount === 1 ? '' : 's'}</span>
              </td>
              <td class="py-3 px-4 text-xs whitespace-nowrap">
                <span class="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  o.status === 'New' ? 'bg-emerald-100 text-emerald-800' :
                  o.status === 'Confirmed' ? 'bg-sky-100 text-sky-800' :
                  o.status === 'Shipped' ? 'bg-amber-100 text-amber-800' :
                  o.status === 'Completed' ? 'bg-zinc-100 text-zinc-800' :
                  'bg-rose-100 text-rose-800'
                }">
                  ${o.status || 'New'}
                </span>
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <button onclick="Admin.setTab('orders')" class="text-xs text-zinc-600 hover:text-zinc-950 font-medium underline">
                  Review
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  // ==========================================
  // SECTION 2: CATEGORIES (STRICT 4 CORE DISCIPLINES)
  // ==========================================

  renderCategoriesView() {
    const container = document.getElementById('admin-categories-cards-list');
    if (!container) return;

    const categories = window.Store.getCategories();
    const allProducts = window.Store.getProducts();

    container.innerHTML = categories.map((cat, idx) => {
      const catCount = allProducts.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
      const isFirst = idx === 0;
      const isLast = idx === categories.length - 1;

      return `
        <div class="bg-white border ${cat.enabled !== false ? 'border-zinc-200' : 'border-dashed border-zinc-300 opacity-60'} shadow-sm overflow-hidden flex flex-col justify-between">
          
          <!-- Category Card Header -->
          <div class="p-5 flex gap-4 items-start">
            <div class="relative w-20 h-28 bg-zinc-100 flex-shrink-0 border border-zinc-200 overflow-hidden">
              <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" />
              <span class="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1">
                0${idx + 1}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] uppercase tracking-widest text-zinc-400 font-mono">Discipline 0${idx + 1}</span>
                <span class="text-[10px] uppercase font-semibold px-2 py-0.5 ${cat.enabled !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                  ${cat.enabled !== false ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h4 class="font-serif-editorial text-xl font-semibold text-zinc-950 mt-1 line-clamp-1">
                ${cat.name}
              </h4>
              <p class="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed font-light">
                ${cat.subtitle || 'No discipline description.'}
              </p>

              <div class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-800">
                <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.188-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
                <span>${catCount} ${catCount === 1 ? 'Design' : 'Designs Inside'}</span>
              </div>
            </div>
          </div>

          <!-- Category Toolbar Actions -->
          <div class="px-5 py-3.5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
            <!-- Reorder Buttons -->
            <div class="inline-flex items-center border border-zinc-300 divide-x divide-zinc-300 bg-white shadow-sm">
              <button 
                onclick="Admin.moveCategory('${cat.id}', 'up')" 
                ${isFirst ? 'disabled' : ''} 
                class="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                title="Move Category Up"
              >
                ▲
              </button>
              <button 
                onclick="Admin.moveCategory('${cat.id}', 'down')" 
                ${isLast ? 'disabled' : ''} 
                class="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                title="Move Category Down"
              >
                ▼
              </button>
            </div>

            <!-- Enable/Disable Switch -->
            <button 
              onclick="Admin.toggleCategory('${cat.id}')"
              class="text-xs font-medium px-3 py-1.5 border border-zinc-300 bg-white hover:border-zinc-900 transition-colors"
            >
              ${cat.enabled !== false ? 'Disable Category' : 'Enable Category'}
            </button>

            <!-- Edit Details Button -->
            <button 
              onclick="Admin.openCategoryModal('${cat.id}')"
              class="text-xs font-semibold px-3 py-1.5 bg-zinc-950 text-white hover:bg-zinc-800 transition-colors"
            >
              Edit Category
            </button>

            <!-- Jump to Products Filtered by this Category -->
            <button 
              onclick="Admin.setTab('products'); Admin.filterByCategory('${cat.name}');"
              class="text-xs text-zinc-900 font-semibold hover:underline"
            >
              Browse Designs →
            </button>
          </div>

        </div>
      `;
    }).join('');
  },

  moveCategory(id, direction) {
    const success = window.Store.moveCategory(id, direction);
    if (success) {
      this.renderCategoriesView();
      this.renderCategorySelectorTabs();
      this.showToast(`Category reordered.`);
    }
  },

  toggleCategory(id) {
    const updated = window.Store.toggleCategoryStatus(id);
    if (updated) {
      this.renderCategoriesView();
      this.showToast(`Category "${updated.name}" is now ${updated.enabled !== false ? 'Active' : 'Disabled'}.`);
    }
  },

  openCategoryModal(id) {
    const cat = window.Store.getCategoryById(id);
    if (!cat) return;

    document.getElementById('edit-cat-id').value = cat.id;
    document.getElementById('edit-cat-name').value = cat.name;
    document.getElementById('edit-cat-subtitle').value = cat.subtitle || '';
    document.getElementById('edit-cat-image').value = cat.image || '';

    const modal = document.getElementById('category-edit-modal');
    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeCategoryModal() {
    const modal = document.getElementById('category-edit-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  },

  handleCategorySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-cat-id').value;
    const name = document.getElementById('edit-cat-name').value.trim();
    const subtitle = document.getElementById('edit-cat-subtitle').value.trim();
    const image = document.getElementById('edit-cat-image').value.trim();

    if (!name) return;

    window.Store.updateCategory(id, { name, subtitle, image });
    this.closeCategoryModal();
    this.renderCategoriesView();
    this.renderCategorySelectorTabs();
    this.renderProductsTable();
    this.showToast(`Category "${name}" updated successfully.`);
  },

  // ==========================================
  // SECTION 3: PRODUCTS / DESIGNS
  // ==========================================

  renderCategorySelectorTabs() {
    const container = document.getElementById('admin-product-category-tabs');
    if (!container) return;

    const categories = window.Store.getCategories();
    const allProducts = window.Store.getProducts();

    const items = [
      { name: 'All', count: allProducts.length },
      ...categories.map(c => ({
        name: c.name,
        count: allProducts.filter(p => p.category.toLowerCase() === c.name.toLowerCase()).length
      }))
    ];

    container.innerHTML = items.map(cat => {
      const isSelected = this.selectedCategory.toLowerCase() === cat.name.toLowerCase();
      return `
        <button 
          onclick="Admin.filterByCategory('${cat.name}')"
          class="px-4 py-2 text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
            isSelected 
              ? 'bg-zinc-950 text-white font-semibold border-zinc-950 shadow-sm' 
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
          }"
        >
          <span>${cat.name}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-800'}">
            ${cat.count}
          </span>
        </button>
      `;
    }).join('');
  },

  filterByCategory(catName) {
    this.selectedCategory = catName;
    this.renderCategorySelectorTabs();
    this.renderProductsTable();
  },

  filterProductStatus(status) {
    const statusSelect = document.getElementById('admin-status-filter');
    if (statusSelect) statusSelect.value = status;
    this.renderProductsTable();
  },

  renderProductsTable() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;

    let products = window.Store.getProducts();
    const settings = window.Store.getSettings();
    const currency = settings.currencySymbol || '₹';

    const searchFilter = document.getElementById('admin-product-search');
    const statusFilter = document.getElementById('admin-status-filter');

    const searchVal = searchFilter ? searchFilter.value.toLowerCase().trim() : '';
    const statusVal = statusFilter ? statusFilter.value : 'All';

    // 1. Filter by Selected Category
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === this.selectedCategory.toLowerCase());
    }

    // 2. Filter by Search Query
    if (searchVal) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchVal) || 
        p.category.toLowerCase().includes(searchVal) ||
        p.id.toLowerCase().includes(searchVal) ||
        (p.badge && p.badge.toLowerCase().includes(searchVal))
      );
    }

    // 3. Filter by Status
    if (statusVal === 'available') {
      products = products.filter(p => p.isAvailable);
    } else if (statusVal === 'unavailable') {
      products = products.filter(p => !p.isAvailable);
    }

    // Update count label
    const countLabel = document.getElementById('admin-products-count-label');
    if (countLabel) {
      countLabel.textContent = `Showing ${products.length} design${products.length === 1 ? '' : 's'} inside ${this.selectedCategory === 'All' ? 'All Categories' : `"${this.selectedCategory}"`}`;
    }

    if (products.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-16 text-zinc-400 text-xs">
            No designs found matching the current filter inside ${this.selectedCategory}.
            <div class="mt-2">
              <button onclick="Admin.openAddModal()" class="btn-primary-luxury text-xs py-1.5 px-4">+ Add First Design</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = products.map((p, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === products.length - 1;

      return `
        <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition-colors">
          <!-- Reorder Inside Category -->
          <td class="py-3 px-3 text-center whitespace-nowrap">
            <div class="inline-flex items-center md:flex-col gap-1">
              <button 
                onclick="Admin.moveProduct('${p.id}', 'up')" 
                ${isFirst ? 'disabled' : ''} 
                class="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-2 md:p-1 bg-zinc-100 md:bg-transparent rounded md:rounded-none text-zinc-600 hover:text-zinc-950 disabled:opacity-20 text-xs md:text-[10px] flex items-center justify-center"
                title="Move Design Up"
                aria-label="Move design up"
              >
                ▲
              </button>
              <button 
                onclick="Admin.moveProduct('${p.id}', 'down')" 
                ${isLast ? 'disabled' : ''} 
                class="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-2 md:p-1 bg-zinc-100 md:bg-transparent rounded md:rounded-none text-zinc-600 hover:text-zinc-950 disabled:opacity-20 text-xs md:text-[10px] flex items-center justify-center"
                title="Move Design Down"
                aria-label="Move design down"
              >
                ▼
              </button>
            </div>
          </td>

          <!-- Thumbnail & Photo Count (Click to open gallery editor) -->
          <td class="py-3 px-4 w-20">
            <div class="flex items-center md:flex-col gap-3 md:gap-1">
              <div 
                onclick="Admin.openEditModal('${p.id}')" 
                class="relative w-14 h-18 md:w-11 md:h-14 bg-zinc-100 border border-zinc-200 cursor-pointer group overflow-hidden shadow-2xs flex-shrink-0" 
                title="Click to view and manage photos in gallery"
              >
                <img src="${(p.images && p.images[0]) || p.image}" alt="${p.name}" loading="lazy" decoding="async" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1">
                  <svg class="w-3.5 h-3.5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span class="text-[8px] uppercase tracking-wider font-semibold">Photos</span>
                </div>
              </div>
              <span class="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                ${(p.images && p.images.length) || 1} Photo${(p.images && p.images.length === 1) ? '' : 's'}
              </span>
            </div>
          </td>

          <!-- Title & Details -->
          <td class="py-3 px-4">
            <p class="font-serif-editorial text-base sm:text-lg text-zinc-950 font-medium leading-snug">${p.name}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              <span class="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">${p.category}</span>
              ${p.badge ? `<span class="text-[9px] uppercase tracking-widest px-1.5 py-0.2 bg-zinc-100 text-zinc-700 font-semibold">${p.badge}</span>` : ''}
              <span class="text-[10px] text-zinc-300 font-mono">ID: ${p.id}</span>
            </div>
          </td>

          <!-- Price -->
          <td class="py-3 px-4 text-xs font-semibold text-zinc-900 whitespace-nowrap">
            ${currency}${p.price.toLocaleString()}
            ${p.comparePrice ? `<span class="line-through text-zinc-400 font-normal ml-1">${currency}${p.comparePrice}</span>` : ''}
          </td>

          <!-- Sizes -->
          <td class="py-3 px-4 text-xs text-zinc-500 hidden md:table-cell">
            <div class="flex flex-wrap gap-1">
              ${(p.sizes || []).map(s => `<span class="px-1.5 py-0.5 bg-zinc-100 text-[10px] font-mono text-zinc-700">${s}</span>`).join('')}
            </div>
          </td>

          <!-- Real-Time Stock Status Switch -->
          <td class="py-3 px-4 whitespace-nowrap">
            <button 
              onclick="Admin.toggleProductStatus('${p.id}')"
              class="group inline-flex items-center gap-2 min-h-[44px] md:min-h-0 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                p.isAvailable 
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }"
              title="Click to toggle availability on storefront"
            >
              <span class="w-2.5 h-2.5 rounded-full ${p.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
              <span>${p.isAvailable ? 'Available' : 'Unavailable'}</span>
              <svg class="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </td>

          <!-- Actions -->
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <div class="inline-flex items-center gap-2">
              <button 
                onclick="Admin.openEditModal('${p.id}')" 
                class="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-2 md:p-1.5 bg-zinc-100 md:bg-transparent rounded md:rounded-none text-zinc-600 hover:text-zinc-950 transition-colors flex items-center justify-center"
                title="Edit Design"
                aria-label="Edit Design"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>

              <button 
                onclick="Admin.confirmDelete('${p.id}', 'product')" 
                class="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-2 md:p-1.5 bg-rose-50 md:bg-transparent rounded md:rounded-none text-zinc-400 hover:text-rose-600 transition-colors flex items-center justify-center"
                title="Delete Design"
                aria-label="Delete Design"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  moveProduct(id, direction) {
    const success = window.Store.moveProduct(id, direction);
    if (success) {
      this.renderProductsTable();
      this.showToast(`Product reordered within category.`);
    }
  },

  toggleProductStatus(id) {
    const updated = window.Store.toggleAvailability(id);
    if (updated) {
      this.renderProductsTable();
      this.renderDashboard();
      this.showToast(`"${updated.name}" is now ${updated.isAvailable ? 'Available' : 'Unavailable'}.`);
    }
  },

  // ==========================================
  // SECTION 4: ORDERS
  // ==========================================

  setOrderFilter(filter) {
    this.selectedOrderFilter = filter;
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
      const f = btn.getAttribute('data-order-filter');
      if (f === filter) {
        btn.className = 'order-filter-btn px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-zinc-950 text-white';
      } else {
        btn.className = 'order-filter-btn px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-600 hover:text-zinc-950';
      }
    });
    this.renderOrdersTable();
  },

  renderOrdersTable() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    let orders = window.Store.getOrders();
    const settings = window.Store.getSettings();
    const currency = settings.currencySymbol || '₹';

    if (this.selectedOrderFilter && this.selectedOrderFilter !== 'all') {
      orders = orders.filter(o => o.status === this.selectedOrderFilter);
    }

    const countIndicator = document.getElementById('orders-count-indicator');
    if (countIndicator) {
      countIndicator.textContent = `Total ${orders.length} Order${orders.length === 1 ? '' : 's'}`;
    }

    if (orders.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-16 text-zinc-400 text-xs">
            No customer orders matching status "${this.selectedOrderFilter}".
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = orders.map(o => {
      const cleanPhone = (o.whatsapp || o.mobile || '').replace(/[^\d+]/g, '');
      const dateFormatted = new Date(o.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const waInquiryUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(`Hello ${o.customerName}, this is MUSE ATELIER Concierge regarding your order #${o.id}.`)}`;

      return `
        <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition-colors">
          <!-- ID & Date -->
          <td class="py-4 px-4 whitespace-nowrap">
            <p class="font-mono text-xs font-bold text-zinc-900">#${o.id}</p>
            <p class="text-[10px] text-zinc-400 mt-0.5">${dateFormatted}</p>
          </td>

          <!-- Customer Details -->
          <td class="py-4 px-4 min-w-[200px]">
            <p class="font-medium text-xs text-zinc-900">${o.customerName}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[11px] text-zinc-600 font-mono">${o.mobile || o.whatsapp}</span>
              ${cleanPhone ? `
                <a href="${waInquiryUrl}" target="_blank" class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-wider font-semibold rounded hover:bg-emerald-100" title="Chat directly with customer on WhatsApp">
                  <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  WhatsApp
                </a>
              ` : ''}
            </div>
            ${o.email ? `<p class="text-[10px] text-zinc-400 mt-0.5">${o.email}</p>` : ''}
            ${o.address ? `<p class="text-[10px] text-zinc-500 mt-1 line-clamp-1 italic">📍 ${o.address}</p>` : ''}
          </td>

          <!-- Ordered Products Breakdown -->
          <td class="py-4 px-4">
            <div class="space-y-1">
              ${(o.items || []).map(item => `
                <div class="text-xs text-zinc-800">
                  <span class="font-medium">${item.name}</span>
                  <span class="text-zinc-500 text-[11px]">(Size: ${item.size || 'M'}, Color: ${item.color || 'Default'}, Qty: ${item.quantity || 1})</span>
                </div>
              `).join('')}
            </div>
          </td>

          <!-- Total Price -->
          <td class="py-4 px-4 text-xs font-semibold text-zinc-950 whitespace-nowrap">
            ${currency}${(o.totalPrice || 0).toLocaleString()}
          </td>

          <!-- Status Dropdown Selector -->
          <td class="py-4 px-4 whitespace-nowrap">
            <select 
              onchange="Admin.updateOrderStatus('${o.id}', this.value)"
              class="text-xs font-semibold py-1 px-2.5 border rounded-none focus:outline-none ${
                o.status === 'New' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                o.status === 'Confirmed' ? 'bg-sky-50 text-sky-800 border-sky-300' :
                o.status === 'Shipped' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                o.status === 'Completed' ? 'bg-zinc-100 text-zinc-800 border-zinc-300' :
                'bg-rose-50 text-rose-800 border-rose-300'
              }"
            >
              <option value="New" ${o.status === 'New' ? 'selected' : ''}>New</option>
              <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>

          <!-- Actions -->
          <td class="py-4 px-4 text-right whitespace-nowrap">
            <button 
              onclick="Admin.confirmDelete('${o.id}', 'order')" 
              class="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
              title="Delete Order"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  updateOrderStatus(orderId, newStatus) {
    window.Store.updateOrderStatus(orderId, newStatus);
    this.renderOrdersTable();
    this.renderDashboard();
    this.showToast(`Order #${orderId} marked as ${newStatus}.`);
  },

  // ==========================================
  // SECTION 5: STORE SETTINGS & CUSTOMIZATION
  // ==========================================

  populateSettingsForm() {
    const settings = window.Store.getSettings();

    const nameInput = document.getElementById('settings-store-name');
    const taglineInput = document.getElementById('settings-tagline');
    const currencyInput = document.getElementById('settings-currency');
    const whatsappInput = document.getElementById('settings-whatsapp');
    const whatsappInput2 = document.getElementById('settings-whatsapp-2');
    const whatsappInput3 = document.getElementById('settings-whatsapp-3');
    const instaInput = document.getElementById('settings-instagram');
    const emailInput = document.getElementById('settings-email');
    const phoneInput = document.getElementById('settings-phone');
    const addressInput = document.getElementById('settings-address');
    const announcementInput = document.getElementById('settings-announcement');
    const announcementCheck = document.getElementById('settings-show-announcement');

    if (nameInput) nameInput.value = settings.storeName || '';
    if (taglineInput) taglineInput.value = settings.tagline || '';
    if (currencyInput) currencyInput.value = settings.currencySymbol || '₹';
    if (whatsappInput) whatsappInput.value = settings.whatsappNumber || '';
    if (whatsappInput2) whatsappInput2.value = settings.whatsappNumber2 || '';
    if (whatsappInput3) whatsappInput3.value = settings.whatsappNumber3 || '';
    if (instaInput) instaInput.value = settings.instagramHandle || '';
    if (emailInput) emailInput.value = settings.supportEmail || '';
    if (phoneInput) phoneInput.value = settings.supportPhone || '';
    if (addressInput) addressInput.value = settings.address || '';
    if (announcementInput) announcementInput.value = settings.announcementText || '';
    if (announcementCheck) announcementCheck.checked = Boolean(settings.showAnnouncement);

    // Populate Festival Controls
    this.populateFestivalSettings(settings);
    this.renderFestivalStatus();
    this.renderUpcomingFestivals();
  },

  async handleSettingsSubmit(e) {
    e.preventDefault();

    const storeName = document.getElementById('settings-store-name').value.trim();
    const tagline = document.getElementById('settings-tagline').value.trim();
    const currencySymbol = document.getElementById('settings-currency').value.trim() || '₹';
    const rawWA1 = document.getElementById('settings-whatsapp').value.trim();
    const rawWA2 = document.getElementById('settings-whatsapp-2') ? document.getElementById('settings-whatsapp-2').value.trim() : '';
    const rawWA3 = document.getElementById('settings-whatsapp-3') ? document.getElementById('settings-whatsapp-3').value.trim() : '';
    const instagramHandle = document.getElementById('settings-instagram').value.trim();
    const supportEmail = document.getElementById('settings-email').value.trim();
    const supportPhone = document.getElementById('settings-phone').value.trim();
    const address = document.getElementById('settings-address').value.trim();
    const announcementText = document.getElementById('settings-announcement').value.trim();
    const showAnnouncement = document.getElementById('settings-show-announcement').checked;

    // Validate WhatsApp 1 (Required)
    const norm1 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(rawWA1) : { isValid: true, display: rawWA1, clean: rawWA1 };
    if (!norm1.isValid) {
      this.showToast('Please enter a valid Primary WhatsApp Number (e.g. 9940773278 or +91 99407 73278).', 'error');
      const el = document.getElementById('settings-whatsapp');
      if (el) el.focus();
      return;
    }

    // Validate WhatsApp 2 (Optional)
    let norm2Display = '';
    if (rawWA2) {
      const norm2 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(rawWA2) : { isValid: true, display: rawWA2, clean: rawWA2 };
      if (!norm2.isValid) {
        this.showToast('WhatsApp Number 2 is invalid. Please enter a valid 10-digit number or leave empty.', 'error');
        const el = document.getElementById('settings-whatsapp-2');
        if (el) el.focus();
        return;
      }
      norm2Display = norm2.display;
    }

    // Validate WhatsApp 3 (Optional)
    let norm3Display = '';
    if (rawWA3) {
      const norm3 = window.normalizeWhatsAppNumber ? window.normalizeWhatsAppNumber(rawWA3) : { isValid: true, display: rawWA3, clean: rawWA3 };
      if (!norm3.isValid) {
        this.showToast('WhatsApp Number 3 is invalid. Please enter a valid 10-digit number or leave empty.', 'error');
        const el = document.getElementById('settings-whatsapp-3');
        if (el) el.focus();
        return;
      }
      norm3Display = norm3.display;
    }

    await window.Store.saveSettings({
      storeName,
      tagline,
      currencySymbol,
      whatsappNumber: norm1.display,
      whatsappNumber2: norm2Display,
      whatsappNumber3: norm3Display,
      instagramHandle,
      supportEmail,
      supportPhone,
      address,
      announcementText,
      showAnnouncement
    });

    this.populateSettingsForm();
    this.showToast('Store settings & all 3 WhatsApp numbers saved and synchronized!', 'success');
  },

  handlePasswordChange(e) {
    e.preventDefault();
    const curPass = document.getElementById('settings-current-password').value;
    const newPass = document.getElementById('settings-new-password').value;
    const confPass = document.getElementById('settings-confirm-password').value;

    if (newPass !== confPass) {
      this.showToast('New passwords do not match.', 'error');
      return;
    }

    const res = window.Auth.changePassword(curPass, newPass);
    if (res.success) {
      this.showToast('Master password successfully updated.', 'success');
      e.target.reset();
    } else {
      this.showToast(res.message || 'Error updating password.', 'error');
    }
  },

  handleResetCatalog() {
    if (confirm('Warning: This will restore the factory sample garments, the 4 core categories, and initial sample orders. Proceed?')) {
      window.Store.resetToDefaults();
      this.renderDashboard();
      this.renderCategoriesView();
      this.renderCategorySelectorTabs();
      this.renderProductsTable();
      this.renderOrdersTable();
      this.populateSettingsForm();
      this.showToast('Catalog restored to curated sample archive.');
    }
  },

  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(window.Store.exportData());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `muse_atelier_archive_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Catalog archive exported to JSON.');
  },

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = window.Store.importData(event.target.result);
      if (res.success) {
        this.renderDashboard();
        this.renderCategoriesView();
        this.renderCategorySelectorTabs();
        this.renderProductsTable();
        this.renderOrdersTable();
        this.populateSettingsForm();
        this.showToast(`Archive restored successfully (${res.count} garments).`);
      } else {
        this.showToast(`Import failed: ${res.error}`, 'error');
      }
    };
    reader.readAsText(file);
  },

  // ==========================================
  // FESTIVAL & SEASONAL APPEARANCE CONTROLLER
  // ==========================================

  populateFestivalSettings(settings) {
    if (!settings) settings = window.Store ? window.Store.getSettings() : {};

    const autoModeToggle = document.getElementById('fest-auto-mode-toggle');
    const overrideSelect = document.getElementById('fest-manual-override-select');
    const durationSelect = document.getElementById('fest-override-duration-select');
    const customDateWrap = document.getElementById('fest-custom-expiry-wrap');
    const customDateInput = document.getElementById('fest-custom-expiry-date');
    const customBannerInput = document.getElementById('fest-custom-banner-text');

    const autoMode = settings.festivalAutoMode !== false &&
                     settings.festivalAutoMode !== '0' &&
                     settings.festivalAutoMode !== 0 &&
                     settings.festivalAutoMode !== 'false';

    if (autoModeToggle) autoModeToggle.checked = autoMode;
    if (overrideSelect) overrideSelect.value = settings.festivalActiveOverride || '';
    if (customBannerInput) customBannerInput.value = settings.festivalCustomBanner || '';

    if (settings.festivalOverrideUntil) {
      const untilDate = new Date(settings.festivalOverrideUntil);
      if (!isNaN(untilDate.getTime())) {
        if (customDateInput) {
          const iso = untilDate.toISOString().split('T')[0];
          customDateInput.value = iso;
        }
      }
    }

    if (overrideSelect && overrideSelect.value) {
      if (durationSelect) durationSelect.disabled = false;
    } else {
      if (durationSelect) durationSelect.disabled = true;
    }
  },

  renderFestivalStatus(simulatedDate = null) {
    const settings = window.Store ? window.Store.getSettings() : {};
    if (!window.FestivalEngine) return;

    const detection = window.FestivalEngine.getCurrentFestival(settings, simulatedDate);
    const parts = detection.nowParts || window.FestivalEngine.getKolkataParts(simulatedDate);

    // Update IST Clock
    const clockEl = document.getElementById('fest-ist-clock');
    if (clockEl) {
      const pad = (n) => String(n).padStart(2, '0');
      clockEl.textContent = `${parts.isoDate} ${pad(parts.hour)}:${pad(parts.minute)} IST`;
    }

    // Update Live Status Pill
    const pill = document.getElementById('fest-live-status-pill');
    if (pill) {
      if (detection.mode === 'manual_override') {
        pill.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 border text-xs font-semibold uppercase tracking-wider rounded-full bg-amber-50 text-amber-900 border-amber-300';
        pill.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>Manual Override Active: ${detection.meta.shortName}</span>`;
      } else if (detection.mode === 'manual_override_none') {
        pill.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 border text-xs font-semibold uppercase tracking-wider rounded-full bg-zinc-100 text-zinc-700 border-zinc-300';
        pill.innerHTML = `<span class="w-2 h-2 rounded-full bg-zinc-400"></span><span>Forced Normal Theme</span>`;
      } else if (detection.mode === 'auto_disabled') {
        pill.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 border text-xs font-semibold uppercase tracking-wider rounded-full bg-zinc-100 text-zinc-500 border-zinc-300';
        pill.innerHTML = `<span class="w-2 h-2 rounded-full bg-zinc-400"></span><span>Auto-Scheduler Paused</span>`;
      } else if (detection.isActive) {
        pill.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 border text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-800 border-emerald-300';
        pill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>${detection.meta.icon} ${detection.meta.shortName} Live</span>`;
      } else {
        pill.className = 'inline-flex items-center gap-2 px-3.5 py-1.5 border text-xs font-semibold uppercase tracking-wider rounded-full bg-zinc-50 text-zinc-700 border-zinc-200';
        pill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Auto-Scheduler Active (Standard Luxury)</span>`;
      }
    }

    // Active Theme Name
    const nameEl = document.getElementById('fest-active-theme-name');
    const sourceEl = document.getElementById('fest-active-theme-source');
    const durEl = document.getElementById('fest-active-duration');
    const badgeEl = document.getElementById('fest-active-badge-preview');

    if (nameEl) {
      if (detection.isActive && detection.meta) {
        nameEl.textContent = `${detection.meta.icon} ${detection.meta.name}`;
      } else {
        nameEl.textContent = 'Standard Luxury Theme (Monochrome)';
      }
    }

    if (sourceEl) {
      if (detection.mode === 'manual_override') {
        sourceEl.textContent = `Mode: Manual Override (Active until configured expiry)`;
      } else if (detection.mode === 'manual_override_none') {
        sourceEl.textContent = `Mode: Manual Override (Disabled by admin)`;
      } else if (detection.mode === 'auto_disabled') {
        sourceEl.textContent = `Mode: Automatic mode is switched OFF`;
      } else if (detection.isActive) {
        sourceEl.textContent = `Mode: Automatic Calendar Match (Asia/Kolkata)`;
      } else {
        sourceEl.textContent = `Mode: Automatic (No festival currently scheduled for today)`;
      }
    }

    if (durEl) {
      if (detection.schedule && detection.schedule.start) {
        durEl.textContent = `${detection.schedule.start} to ${detection.schedule.end || 'Ongoing'}`;
      } else {
        durEl.textContent = 'Pristine luxury aesthetic active';
      }
    }

    if (badgeEl) {
      if (detection.isActive && detection.meta) {
        badgeEl.textContent = `Badge: "${detection.meta.badge}"`;
      } else {
        badgeEl.textContent = 'Minimalist editorial monochrome palette';
      }
    }
  },

  renderUpcomingFestivals() {
    const container = document.getElementById('fest-upcoming-grid');
    if (!container || !window.FestivalEngine) return;

    const settings = window.Store ? window.Store.getSettings() : {};
    const upcoming = window.FestivalEngine.getUpcomingFestivals(settings, null, 13);

    const badgeCount = document.getElementById('fest-upcoming-count-badge');
    if (badgeCount) badgeCount.textContent = `${upcoming.length} Festivals Tracked`;

    container.innerHTML = upcoming.map(item => {
      const meta = item.meta;
      const isLive = item.isCurrentlyActive;
      const colors = meta.colors || {};

      return `
        <div class="p-3.5 bg-white border ${isLive ? 'border-amber-400 shadow-sm ring-1 ring-amber-300' : 'border-zinc-200'} flex flex-col justify-between space-y-2.5 transition-all hover:border-zinc-400">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-base">${meta.icon}</span>
              ${isLive ? '<span class="px-2 py-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold uppercase tracking-wider rounded">Happening Now</span>' : `<span class="text-[10px] font-mono text-zinc-400">${item.start}</span>`}
            </div>
            <h5 class="text-xs font-semibold text-zinc-950">${meta.name}</h5>
            <p class="text-[10px] text-zinc-500 font-serif-editorial italic">${meta.tamilName || ''}</p>
            <p class="text-[11px] text-zinc-600 mt-1 line-clamp-2">${meta.description || meta.defaultBanner}</p>
          </div>

          <div class="pt-2 border-t border-zinc-100 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="w-3.5 h-3.5 rounded-full border border-black/10 inline-block" style="background-color: ${colors.accent || '#18181b'}"></span>
              <span class="w-3.5 h-3.5 rounded-full border border-black/10 inline-block" style="background-color: ${colors.bannerBg || '#18181b'}"></span>
              <span class="text-[10px] font-mono text-zinc-400">${item.start.slice(5)} – ${item.end.slice(5)}</span>
            </div>

            <button 
              type="button" 
              onclick="Admin.openThemePreviewModal('${item.festivalId}')" 
              class="px-2.5 py-1 text-[10px] uppercase font-semibold tracking-wider text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors"
            >
              Preview ↗
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async toggleFestivalAutoMode(enabled) {
    await window.Store.saveSettings({ festivalAutoMode: Boolean(enabled) });
    this.renderFestivalStatus();
    this.showToast(`Automatic festival scheduling is now ${enabled ? 'ENABLED' : 'PAUSED'}.`, 'success');
  },

  handleOverrideThemeChange(themeId) {
    const durationSelect = document.getElementById('fest-override-duration-select');
    if (durationSelect) {
      durationSelect.disabled = !themeId;
    }

    const customBannerInput = document.getElementById('fest-custom-banner-text');
    if (themeId && themeId !== 'none' && window.FestivalEngine) {
      const meta = window.FestivalEngine.METADATA[themeId];
      if (meta && customBannerInput && !customBannerInput.value) {
        customBannerInput.placeholder = meta.defaultBanner;
      }
    }
  },

  handleOverrideDurationChange(durationVal) {
    const wrap = document.getElementById('fest-custom-expiry-wrap');
    if (wrap) {
      if (durationVal === 'custom') {
        wrap.classList.remove('hidden');
      } else {
        wrap.classList.add('hidden');
      }
    }
  },

  resetToDefaultBannerGreeting() {
    const customBannerInput = document.getElementById('fest-custom-banner-text');
    const overrideSelect = document.getElementById('fest-manual-override-select');
    if (customBannerInput) {
      customBannerInput.value = '';
      if (overrideSelect && overrideSelect.value && window.FestivalEngine) {
        const meta = window.FestivalEngine.METADATA[overrideSelect.value];
        if (meta) customBannerInput.placeholder = meta.defaultBanner;
      } else {
        customBannerInput.placeholder = 'Leave blank to use the festival\'s default auspicious greeting';
      }
    }
    this.showToast('Reset to default auspicious greeting.', 'info');
  },

  async handleFestivalSettingsSubmit(e) {
    if (e) e.preventDefault();

    const autoMode = document.getElementById('fest-auto-mode-toggle').checked;
    const activeOverride = document.getElementById('fest-manual-override-select').value;
    const durationSelect = document.getElementById('fest-override-duration-select');
    const durationVal = durationSelect ? durationSelect.value : 'until_midnight';
    const customDateVal = document.getElementById('fest-custom-expiry-date').value;
    const customBanner = document.getElementById('fest-custom-banner-text').value.trim();

    let overrideUntil = '';

    if (activeOverride) {
      const now = new Date();
      if (durationVal === 'until_midnight') {
        // Today midnight in Asia/Kolkata
        const parts = window.FestivalEngine.getKolkataParts();
        overrideUntil = `${parts.isoDate}T23:59:59+05:30`;
      } else if (durationVal === '24h') {
        overrideUntil = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
      } else if (durationVal === '3d') {
        overrideUntil = new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString();
      } else if (durationVal === '7d') {
        overrideUntil = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
      } else if (durationVal === 'custom' && customDateVal) {
        overrideUntil = `${customDateVal}T23:59:59+05:30`;
      } else if (durationVal === 'indefinite') {
        overrideUntil = '';
      }
    }

    await window.Store.saveSettings({
      festivalAutoMode: autoMode,
      festivalActiveOverride: activeOverride,
      festivalOverrideUntil: overrideUntil,
      festivalCustomBanner: customBanner
    });

    this.renderFestivalStatus();
    this.renderUpcomingFestivals();
    this.showToast('Festival appearance settings updated and published successfully!', 'success');
  },

  async restoreAutomaticFestivalTheme() {
    await window.Store.saveSettings({
      festivalAutoMode: true,
      festivalActiveOverride: '',
      festivalOverrideUntil: '',
      festivalCustomBanner: ''
    });

    this.populateFestivalSettings();
    this.renderFestivalStatus();
    this.renderUpcomingFestivals();
    this.showToast('Restored automatic Asia/Kolkata festival scheduling.', 'success');
  },

  // --- THEME LIVE PREVIEW MODAL ---

  previewingFestivalId: null,

  openThemePreviewModal(festivalId = null) {
    if (!window.FestivalEngine) return;
    const modal = document.getElementById('festival-preview-modal');
    if (!modal) return;

    const targetId = festivalId || document.getElementById('fest-manual-override-select').value || 'pongal';
    const meta = window.FestivalEngine.METADATA[targetId] || window.FestivalEngine.METADATA.pongal;
    this.previewingFestivalId = meta.id;

    const titleEl = document.getElementById('fest-preview-modal-title');
    const badgeEl = document.getElementById('fest-preview-modal-badge');
    const bannerEl = document.getElementById('fest-preview-banner');
    const swatchesEl = document.getElementById('fest-preview-swatches');
    const descEl = document.getElementById('fest-preview-desc');
    const schedEl = document.getElementById('fest-preview-schedule');
    const noteEl = document.getElementById('fest-preview-note');

    if (titleEl) titleEl.textContent = `${meta.icon} ${meta.name}`;
    if (badgeEl) {
      badgeEl.textContent = `${meta.icon} ${meta.badge}`;
      badgeEl.style.backgroundColor = meta.colors.badgeBg || '#18181b';
      badgeEl.style.color = meta.colors.badgeText || '#ffffff';
      badgeEl.style.borderColor = meta.colors.accentBorder || '#e4e4e7';
    }

    if (bannerEl) {
      const customBannerInput = document.getElementById('fest-custom-banner-text');
      const bannerText = (customBannerInput && customBannerInput.value.trim()) || meta.defaultBanner;
      bannerEl.textContent = bannerText;
      bannerEl.style.backgroundColor = meta.colors.bannerBg || '#18181b';
      bannerEl.style.color = meta.colors.bannerText || '#fef08a';
      bannerEl.style.borderColor = meta.colors.accentBorder || '#e4e4e7';
    }

    if (swatchesEl) {
      const c = meta.colors || {};
      swatchesEl.innerHTML = `
        <span class="w-5 h-5 rounded-full border border-black/15 shadow-sm inline-block" title="Accent: ${c.accent}" style="background-color: ${c.accent}"></span>
        <span class="w-5 h-5 rounded-full border border-black/15 shadow-sm inline-block" title="Banner: ${c.bannerBg}" style="background-color: ${c.bannerBg}"></span>
        <span class="w-5 h-5 rounded-full border border-black/15 shadow-sm inline-block" title="Background: ${c.accentBg}" style="background-color: ${c.accentBg}"></span>
        <span class="text-[10px] text-zinc-500 font-mono pl-1">${c.accent} / ${c.bannerBg}</span>
      `;
    }

    if (descEl) descEl.textContent = meta.description;

    // Find schedule dates in calendar
    const sched = window.FestivalEngine.CALENDAR.find(c => c.festivalId === meta.id && c.year === 2026);
    if (schedEl) {
      if (sched) {
        schedEl.textContent = `2026 Scheduled Period: ${sched.start} to ${sched.end}`;
      } else {
        schedEl.textContent = `Verified Indian Calendar (Asia/Kolkata)`;
      }
    }

    if (noteEl) {
      noteEl.textContent = `The four categories (Outerwear, Tailoring, Dresses, Knitwear), existing stock, prices, WhatsApp concierge, and photos remain fully intact.`;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeThemePreviewModal() {
    const modal = document.getElementById('festival-preview-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  async applyPreviewAsActiveOverride() {
    if (!this.previewingFestivalId) return;

    const overrideSelect = document.getElementById('fest-manual-override-select');
    if (overrideSelect) {
      overrideSelect.value = this.previewingFestivalId;
      this.handleOverrideThemeChange(this.previewingFestivalId);
    }

    this.closeThemePreviewModal();
    await this.handleFestivalSettingsSubmit();
    this.showToast(`Theme "${this.previewingFestivalId}" is now actively published to storefront!`, 'success');
  },

  // ==========================================
  // PRODUCT / DESIGN ADD & EDIT MODAL & SINGLE-CLICK PHOTO UPLOAD
  // ==========================================

  showProductFormError(message) {
    const banner = document.getElementById('product-form-error-banner');
    const msgEl = document.getElementById('product-form-error-message');
    if (banner && msgEl) {
      msgEl.textContent = message;
      banner.classList.remove('hidden');
      banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  clearProductFormError() {
    const banner = document.getElementById('product-form-error-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  },

  setProductSubmitLoading(isLoading) {
    const submitBtn = document.getElementById('form-product-submit-btn');
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitBtn.innerHTML = '<span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 align-middle"></span><span>Processing Image...</span>';
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.innerHTML = this.editingProductId ? 'Update Product' : 'Save Product';
    }
  },

  resetUploadBox() {
    const fileInput = document.getElementById('form-product-file-input');
    const replaceInput = document.getElementById('form-single-replace-file-input');
    const quickInput = document.getElementById('table-quick-photo-input');
    const loadingOverlay = document.getElementById('image-upload-loading');
    const photoReadyBadge = document.getElementById('photo-ready-badge');

    if (fileInput) fileInput.value = '';
    if (replaceInput) replaceInput.value = '';
    if (quickInput) quickInput.value = '';
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    if (photoReadyBadge) photoReadyBadge.classList.add('hidden');
    this.clearProductFormError();
    this.setProductSubmitLoading(false);
    this.updateGalleryView();
  },

  openAddModal() {
    this.editingProductId = null;
    this.uploadedImageBase64 = null;
    this.productImages = [];
    this.activePreviewIndex = 0;
    this.replaceTargetIndex = null;
    this.clearProductFormError();

    const modal = document.getElementById('product-form-modal');
    const form = document.getElementById('product-edit-form');
    const titleEl = document.getElementById('modal-form-title');
    const submitBtn = document.getElementById('form-product-submit-btn');
    const photoReadyBadge = document.getElementById('photo-ready-badge');
    const loadingOverlay = document.getElementById('image-upload-loading');

    if (form) form.reset();
    if (titleEl) titleEl.textContent = 'Add New Garment / Design';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.innerHTML = 'Save Product';
    }
    if (photoReadyBadge) photoReadyBadge.classList.add('hidden');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');

    // Populate Category Dropdown with the 4 core categories
    this.populateCategorySelect('form-product-category', this.selectedCategory !== 'All' ? this.selectedCategory : 'Outerwear & Coats');

    // Default sizes check
    document.querySelectorAll('.form-size-check').forEach(chk => {
      chk.checked = ['S', 'M', 'L'].includes(chk.value);
    });

    const availInput = document.getElementById('form-product-available');
    if (availInput) availInput.checked = true;

    this.updateGalleryView();

    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  openEditModal(id) {
    const product = window.Store.getProductById(id);
    if (!product) return;

    this.editingProductId = id;
    this.uploadedImageBase64 = null;
    this.replaceTargetIndex = null;
    this.clearProductFormError();

    const modal = document.getElementById('product-form-modal');
    const titleEl = document.getElementById('modal-form-title');
    const submitBtn = document.getElementById('form-product-submit-btn');
    const photoReadyBadge = document.getElementById('photo-ready-badge');
    const loadingOverlay = document.getElementById('image-upload-loading');

    if (titleEl) titleEl.textContent = `Edit Design — ${product.name}`;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.innerHTML = 'Update Product';
    }
    if (photoReadyBadge) photoReadyBadge.classList.add('hidden');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');

    this.populateCategorySelect('form-product-category', product.category);

    document.getElementById('form-product-name').value = product.name || '';
    document.getElementById('form-product-price').value = product.price || '';
    document.getElementById('form-product-compare-price').value = product.comparePrice || '';
    document.getElementById('form-product-badge').value = product.badge || '';
    document.getElementById('form-product-description').value = product.description || '';
    document.getElementById('form-product-details').value = product.details || '';
    document.getElementById('form-product-available').checked = Boolean(product.isAvailable);

    // Sizes
    document.querySelectorAll('.form-size-check').forEach(chk => {
      chk.checked = (product.sizes || []).includes(chk.value);
    });

    // Extract product images array or fallback to single images
    let imgs = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      imgs = [...product.images];
    } else {
      if (product.image) imgs.push(product.image);
      if (product.secondaryImage && product.secondaryImage !== product.image) imgs.push(product.secondaryImage);
    }

    this.productImages = imgs;
    this.activePreviewIndex = 0;
    this.updateGalleryView();

    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('product-form-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    this.resetUploadBox();
  },

  populateCategorySelect(elementId, selected = 'Outerwear & Coats') {
    const select = document.getElementById(elementId);
    if (!select) return;
    const categories = window.Store.getCategories();

    select.innerHTML = categories.map(c => `
      <option value="${c.name}" ${c.name.toLowerCase() === selected.toLowerCase() ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');
  },

  // ==========================================
  // MULTI-IMAGE GALLERY PIPELINE & CONTROLS
  // ==========================================

  triggerMultiFileInput() {
    const fileInput = document.getElementById('form-product-file-input');
    if (!fileInput) return;
    fileInput.value = '';
    fileInput.click();
  },

  // Backward compatibility alias
  triggerFileInput() {
    this.triggerMultiFileInput();
  },

  async handleMultipleImagesSelected(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await this.processMultipleImageFiles(Array.from(files));
  },

  // Backward compatibility alias for single file selection
  async handleImageSelected(e) {
    await this.handleMultipleImagesSelected(e);
  },

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('image-empty-state');
    if (dropzone) {
      dropzone.classList.add('border-zinc-950', 'bg-zinc-100');
      dropzone.classList.remove('border-zinc-300');
    }
  },

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('image-empty-state');
    if (dropzone) {
      dropzone.classList.remove('border-zinc-950', 'bg-zinc-100');
      dropzone.classList.add('border-zinc-300');
    }
  },

  async handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.handleDragLeave(e);

    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      await this.processMultipleImageFiles(Array.from(files));
    }
  },

  async processMultipleImageFiles(files) {
    if (!files || files.length === 0) return;

    console.log("[Upload Debug] Files selected:", files.length);

    this.clearProductFormError();

    const loadingOverlay = document.getElementById('image-upload-loading');
    const loadingText = document.getElementById('image-upload-loading-text');
    const photoReadyBadge = document.getElementById('photo-ready-badge');

    // 1. Upload Trigger & Animated Loading Spinner
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    // 2. Status Text
    if (loadingText) loadingText.textContent = 'Optimizing & uploading image... Please wait';
    if (photoReadyBadge) photoReadyBadge.classList.add('hidden');

    // 3. Safety State: Disable "Save Product" / "Update Product" button while image is processing
    this.setProductSubmitLoading(true);

    try {
      const optimizedResults = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log("[Upload Debug] Compressing image index:", i, "Original size:", file.size);
        const opt = await ImageOptimizer.compress(file, 1000, 0.78);
        console.log("[Upload Debug] Compressed Base64 size (bytes):", opt.dataUrl.length);
        optimizedResults.push(opt);
      }

      const startIndex = this.productImages.length;
      optimizedResults.forEach(opt => {
        if (this.productImages.length < 10) {
          this.productImages.push(opt.dataUrl);
        }
      });

      // Point active preview to newly added photo
      this.activePreviewIndex = startIndex < this.productImages.length ? startIndex : 0;

      // Automatically sync to product if editing an existing garment
      if (this.editingProductId) {
        await window.Store.updateProductAsync(this.editingProductId, {
          images: this.productImages,
          image: this.productImages[0],
          secondaryImage: this.productImages[1] || this.productImages[0]
        });
        this.renderProductsTable();
        this.renderDashboard();
      }

      this.updateGalleryView();

      // Success State: replace spinner with clear preview & show small green checkmark "Photo ready"
      if (photoReadyBadge) {
        photoReadyBadge.classList.remove('hidden');
      }
      this.showToast(`Added ${optimizedResults.length} photograph${optimizedResults.length === 1 ? '' : 's'} to garment gallery.`, 'success');
    } catch (err) {
      console.error('[Upload Debug] Optimization/Upload error:', err);
      const errMsg = err.message || 'Image processing failed';
      this.showProductFormError(`Upload failed: ${errMsg}. Please check image format or server connection.`);
      alert(`Upload failed: ${errMsg}. Please check image format or server connection.`);
    } finally {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
      this.setProductSubmitLoading(false);
      const fileInput = document.getElementById('form-product-file-input');
      if (fileInput) fileInput.value = '';
    }
  },

  updateGalleryView() {
    const emptyState = document.getElementById('image-empty-state');
    const galleryState = document.getElementById('image-gallery-state');
    const totalCountBadge = document.getElementById('gallery-total-count-badge');
    const countBadge = document.getElementById('gallery-count-badge');
    const previewImg = document.getElementById('gallery-primary-preview-img');
    const previewBadge = document.getElementById('gallery-preview-badge');
    const previewTitle = document.getElementById('gallery-preview-title');
    const previewDims = document.getElementById('gallery-preview-dimensions');
    const setPrimaryBtn = document.getElementById('btn-set-active-as-primary');
    const urlInput = document.getElementById('form-product-image-url');
    const dimensionsBadge = document.getElementById('image-dimensions-badge');

    const total = this.productImages.length;

    if (totalCountBadge) {
      totalCountBadge.textContent = `${total} Photo${total === 1 ? '' : 's'}`;
    }
    if (countBadge) {
      countBadge.textContent = `(${total} photo${total === 1 ? '' : 's'})`;
    }

    if (total === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (galleryState) galleryState.classList.add('hidden');
      if (urlInput) urlInput.value = '';
      if (dimensionsBadge) dimensionsBadge.classList.add('hidden');
      return;
    }

    // Has 1 or more photos
    if (emptyState) emptyState.classList.add('hidden');
    if (galleryState) galleryState.classList.remove('hidden');

    // Clamp preview index
    if (this.activePreviewIndex >= total) {
      this.activePreviewIndex = Math.max(0, total - 1);
    }

    const currentImg = this.productImages[this.activePreviewIndex];
    if (previewImg) previewImg.src = currentImg;

    if (urlInput) urlInput.value = this.productImages[0];

    const isPrimary = this.activePreviewIndex === 0;

    if (previewBadge) {
      if (isPrimary) {
        previewBadge.textContent = 'Primary Card Photo';
        previewBadge.className = 'text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-zinc-950 text-white shadow-xs';
      } else {
        previewBadge.textContent = `Photo #${this.activePreviewIndex + 1}`;
        previewBadge.className = 'text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-zinc-700 text-white shadow-xs';
      }
    }

    if (previewTitle) {
      previewTitle.textContent = isPrimary 
        ? 'Primary Photo (Storefront Cover)' 
        : `Gallery Photo #${this.activePreviewIndex + 1}`;
    }

    if (previewDims) {
      previewDims.textContent = `Aspect ratio preserved · Image ${this.activePreviewIndex + 1} of ${total}`;
    }

    if (dimensionsBadge) {
      dimensionsBadge.textContent = `${total} Photos · ${isPrimary ? 'Primary selected' : `Viewing #${this.activePreviewIndex + 1}`}`;
      dimensionsBadge.classList.remove('hidden');
    }

    if (setPrimaryBtn) {
      if (isPrimary) {
        setPrimaryBtn.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
        setPrimaryBtn.innerHTML = `<span>★ Already Primary Cover</span>`;
      } else {
        setPrimaryBtn.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
        setPrimaryBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <span>Set as Primary Photo</span>
        `;
      }
    }

    this.renderGalleryThumbnails();
  },

  renderGalleryThumbnails() {
    const strip = document.getElementById('gallery-thumbnails-strip');
    if (!strip) return;

    strip.innerHTML = this.productImages.map((img, idx) => {
      const isSelected = idx === this.activePreviewIndex;
      const isPrimary = idx === 0;
      const isFirst = idx === 0;
      const isLast = idx === this.productImages.length - 1;

      return `
        <div 
          onclick="Admin.setActivePreviewImage(${idx})"
          class="group/thumb relative flex flex-col bg-white border cursor-pointer transition-all ${
            isSelected 
              ? 'border-zinc-950 ring-2 ring-zinc-950 shadow-md' 
              : 'border-zinc-200 hover:border-zinc-400'
          } p-1"
        >
          <!-- Image Box with Aspect Ratio Preservation -->
          <div class="relative w-full aspect-[3/4] bg-zinc-50 overflow-hidden flex items-center justify-center">
            <img 
              src="${img}" 
              alt="Photo ${idx + 1}" 
              class="w-full h-full object-contain transition-transform duration-300 group-hover/thumb:scale-105" 
            />

            <!-- Primary / Number Badge -->
            <div class="absolute top-1 left-1 z-10">
              ${isPrimary ? `
                <span class="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-zinc-950 text-white shadow-2xs">
                  Primary
                </span>
              ` : `
                <span class="text-[8px] font-mono px-1 py-0.2 bg-black/60 text-white rounded">
                  #${idx + 1}
                </span>
              `}
            </div>

            <!-- Top Action Hover Icon Buttons -->
            <div class="absolute top-1 right-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center gap-0.5 z-20">
              <button 
                type="button" 
                onclick="event.stopPropagation(); Admin.triggerReplacePhoto(${idx})"
                class="w-5 h-5 bg-white/95 text-zinc-800 hover:bg-zinc-950 hover:text-white rounded flex items-center justify-center text-[10px] shadow-xs"
                title="Replace this photo"
              >
                ↻
              </button>
              <button 
                type="button" 
                onclick="event.stopPropagation(); Admin.removeGalleryImage(${idx})"
                class="w-5 h-5 bg-white/95 text-rose-600 hover:bg-rose-600 hover:text-white rounded flex items-center justify-center text-[10px] shadow-xs"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Bottom Control Bar (Reorder & Set Primary) -->
          <div class="mt-1 pt-1 border-t border-zinc-100 flex items-center justify-between">
            <div class="inline-flex items-center gap-0.5">
              <button 
                type="button" 
                onclick="event.stopPropagation(); Admin.moveGalleryImage(${idx}, 'left')" 
                ${isFirst ? 'disabled' : ''} 
                class="w-4 h-4 text-zinc-500 hover:text-zinc-950 disabled:opacity-20 text-[9px] flex items-center justify-center"
                title="Move Left"
              >
                ◀
              </button>
              <button 
                type="button" 
                onclick="event.stopPropagation(); Admin.moveGalleryImage(${idx}, 'right')" 
                ${isLast ? 'disabled' : ''} 
                class="w-4 h-4 text-zinc-500 hover:text-zinc-950 disabled:opacity-20 text-[9px] flex items-center justify-center"
                title="Move Right"
              >
                ▶
              </button>
            </div>

            <button 
              type="button" 
              onclick="event.stopPropagation(); Admin.setPrimaryImage(${idx})" 
              class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${
                isPrimary 
                  ? 'text-zinc-400 font-semibold cursor-default' 
                  : 'text-zinc-800 hover:text-zinc-950 hover:bg-zinc-100 font-medium'
              }"
              title="Set as storefront primary card photo"
            >
              ${isPrimary ? '★ Main' : 'Make Main'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  setActivePreviewImage(index) {
    if (index >= 0 && index < this.productImages.length) {
      this.activePreviewIndex = index;
      this.updateGalleryView();
    }
  },

  setPrimaryImage(index) {
    if (index === 0 || index >= this.productImages.length) return;
    const [selectedPhoto] = this.productImages.splice(index, 1);
    this.productImages.unshift(selectedPhoto);
    this.activePreviewIndex = 0;

    if (this.editingProductId) {
      window.Store.updateProduct(this.editingProductId, {
        images: this.productImages,
        image: this.productImages[0],
        secondaryImage: this.productImages[1] || this.productImages[0]
      });
      this.renderProductsTable();
      this.renderDashboard();
    }

    this.updateGalleryView();
    this.showToast('Photo set as primary storefront cover.', 'success');
  },

  setActivePreviewAsPrimary() {
    this.setPrimaryImage(this.activePreviewIndex);
  },

  moveGalleryImage(index, direction) {
    if (direction === 'left' && index > 0) {
      const temp = this.productImages[index];
      this.productImages[index] = this.productImages[index - 1];
      this.productImages[index - 1] = temp;
      if (this.activePreviewIndex === index) {
        this.activePreviewIndex = index - 1;
      } else if (this.activePreviewIndex === index - 1) {
        this.activePreviewIndex = index;
      }
    } else if (direction === 'right' && index < this.productImages.length - 1) {
      const temp = this.productImages[index];
      this.productImages[index] = this.productImages[index + 1];
      this.productImages[index + 1] = temp;
      if (this.activePreviewIndex === index) {
        this.activePreviewIndex = index + 1;
      } else if (this.activePreviewIndex === index + 1) {
        this.activePreviewIndex = index;
      }
    } else {
      return;
    }

    if (this.editingProductId) {
      window.Store.updateProduct(this.editingProductId, {
        images: this.productImages,
        image: this.productImages[0],
        secondaryImage: this.productImages[1] || this.productImages[0]
      });
      this.renderProductsTable();
      this.renderDashboard();
    }

    this.updateGalleryView();
  },

  triggerReplacePhoto(index) {
    this.replaceTargetIndex = index;
    const replaceInput = document.getElementById('form-single-replace-file-input');
    if (replaceInput) {
      replaceInput.value = '';
      replaceInput.click();
    }
  },

  triggerReplaceActivePhoto() {
    this.triggerReplacePhoto(this.activePreviewIndex);
  },

  async handleSingleImageReplaced(e) {
    const file = e.target.files && e.target.files[0];
    const targetIdx = this.replaceTargetIndex;
    this.replaceTargetIndex = null;

    if (!file || targetIdx === null || targetIdx >= this.productImages.length) {
      this.resetUploadBox();
      return;
    }

    console.log("[Upload Debug] Files selected for replacement: 1");
    console.log("[Upload Debug] Compressing image index:", targetIdx, "Original size:", file.size);

    this.clearProductFormError();

    const loadingOverlay = document.getElementById('image-upload-loading');
    const loadingText = document.getElementById('image-upload-loading-text');
    const photoReadyBadge = document.getElementById('photo-ready-badge');

    // 1. Upload Trigger & Animated Loading Spinner
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    // 2. Status Text
    if (loadingText) loadingText.textContent = 'Optimizing & uploading image... Please wait';
    if (photoReadyBadge) photoReadyBadge.classList.add('hidden');

    // 3. Safety State: Disable submit button
    this.setProductSubmitLoading(true);

    try {
      const optimized = await ImageOptimizer.compress(file, 1000, 0.78);
      console.log("[Upload Debug] Compressed Base64 size (bytes):", optimized.dataUrl.length);

      this.productImages[targetIdx] = optimized.dataUrl;

      if (this.editingProductId) {
        await window.Store.updateProductAsync(this.editingProductId, {
          images: this.productImages,
          image: this.productImages[0],
          secondaryImage: this.productImages[1] || this.productImages[0]
        });
        this.renderProductsTable();
        this.renderDashboard();
      }

      this.activePreviewIndex = targetIdx;
      this.updateGalleryView();

      // Success State: replace spinner with clear preview & show small green checkmark "Photo ready"
      if (photoReadyBadge) {
        photoReadyBadge.classList.remove('hidden');
      }
      this.showToast('Photograph replaced successfully.', 'success');
    } catch (err) {
      console.error('[Upload Debug] Photo replacement error:', err);
      const errMsg = err.message || 'Image replacement failed';
      this.showProductFormError(`Upload failed: ${errMsg}. Please check image format or server connection.`);
      alert(`Upload failed: ${errMsg}. Please check image format or server connection.`);
    } finally {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
      this.setProductSubmitLoading(false);
      const replaceInput = document.getElementById('form-single-replace-file-input');
      if (replaceInput) replaceInput.value = '';
    }
  },

  removeGalleryImage(index) {
    if (index < 0 || index >= this.productImages.length) return;

    this.productImages.splice(index, 1);
    if (this.activePreviewIndex >= this.productImages.length) {
      this.activePreviewIndex = Math.max(0, this.productImages.length - 1);
    }

    if (this.editingProductId) {
      const fallback = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85";
      window.Store.updateProduct(this.editingProductId, {
        images: this.productImages,
        image: this.productImages[0] || fallback,
        secondaryImage: this.productImages[1] || this.productImages[0] || fallback
      });
      this.renderProductsTable();
      this.renderDashboard();
    }

    this.updateGalleryView();
    this.showToast('Photograph removed from gallery.');
  },

  removeActivePhoto() {
    this.removeGalleryImage(this.activePreviewIndex);
  },

  // Backward compatibility alias
  removeSelectedImage() {
    this.productImages = [];
    this.activePreviewIndex = 0;
    this.updateGalleryView();
  },

  clearAllGalleryImages() {
    if (this.productImages.length === 0) return;
    if (confirm('Are you sure you want to remove all photographs from this garment?')) {
      this.productImages = [];
      this.activePreviewIndex = 0;

      if (this.editingProductId) {
        const fallback = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85";
        window.Store.updateProduct(this.editingProductId, {
          images: [],
          image: fallback,
          secondaryImage: fallback
        });
        this.renderProductsTable();
        this.renderDashboard();
      }

      this.updateGalleryView();
      this.showToast('All gallery photographs removed.');
    }
  },

  quickUploadImageForProduct(productId) {
    this.openEditModal(productId);
  },

  async handleTablePhotoSelected(e) {
    const file = e.target.files && e.target.files[0];
    const productId = this.quickUploadTargetProductId;
    this.quickUploadTargetProductId = null;

    if (!file || !productId) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes((file.type || '').toLowerCase())) {
      const quickInput = document.getElementById('table-quick-photo-input');
      if (quickInput) quickInput.value = '';
      alert('Failed to load image. Please try another photo.');
      return;
    }

    try {
      this.showToast('Optimizing & uploading image... Please wait', 'info');
      const optimized = await ImageOptimizer.compress(file);

      const prod = window.Store.getProductById(productId);
      const existingImgs = (prod && Array.isArray(prod.images) && prod.images.length > 0)
        ? [optimized.dataUrl, ...prod.images]
        : [optimized.dataUrl];

      window.Store.updateProduct(productId, {
        images: existingImgs,
        image: optimized.dataUrl,
        secondaryImage: existingImgs[1] || optimized.dataUrl
      });
      this.renderProductsTable();
      this.renderDashboard();

      this.showToast(`Photo ready for "${prod ? prod.name : 'garment'}"!`, 'success');
    } catch (err) {
      console.error('Quick upload failed:', err);
      const quickInput = document.getElementById('table-quick-photo-input');
      if (quickInput) quickInput.value = '';
      alert('Failed to load image. Please try another photo.');
    }
  },

  applyPhotoPreset(url) {
    this.productImages.push(url);
    this.activePreviewIndex = this.productImages.length - 1;

    if (this.editingProductId) {
      window.Store.updateProduct(this.editingProductId, {
        images: this.productImages,
        image: this.productImages[0],
        secondaryImage: this.productImages[1] || this.productImages[0]
      });
      this.renderProductsTable();
      this.renderDashboard();
      this.showToast('Photoshoot preset added to garment gallery.', 'success');
    } else {
      this.showToast('Photoshoot preset added to gallery.');
    }

    this.updateGalleryView();
  },

  renderPhotoPresets() {
    const container = document.getElementById('preset-photos-container');
    if (!container) return;

    const presets = (window.DEFAULT_STORE_CONFIG && window.DEFAULT_STORE_CONFIG.photoPresets) || [];
    container.innerHTML = presets.map(p => `
      <button 
        type="button" 
        onclick="Admin.applyPhotoPreset('${p.url}')" 
        class="w-14 h-18 border border-zinc-200 hover:border-zinc-900 overflow-hidden relative group flex-shrink-0 bg-white"
        title="Add preset: ${p.title} (${p.category})"
      >
        <img src="${p.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
      </button>
    `).join('');
  },

  async handleProductSubmit(e) {
    e.preventDefault();

    this.clearProductFormError();

    const name = document.getElementById('form-product-name').value.trim();
    const category = document.getElementById('form-product-category').value;
    const price = parseFloat(document.getElementById('form-product-price').value);
    const comparePriceInput = document.getElementById('form-product-compare-price').value;
    const comparePrice = comparePriceInput ? parseFloat(comparePriceInput) : null;
    const badge = document.getElementById('form-product-badge').value || null;
    const description = document.getElementById('form-product-description').value.trim();
    const details = document.getElementById('form-product-details').value.trim();
    const isAvailable = document.getElementById('form-product-available').checked;

    const fallbackImage = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85";
    const finalImages = this.productImages.length > 0 ? this.productImages.slice(0, 10) : [fallbackImage];
    const primaryImage = finalImages[0] || fallbackImage;
    const secondaryImage = finalImages[1] || primaryImage;

    const sizes = [];
    document.querySelectorAll('.form-size-check:checked').forEach(chk => {
      sizes.push(chk.value);
    });

    const productPayload = {
      name,
      category,
      price,
      comparePrice,
      images: finalImages,
      image: primaryImage,
      secondaryImage,
      badge,
      description,
      details,
      isAvailable,
      sizes: sizes.length > 0 ? sizes : ['M']
    };

    const submitBtn = document.getElementById('form-product-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitBtn.innerHTML = '<span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 align-middle"></span><span>Saving Product...</span>';
    }

    try {
      console.log("[Upload Debug] Dispatching payload to /api/products...");

      if (this.editingProductId) {
        await window.Store.updateProductAsync(this.editingProductId, productPayload);
      } else {
        await window.Store.addProductAsync(productPayload);
      }

      // Visual Success Feedback
      this.showToast("Product and photos uploaded successfully!", 'success');
      alert("Product and photos uploaded successfully!");

      this.closeModal();
      this.renderProductsTable();
      this.renderCategorySelectorTabs();
      this.renderCategoriesView();
      this.renderDashboard();
    } catch (err) {
      console.error("[Upload Debug] Product save error:", err);
      const errMsg = err.message || 'Server error occurred while saving product';
      this.showProductFormError(`Upload failed: ${errMsg}. Please check image format or server connection.`);
      alert(`Upload failed: ${errMsg}. Please check image format or server connection.`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitBtn.innerHTML = this.editingProductId ? 'Update Product' : 'Save Product';
      }
    }
  },

  // ==========================================
  // CONFIRMATION MODAL & SAFE DELETION
  // ==========================================

  confirmDelete(id, type = 'product') {
    this.deleteTargetId = id;
    this.deleteTargetType = type;

    const titleEl = document.getElementById('delete-modal-title');
    const nameEl = document.getElementById('delete-product-name');
    const msgEl = document.getElementById('delete-modal-message');

    if (type === 'product') {
      const p = window.Store.getProductById(id);
      if (titleEl) titleEl.textContent = 'Delete Garment Design';
      if (nameEl) nameEl.textContent = p ? p.name : 'this design';
      if (msgEl) msgEl.innerHTML = `Are you sure you wish to permanently remove <strong class="text-zinc-900">${p ? p.name : 'this garment'}</strong>? It will immediately disappear from the public storefront.`;
    } else {
      if (titleEl) titleEl.textContent = 'Delete Customer Order';
      if (nameEl) nameEl.textContent = `Order #${id}`;
      if (msgEl) msgEl.innerHTML = `Are you sure you wish to delete <strong class="text-zinc-900">Order #${id}</strong> from your records?`;
    }

    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeDeleteModal() {
    this.deleteTargetId = null;
    this.deleteTargetType = 'product';
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  },

  async executeDelete() {
    if (!this.deleteTargetId) return;
    const id = this.deleteTargetId;
    const type = this.deleteTargetType;
    const confirmBtn = document.getElementById('confirm-delete-button');

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting...';
    }

    try {
      if (type === 'product') {
        const ok = await window.Store.deleteProduct(id);
        if (ok) {
          this.renderProductsTable();
          this.renderCategorySelectorTabs();
          this.renderCategoriesView();
          this.renderDashboard();
          this.showToast('Design permanently deleted from catalog & database.', 'success');
        } else {
          this.showToast('Failed to delete design.', 'error');
        }
      } else {
        const ok = await window.Store.deleteOrder(id);
        if (ok) {
          this.renderOrdersTable();
          this.renderDashboard();
          this.showToast('Order permanently deleted from server & database.', 'success');
        } else {
          this.showToast('Failed to delete order from server. Please check session permissions.', 'error');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      this.showToast('Error during deletion: ' + err.message, 'error');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Delete';
      }
      this.closeDeleteModal();
    }
  },

  // ==========================================
  // EVENT LISTENERS & TOAST NOTIFICATIONS
  // ==========================================

  initEventListeners() {
    // Image URL live preview
    const urlInput = document.getElementById('form-product-image-url');
    if (urlInput) {
      urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          this.uploadedImageBase64 = url;
          this.displayImagePreview(url, { dimensions: 'Direct URL', sizeStr: 'Linked image' });
        } else {
          this.removeSelectedImage();
        }
      });
    }

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeCategoryModal();
        this.closeDeleteModal();
      }
    });
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
  }
};

// Initialize Admin on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});
