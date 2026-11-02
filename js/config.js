/**
 * ELUMALAYAN GARMENTS - Global Store Configuration
 * 
 * Configured for Elumalayan Garments, Salem, Tamil Nadu, India.
 * Supports up to three WhatsApp order dispatch numbers.
 */

const DEFAULT_STORE_CONFIG = {
  // Brand Identity
  storeName: "Elumalayan Garments",
  brandName: "Poorani Pattu Pavadai",
  subtitle: "Home of Poorani Pattu Pavadai",
  tagline: "Traditional Elegance, Made for Little Princesses!",
  subBadge: "Little Queen's Pattu Wear",
  established: "2010",
  
  // Currency & Commerce (Indian Rupee)
  currencySymbol: "₹",
  currencyCode: "INR",
  taxIncluded: true,
  freeShippingThreshold: 1500,

  // Social & Direct Communication (3 WhatsApp Contacts)
  whatsappNumber: "+91 99407 73278",   // Number 1: Primary Dispatch (+91 99407 73278)
  whatsappNumber2: "",                // Number 2: Optional Secondary Dispatch
  whatsappNumber3: "",                // Number 3: Optional Support / Management
  whatsappDefaultMessage: "Hello Elumalayan Garments! I am inquiring about {product_name} ({product_price}). Is this garment currently available?",
  instagramHandle: "poorani_pattu_pavadai",
  instagramUrl: "https://www.instagram.com/poorani_pattu_pavadai",
  
  // Contact & Concierge
  supportEmail: "contact@elumalayangarments.com",
  supportPhone: "+91 99407 73278",
  address: "Elumalayan Garments\n97/12 D, Alraj St,\nSwaminathapuram,\nSalem – 636009,\nTamil Nadu, India.",
  openingHours: "Mon – Sat: 09:30 – 21:00 | Sun: 10:00 – 20:00",

  // Announcement Bar
  announcementText: "Elumalayan Garments — Direct Delivery Across India & Custom Orders via WhatsApp",
  showAnnouncement: true,

  // Festival & Seasonal Theme Configuration (Asia/Kolkata Scheduler)
  festivalAutoMode: true,
  festivalActiveOverride: "",
  festivalOverrideUntil: "",
  festivalCustomBanner: "",
  festivalCustomDates: "{}",

  // The 4 Signature Tamil Ethnic Product Categories
  categories: [
    "Traditional Pattu Pavadai",
    "Festive & Wedding Specials",
    "Aari Work & Designer Pavadai",
    "Little Princess Daily Ethnic Wear"
  ],

  // Curated 4 Signature Category Details
  mainCategories: [
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
  ],

  // Curated Ethnic Photo Presets for Easy Product Creation
  photoPresets: [
    {
      title: "Salem Pure Kanchipuram Silk Pattu Pavadai",
      category: "Traditional Pattu Pavadai",
      url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Royal Magenta Handloom Pattu Pavadai",
      category: "Traditional Pattu Pavadai",
      url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Grand Temple Border Wedding Pavadai",
      category: "Festive & Wedding Specials",
      url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Peacock Blue Festive Brocade Set",
      category: "Festive & Wedding Specials",
      url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Intricate Hand-Stitched Aari Designer Pavadai",
      category: "Aari Work & Designer Pavadai",
      url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Little Princess Floral Cotton Silk Pavadai",
      category: "Little Princess Daily Ethnic Wear",
      url: "https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85"
    }
  ]
};

// Export configuration to window for universal access across pages
if (typeof window !== 'undefined') {
  window.DEFAULT_STORE_CONFIG = DEFAULT_STORE_CONFIG;
}
