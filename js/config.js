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

  // The 4 Core Main Product Categories
  categories: [
    "Outerwear & Coats",
    "Tailoring & Suits",
    "Dresses & Eveningwear",
    "Knitwear & Essentials"
  ],

  // Curated 4 Main Category Details
  mainCategories: [
    {
      id: "cat-outerwear",
      name: "Outerwear & Coats",
      slug: "outerwear",
      subtitle: "Architectural tailored coats, cocoon volumes & cashmere trenches",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85",
      enabled: true,
      order: 1
    },
    {
      id: "cat-tailoring",
      name: "Tailoring & Suits",
      slug: "tailoring",
      subtitle: "Sharp double-breasted wool blazers & pleated fluid trousers",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85",
      enabled: true,
      order: 2
    },
    {
      id: "cat-dresses",
      name: "Dresses & Eveningwear",
      slug: "dresses",
      subtitle: "Liquid silk charmeuse column gowns & sculpted evening silhouettes",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
      enabled: true,
      order: 3
    },
    {
      id: "cat-knitwear",
      name: "Knitwear & Essentials",
      slug: "knitwear",
      subtitle: "Plush Mongolian cashmere sweaters, organic poplin shirts & accessories",
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85",
      enabled: true,
      order: 4
    }
  ],

  // Curated High-Fashion Photo Presets for Easy Product Creation
  photoPresets: [
    {
      title: "Double-Breasted Wool Blazer",
      category: "Tailoring",
      url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Oversized Cashmere Overcoat",
      category: "Outerwear",
      url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Silk Charmeuse Column Dress",
      category: "Dresses",
      url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Merino Mock-Neck Sweater",
      category: "Knitwear",
      url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Pleated Wide-Leg Wool Trousers",
      category: "Tailoring",
      url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Sculpted Trench Coat in Camel",
      category: "Outerwear",
      url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Heavyweight Cotton Poplin Shirt",
      category: "Essentials",
      url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85"
    },
    {
      title: "Minimalist Italian Leather Tote",
      category: "Accessories",
      url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85",
      altUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85"
    }
  ]
};

// Export configuration to window for universal access across pages
if (typeof window !== 'undefined') {
  window.DEFAULT_STORE_CONFIG = DEFAULT_STORE_CONFIG;
}
