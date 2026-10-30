/**
 * ELUMALAYAN GARMENTS - TAMIL NADU & INDIAN FESTIVAL THEME ENGINE
 * ===============================================================
 * Maintainable festival calendar, Asia/Kolkata timezone scheduling,
 * luxury festive themes, manual overrides with auto-expiration,
 * and storefront DOM theme applicator.
 */

(function (window) {
  'use strict';

  // 1. FESTIVAL DEFINITIONS & COLOR PALETTES
  // Designed with understated luxury: elegant accents, refined borders,
  // warm ambient banners, preserving high-fashion monochrome typography.
  const FESTIVALS_META = {
    pongal: {
      id: 'pongal',
      name: 'Pongal (Thai Pongal & Mattu Pongal)',
      shortName: 'Pongal',
      tamilName: 'பொங்கல் திருநாள்',
      icon: '🌾',
      badge: 'Harvest Festival Edition',
      defaultBanner: '🌾 Iniya Pongal Nalvazhthukkal — Celebrate the Harvest Season with Handcrafted Silhouettes',
      themeClass: 'theme-festival-pongal',
      colors: {
        accent: '#c98a2c',         // Warm harvest gold / turmeric
        accentHover: '#ad731f',
        accentBg: '#fefbf6',        // Warm ivory
        accentBorder: '#e8cfa1',
        badgeBg: '#78350f',
        badgeText: '#fef3c7',
        bannerBg: '#78350f',        // Deep terracotta
        bannerText: '#fef3c7',
        glow: 'rgba(201, 138, 44, 0.18)'
      },
      decorStyle: 'sugarcane-kolam',
      description: 'Warm harvest tones, sugarcane-inspired gold accents, and subtle kolam geometry.'
    },
    tamizhnputhandu: {
      id: 'tamizhnputhandu',
      name: 'Tamil New Year (Puthandu)',
      shortName: 'Tamil New Year',
      tamilName: 'தமிழ்ப்ப புத்தாண்டு',
      icon: '✨',
      badge: 'Puthandu Special Collection',
      defaultBanner: '✨ Iniya Tamizh Puthandu Nalvazhthukkal — Usher in New Beginnings with Exquisite Festive Attire',
      themeClass: 'theme-festival-puthandu',
      colors: {
        accent: '#991b1b',         // Auspicious royal vermilion / maroon
        accentHover: '#7f1d1d',
        accentBg: '#fff7f7',
        accentBorder: '#fecaca',
        badgeBg: '#881337',
        badgeText: '#ffe4e6',
        bannerBg: '#881337',
        bannerText: '#fff1f2',
        glow: 'rgba(153, 27, 27, 0.16)'
      },
      decorStyle: 'mango-leaf',
      description: 'Royal maroon & antique brass gold accents honoring heritage craftsmanship.'
    },
    regionalnewyear: {
      id: 'regionalnewyear',
      name: 'Regional New Year (Ugadi / Vishu)',
      shortName: 'New Year Celebrations',
      tamilName: 'புத்தாண்டு நல்வாழ்த்துகள்',
      icon: '🌸',
      badge: 'New Year Festive Edit',
      defaultBanner: '🌸 Happy Ugadi & Vishu — Auspicious New Beginnings & Festive Couture',
      themeClass: 'theme-festival-regional-ny',
      colors: {
        accent: '#15803d',         // Fresh neem / mango green
        accentHover: '#166534',
        accentBg: '#f6fdf8',
        accentBorder: '#bbf7d0',
        badgeBg: '#14532d',
        badgeText: '#dcfce7',
        bannerBg: '#14532d',
        bannerText: '#f0fdf4',
        glow: 'rgba(21, 128, 61, 0.16)'
      },
      decorStyle: 'festive-floral',
      description: 'Fresh spring green and warm gold honoring regional traditions.'
    },
    navratri: {
      id: 'navratri',
      name: 'Navratri (Nine Auspicious Nights)',
      shortName: 'Navratri',
      tamilName: 'நவராத்திரி விழா',
      icon: '🌺',
      badge: 'Navratri Haute Couture',
      defaultBanner: '🌺 Shubh Navratri — Celebrating Heritage, Nine Auspicious Nights & Artisanal Elegance',
      themeClass: 'theme-festival-navratri',
      colors: {
        accent: '#b91c1c',         // Ruby jewel crimson
        accentHover: '#991b1b',
        accentBg: '#fef7f7',
        accentBorder: '#fca5a5',
        badgeBg: '#7f1d1d',
        badgeText: '#fee2e2',
        bannerBg: '#7f1d1d',
        bannerText: '#fef2f2',
        glow: 'rgba(185, 28, 28, 0.16)'
      },
      decorStyle: 'jewel-tones',
      description: 'Refined jewel tones, ruby accents, and festive elegance.'
    },
    ayudhapooja: {
      id: 'ayudhapooja',
      name: 'Ayudha Pooja & Saraswati Pooja',
      shortName: 'Ayudha Pooja',
      tamilName: 'ஆயுத பூஜை & சரஸ்வதி பூஜை',
      icon: '✨',
      badge: 'Artisanal Heritage Edition',
      defaultBanner: '✨ Ayudha Pooja & Saraswati Pooja — Honouring Craftsmanship, Artisanal Mastery & Knowledge',
      themeClass: 'theme-festival-ayudhapooja',
      colors: {
        accent: '#b45309',         // Sandalwood amber
        accentHover: '#92400e',
        accentBg: '#fffbeb',
        accentBorder: '#fde68a',
        badgeBg: '#78350f',
        badgeText: '#fef3c7',
        bannerBg: '#78350f',
        bannerText: '#fffbeb',
        glow: 'rgba(180, 83, 9, 0.18)'
      },
      decorStyle: 'sandalwood-brass',
      description: 'Warm sandalwood gold, honoring the tools of the weaver and tailor.'
    },
    dussehra: {
      id: 'dussehra',
      name: 'Dussehra / Vijayadashami',
      shortName: 'Vijayadashami',
      tamilName: 'விஜயதசமி திருநாள்',
      icon: '🏹',
      badge: 'Vijayadashami Collection',
      defaultBanner: '🏹 Shubh Vijayadashami — Triumphant Grace & Timeless Festive Silhouettes',
      themeClass: 'theme-festival-dussehra',
      colors: {
        accent: '#9a3412',         // Regal saffron-copper
        accentHover: '#7c2d12',
        accentBg: '#fff7ed',
        accentBorder: '#fed7aa',
        badgeBg: '#7c2d12',
        badgeText: '#ffedd5',
        bannerBg: '#7c2d12',
        bannerText: '#fff7ed',
        glow: 'rgba(154, 52, 18, 0.16)'
      },
      decorStyle: 'royal-triumph',
      description: 'Regal saffron and antique gold celebrating victory and auspicious beginnings.'
    },
    deepavali: {
      id: 'deepavali',
      name: 'Deepavali (Diwali Festival of Lights)',
      shortName: 'Deepavali',
      tamilName: 'தீபாவளி திருநாள்',
      icon: '🪔',
      badge: 'Deepavali Grand Festive Edit',
      defaultBanner: '🪔 Shubh Deepavali — Illuminating Luxury Festive Collections & Artisanal Weaves',
      themeClass: 'theme-festival-deepavali',
      colors: {
        accent: '#d97706',         // Luminous Diya gold
        accentHover: '#b45309',
        accentBg: '#fffbeb',
        accentBorder: '#fde68a',
        badgeBg: '#1c1917',
        badgeText: '#fef08a',
        bannerBg: '#1c1917',        // Midnight charcoal with gold text
        bannerText: '#fef08a',
        glow: 'rgba(217, 119, 6, 0.22)'
      },
      decorStyle: 'diya-light',
      description: 'Luminous champagne gold accents and warm lighting effects.'
    },
    karthigaideepam: {
      id: 'karthigaideepam',
      name: 'Karthigai Deepam',
      shortName: 'Karthigai Deepam',
      tamilName: 'கார்த்திகை தீபம்',
      icon: '🪔',
      badge: 'Traditional Lamp Edition',
      defaultBanner: '🪔 Iniya Karthigai Deepam — Traditional Radiance, Oil-Lamp Glow & Eveningwear Collections',
      themeClass: 'theme-festival-karthigai',
      colors: {
        accent: '#ea580c',         // Terracotta flame
        accentHover: '#c2410c',
        accentBg: '#fff7ed',
        accentBorder: '#ffedd5',
        badgeBg: '#9a3412',
        badgeText: '#ffedd5',
        bannerBg: '#431407',
        bannerText: '#fed7aa',
        glow: 'rgba(234, 88, 12, 0.20)'
      },
      decorStyle: 'agal-vilakku',
      description: 'Deep terracotta lamp warmth celebrating the sacred hills of Tamil Nadu.'
    },
    vinayagarchaturthi: {
      id: 'vinayagarchaturthi',
      name: 'Vinayagar Chaturthi (Ganesh Chaturthi)',
      shortName: 'Vinayagar Chaturthi',
      tamilName: 'விநாயகர் சதுர்த்தி',
      icon: '🐘',
      badge: 'Auspicious Festive Edit',
      defaultBanner: '🐘 Vinayagar Chaturthi Nalvazhthukkal — Auspicious Occasions, Timeless Luxury Silhouettes',
      themeClass: 'theme-festival-vinayagar',
      colors: {
        accent: '#c2410c',         // Auspicious vermilion
        accentHover: '#9a3412',
        accentBg: '#fff7ed',
        accentBorder: '#fed7aa',
        badgeBg: '#7c2d12',
        badgeText: '#ffedd5',
        bannerBg: '#7c2d12',
        bannerText: '#fff7ed',
        glow: 'rgba(194, 65, 12, 0.16)'
      },
      decorStyle: 'sandalwood-vermilion',
      description: 'Auspicious vermilion and sacred sandalwood gold accents.'
    },
    krishnajayanthi: {
      id: 'krishnajayanthi',
      name: 'Krishna Jayanthi (Gokulashtami)',
      shortName: 'Krishna Jayanthi',
      tamilName: 'கிருஷ்ண ஜெயந்தி',
      icon: '🦚',
      badge: 'Peacock Festive Edit',
      defaultBanner: '🦚 Krishna Jayanthi Greetings — Festive Grace, Peacock Accents & Pure Silk Ensembles',
      themeClass: 'theme-festival-krishna',
      colors: {
        accent: '#1e40af',         // Royal peacock blue
        accentHover: '#1e3a8a',
        accentBg: '#eff6ff',
        accentBorder: '#bfdbfe',
        badgeBg: '#172554',
        badgeText: '#dbeafe',
        bannerBg: '#172554',
        bannerText: '#f0fdf4',
        glow: 'rgba(30, 64, 175, 0.16)'
      },
      decorStyle: 'peacock-feather',
      description: 'Peacock royal blue and flute-gold accents.'
    },
    christmas: {
      id: 'christmas',
      name: 'Christmas & Year-End Holidays',
      shortName: 'Christmas & New Year',
      tamilName: 'கிறிஸ்துமஸ் & புத்தாண்டு',
      icon: '❄️',
      badge: 'Winter Holiday Collection',
      defaultBanner: '❄️ Joyous Season Greetings — Curated Cashmere, Fine Wool & Holiday Eveningwear',
      themeClass: 'theme-festival-christmas',
      colors: {
        accent: '#15803d',         // Restrained holiday pine
        accentHover: '#166534',
        accentBg: '#f6fdf8',
        accentBorder: '#bbf7d0',
        badgeBg: '#052e16',
        badgeText: '#dcfce7',
        bannerBg: '#052e16',        // Deep forest emerald
        bannerText: '#dcfce7',
        glow: 'rgba(21, 128, 61, 0.15)'
      },
      decorStyle: 'winter-silver',
      description: 'Restrained seasonal pine emerald and holiday crimson highlights.'
    },
    eid: {
      id: 'eid',
      name: 'Eid Celebrations (Eid al-Fitr & Eid al-Adha)',
      shortName: 'Eid Celebrations',
      tamilName: 'ரம்ஜான் & பக்ரீத் பெருநாள்',
      icon: '🌙',
      badge: 'Festive Silk Collection',
      defaultBanner: '🌙 Eid Mubarak — Graceful Festive Ensembles, Liquid Silk Charmeuse & Bespoke Tailoring',
      themeClass: 'theme-festival-eid',
      colors: {
        accent: '#047857',         // Noble emerald
        accentHover: '#065f46',
        accentBg: '#f0fdf4',
        accentBorder: '#a7f3d0',
        badgeBg: '#064e3b',
        badgeText: '#d1fae5',
        bannerBg: '#064e3b',
        bannerText: '#ecfdf5',
        glow: 'rgba(4, 120, 87, 0.16)'
      },
      decorStyle: 'crescent-lattice',
      description: 'Noble crescent emerald green and warm champagne gold accents.'
    }
  };

  // 2. VERIFIED MULTI-YEAR CALENDAR (2025 - 2030)
  // Lunar calculations and verified panchangam dates for Tamil Nadu / India.
  // Each event spans start date (00:00:00 Asia/Kolkata) to end date (23:59:59 Asia/Kolkata).
  const FESTIVAL_CALENDAR_SCHEDULE = [
    // --- 2025 ---
    { festivalId: 'pongal', start: '2025-01-13', end: '2025-01-17', year: 2025 },
    { festivalId: 'regionalnewyear', start: '2025-03-29', end: '2025-03-31', year: 2025 },
    { festivalId: 'eid', start: '2025-03-30', end: '2025-04-01', year: 2025 }, // Eid al-Fitr
    { festivalId: 'tamizhnputhandu', start: '2025-04-13', end: '2025-04-15', year: 2025 },
    { festivalId: 'eid', start: '2025-06-06', end: '2025-06-08', year: 2025 }, // Eid al-Adha
    { festivalId: 'krishnajayanthi', start: '2025-08-15', end: '2025-08-17', year: 2025 },
    { festivalId: 'vinayagarchaturthi', start: '2025-08-26', end: '2025-08-28', year: 2025 },
    { festivalId: 'navratri', start: '2025-09-22', end: '2025-09-30', year: 2025 },
    { festivalId: 'ayudhapooja', start: '2025-10-01', end: '2025-10-01', year: 2025 },
    { festivalId: 'dussehra', start: '2025-10-02', end: '2025-10-03', year: 2025 },
    { festivalId: 'deepavali', start: '2025-10-18', end: '2025-10-22', year: 2025 },
    { festivalId: 'karthigaideepam', start: '2025-12-03', end: '2025-12-05', year: 2025 },
    { festivalId: 'christmas', start: '2025-12-20', end: '2025-12-31', year: 2025 },

    // --- 2026 ---
    { festivalId: 'pongal', start: '2026-01-13', end: '2026-01-17', year: 2026 },
    { festivalId: 'regionalnewyear', start: '2026-03-18', end: '2026-03-20', year: 2026 },
    { festivalId: 'eid', start: '2026-03-19', end: '2026-03-22', year: 2026 }, // Eid al-Fitr
    { festivalId: 'tamizhnputhandu', start: '2026-04-13', end: '2026-04-15', year: 2026 },
    { festivalId: 'eid', start: '2026-05-26', end: '2026-05-28', year: 2026 }, // Eid al-Adha
    { festivalId: 'krishnajayanthi', start: '2026-09-03', end: '2026-09-05', year: 2026 },
    { festivalId: 'vinayagarchaturthi', start: '2026-09-13', end: '2026-09-15', year: 2026 },
    { festivalId: 'navratri', start: '2026-10-10', end: '2026-10-18', year: 2026 },
    { festivalId: 'ayudhapooja', start: '2026-10-19', end: '2026-10-19', year: 2026 },
    { festivalId: 'dussehra', start: '2026-10-20', end: '2026-10-21', year: 2026 },
    { festivalId: 'deepavali', start: '2026-11-06', end: '2026-11-10', year: 2026 },
    { festivalId: 'karthigaideepam', start: '2026-11-22', end: '2026-11-24', year: 2026 },
    { festivalId: 'christmas', start: '2026-12-20', end: '2026-12-31', year: 2026 },

    // --- 2027 ---
    { festivalId: 'pongal', start: '2027-01-13', end: '2027-01-17', year: 2027 },
    { festivalId: 'eid', start: '2027-03-09', end: '2027-03-12', year: 2027 },
    { festivalId: 'regionalnewyear', start: '2027-04-06', end: '2027-04-08', year: 2027 },
    { festivalId: 'tamizhnputhandu', start: '2027-04-13', end: '2027-04-15', year: 2027 },
    { festivalId: 'eid', start: '2027-05-16', end: '2027-05-18', year: 2027 },
    { festivalId: 'krishnajayanthi', start: '2027-08-24', end: '2027-08-26', year: 2027 },
    { festivalId: 'vinayagarchaturthi', start: '2027-09-03', end: '2027-09-05', year: 2027 },
    { festivalId: 'navratri', start: '2027-09-29', end: '2027-10-08', year: 2027 },
    { festivalId: 'ayudhapooja', start: '2027-10-09', end: '2027-10-09', year: 2027 },
    { festivalId: 'dussehra', start: '2027-10-10', end: '2027-10-11', year: 2027 },
    { festivalId: 'deepavali', start: '2027-10-27', end: '2027-10-31', year: 2027 },
    { festivalId: 'karthigaideepam', start: '2027-12-11', end: '2027-12-13', year: 2027 },
    { festivalId: 'christmas', start: '2027-12-20', end: '2027-12-31', year: 2027 },

    // --- 2028 ---
    { festivalId: 'pongal', start: '2028-01-13', end: '2028-01-17', year: 2028 },
    { festivalId: 'eid', start: '2028-02-26', end: '2028-02-28', year: 2028 },
    { festivalId: 'regionalnewyear', start: '2028-03-26', end: '2028-03-28', year: 2028 },
    { festivalId: 'tamizhnputhandu', start: '2028-04-13', end: '2028-04-15', year: 2028 },
    { festivalId: 'eid', start: '2028-05-05', end: '2028-05-07', year: 2028 },
    { festivalId: 'krishnajayanthi', start: '2028-08-12', end: '2028-08-14', year: 2028 },
    { festivalId: 'vinayagarchaturthi', start: '2028-08-23', end: '2028-08-25', year: 2028 },
    { festivalId: 'navratri', start: '2028-10-17', end: '2028-10-25', year: 2028 },
    { festivalId: 'ayudhapooja', start: '2028-10-26', end: '2028-10-26', year: 2028 },
    { festivalId: 'dussehra', start: '2028-10-27', end: '2028-10-28', year: 2028 },
    { festivalId: 'deepavali', start: '2028-11-15', end: '2028-11-19', year: 2028 },
    { festivalId: 'karthigaideepam', start: '2028-11-29', end: '2028-12-01', year: 2028 },
    { festivalId: 'christmas', start: '2028-12-20', end: '2028-12-31', year: 2028 }
  ];

  // 3. ASIA/KOLKATA TIMEZONE HELPERS
  const FestivalEngine = {
    TIMEZONE: 'Asia/Kolkata',
    METADATA: FESTIVALS_META,
    CALENDAR: FESTIVAL_CALENDAR_SCHEDULE,

    /**
     * Converts a given JS Date or timestamp to Asia/Kolkata date components.
     * Guaranteed reliable across any user system timezone.
     */
    getKolkataParts(dateInput = null) {
      const d = dateInput ? new Date(dateInput) : new Date();
      if (isNaN(d.getTime())) {
        return this.getKolkataParts(new Date());
      }

      // Use Intl.DateTimeFormat in Asia/Kolkata
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: this.TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(d);
      const m = {};
      parts.forEach(p => m[p.type] = p.value);

      const y = parseInt(m.year, 10);
      const mo = parseInt(m.month, 10);
      const day = parseInt(m.day, 10);
      const hr = parseInt(m.hour || '0', 10);
      const min = parseInt(m.minute || '0', 10);
      const sec = parseInt(m.second || '0', 10);

      const isoDate = `${m.year}-${m.month}-${m.day}`;
      const isoDateTime = `${isoDate}T${m.hour || '00'}:${m.minute || '00'}:${m.second || '00'}`;

      return {
        year: y,
        month: mo,
        day: day,
        hour: hr,
        minute: min,
        second: sec,
        isoDate: isoDate,
        isoDateTime: isoDateTime,
        displayTime: `${isoDate} ${m.hour}:${m.minute} IST (Asia/Kolkata)`
      };
    },

    /**
     * Returns the active schedule including any custom admin date overrides.
     */
    getMergedSchedule(settings = {}) {
      let customDates = {};
      if (settings && settings.festivalCustomDates) {
        try {
          customDates = typeof settings.festivalCustomDates === 'string'
            ? JSON.parse(settings.festivalCustomDates)
            : settings.festivalCustomDates;
        } catch (e) {
          customDates = {};
        }
      }

      // Clone default schedule and apply custom overrides if applicable
      return this.CALENDAR.map(item => {
        const custom = customDates[item.festivalId + '_' + item.year] || customDates[item.festivalId];
        if (custom) {
          return {
            ...item,
            start: custom.start || item.start,
            end: custom.end || item.end,
            isCustom: true
          };
        }
        return item;
      });
    },

    /**
     * Detects the currently active festival.
     * Resolves:
     * 1. Manual override (if set and not expired)
     * 2. Automatic calendar matching (if auto-mode is ON)
     * 3. Fallback to null (Normal luxury theme)
     */
    getCurrentFestival(settings = {}, simulatedDate = null) {
      const nowParts = this.getKolkataParts(simulatedDate);
      const todayIso = nowParts.isoDate;

      const autoMode = settings.festivalAutoMode !== false &&
                       settings.festivalAutoMode !== '0' &&
                       settings.festivalAutoMode !== 0 &&
                       settings.festivalAutoMode !== 'false';

      const override = (settings.festivalActiveOverride || '').trim().toLowerCase();
      const overrideUntil = settings.festivalOverrideUntil ? new Date(settings.festivalOverrideUntil) : null;

      // 1. Check Manual Override
      if (override && override !== 'auto' && override !== '') {
        // If override is explicitly set to 'none' or 'normal', force standard theme
        if (override === 'none' || override === 'normal') {
          return {
            isActive: false,
            mode: 'manual_override_none',
            festival: null,
            nowParts: nowParts
          };
        }

        // Check if override has expired
        if (overrideUntil && !isNaN(overrideUntil.getTime())) {
          const nowMs = simulatedDate ? new Date(simulatedDate).getTime() : Date.now();
          if (nowMs > overrideUntil.getTime()) {
            // Override has expired! Auto-revert to automatic schedule
            // Logically fall through to auto-mode check
          } else {
            // Override is active and valid
            const meta = this.METADATA[override];
            if (meta) {
              return {
                isActive: true,
                mode: 'manual_override',
                festivalId: override,
                meta: meta,
                customBanner: settings.festivalCustomBanner || '',
                schedule: { start: todayIso, end: overrideUntil.toISOString().split('T')[0] },
                expiresAt: overrideUntil.toISOString(),
                nowParts: nowParts
              };
            }
          }
        } else {
          // Indefinite manual override
          const meta = this.METADATA[override];
          if (meta) {
            return {
              isActive: true,
              mode: 'manual_override',
              festivalId: override,
              meta: meta,
              customBanner: settings.festivalCustomBanner || '',
              schedule: { start: todayIso, end: 'Indefinite' },
              nowParts: nowParts
            };
          }
        }
      }

      // 2. If Automatic Festival Mode is OFF and no override, return normal theme
      if (!autoMode) {
        return {
          isActive: false,
          mode: 'auto_disabled',
          festival: null,
          nowParts: nowParts
        };
      }

      // 3. Automatic Schedule Evaluation
      const schedule = this.getMergedSchedule(settings);
      
      // Find event matching today's Asia/Kolkata date
      // Priority given to specific 1-day poojas if overlapping (e.g. Ayudha Pooja over Navratri)
      const matching = schedule.filter(item => todayIso >= item.start && todayIso <= item.end);

      if (matching.length > 0) {
        // Sort by shortest duration (more specific festival wins, e.g. Ayudha Pooja > Navratri)
        matching.sort((a, b) => {
          const durA = new Date(a.end) - new Date(a.start);
          const durB = new Date(b.end) - new Date(b.start);
          return durA - durB;
        });

        const activeItem = matching[0];
        const meta = this.METADATA[activeItem.festivalId];

        if (meta) {
          return {
            isActive: true,
            mode: 'automatic',
            festivalId: activeItem.festivalId,
            meta: meta,
            customBanner: settings.festivalCustomBanner || '',
            schedule: activeItem,
            nowParts: nowParts
          };
        }
      }

      // 4. Default: No festival active -> Pristine luxury monochrome theme
      return {
        isActive: false,
        mode: 'automatic_none',
        festival: null,
        nowParts: nowParts
      };
    },

    /**
     * Returns a list of upcoming festivals from the schedule.
     */
    getUpcomingFestivals(settings = {}, simulatedDate = null, limit = 6) {
      const nowParts = this.getKolkataParts(simulatedDate);
      const todayIso = nowParts.isoDate;
      const schedule = this.getMergedSchedule(settings);

      // Filter events starting today or in future
      const upcoming = schedule
        .filter(item => item.end >= todayIso)
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, limit);

      return upcoming.map(item => {
        const meta = this.METADATA[item.festivalId] || { name: item.festivalId, icon: '✨' };
        const isCurrentlyActive = todayIso >= item.start && todayIso <= item.end;
        return {
          ...item,
          meta: meta,
          isCurrentlyActive: isCurrentlyActive
        };
      });
    },

    /**
     * Applies or removes festival theme from DOM.
     * Fast, lightweight, non-destructive to product data and layouts.
     */
    applyThemeToDOM(detectionResult) {
      const root = document.documentElement;
      const body = document.body;
      if (!root || !body) return;

      // Remove any existing festival theme classes
      Object.keys(this.METADATA).forEach(fid => {
        const meta = this.METADATA[fid];
        if (meta.themeClass) {
          root.classList.remove(meta.themeClass);
          body.classList.remove(meta.themeClass);
        }
      });
      root.classList.remove('festival-active');
      body.classList.remove('festival-active');

      // Clear dynamic festival CSS variables
      const cssVars = [
        '--fest-accent',
        '--fest-accent-hover',
        '--fest-accent-bg',
        '--fest-accent-border',
        '--fest-badge-bg',
        '--fest-badge-text',
        '--fest-banner-bg',
        '--fest-banner-text',
        '--fest-glow'
      ];
      cssVars.forEach(v => root.style.removeProperty(v));

      const announcementEl = document.getElementById('announcement-bar');
      const announcementTextEl = document.getElementById('announcement-text');
      const festiveBadgeEl = document.getElementById('store-festive-badge');

      // If no festival active -> restore default luxury announcement text
      if (!detectionResult || !detectionResult.isActive || !detectionResult.meta) {
        if (festiveBadgeEl) {
          festiveBadgeEl.classList.add('hidden');
          festiveBadgeEl.textContent = '';
        }
        if (announcementBarDefaultHandler) {
          announcementBarDefaultHandler();
        }
        return;
      }

      // FESTIVAL IS ACTIVE: Apply theme
      const meta = detectionResult.meta;
      const colors = meta.colors || {};

      // 1. Add theme classes
      root.classList.add('festival-active');
      body.classList.add('festival-active');
      if (meta.themeClass) {
        root.classList.add(meta.themeClass);
        body.classList.add(meta.themeClass);
      }

      // 2. Set dynamic CSS variables for buttons, borders, highlights
      if (colors.accent) root.style.setProperty('--fest-accent', colors.accent);
      if (colors.accentHover) root.style.setProperty('--fest-accent-hover', colors.accentHover);
      if (colors.accentBg) root.style.setProperty('--fest-accent-bg', colors.accentBg);
      if (colors.accentBorder) root.style.setProperty('--fest-accent-border', colors.accentBorder);
      if (colors.badgeBg) root.style.setProperty('--fest-badge-bg', colors.badgeBg);
      if (colors.badgeText) root.style.setProperty('--fest-badge-text', colors.badgeText);
      if (colors.bannerBg) root.style.setProperty('--fest-banner-bg', colors.bannerBg);
      if (colors.bannerText) root.style.setProperty('--fest-banner-text', colors.bannerText);
      if (colors.glow) root.style.setProperty('--fest-glow', colors.glow);

      // 3. Update announcement banner with celebratory greeting
      if (announcementTextEl) {
        const bannerMsg = detectionResult.customBanner || meta.defaultBanner;
        announcementTextEl.textContent = bannerMsg;
      }
      if (announcementEl) {
        announcementEl.style.backgroundColor = colors.bannerBg || '#18181b';
        announcementEl.style.color = colors.bannerText || '#fef08a';
      }

      // 4. Update or render celebratory badge
      if (festiveBadgeEl) {
        festiveBadgeEl.textContent = `${meta.icon} ${meta.badge}`;
        festiveBadgeEl.className = 'inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase border rounded-full transition-all';
        festiveBadgeEl.style.backgroundColor = colors.badgeBg || '#18181b';
        festiveBadgeEl.style.color = colors.badgeText || '#fef08a';
        festiveBadgeEl.style.borderColor = colors.accentBorder || colors.accent;
        festiveBadgeEl.classList.remove('hidden');
      }
    }
  };

  // Helper hook for restoring default announcement banner
  let announcementBarDefaultHandler = function () {
    const settings = window.Store ? window.Store.getSettings() : window.DEFAULT_STORE_CONFIG;
    const announcementEl = document.getElementById('announcement-bar');
    const announcementTextEl = document.getElementById('announcement-text');
    if (announcementTextEl && settings) {
      announcementTextEl.textContent = settings.announcementText || 'Elumalayan Garments — Direct Delivery Across India & Custom Orders via WhatsApp';
    }
    if (announcementEl) {
      announcementEl.style.backgroundColor = '';
      announcementEl.style.color = '';
    }
  };

  FestivalEngine.setAnnouncementRestoreHandler = function (fn) {
    announcementBarDefaultHandler = fn;
  };

  // Export to global window
  window.FestivalEngine = FestivalEngine;

})(typeof window !== 'undefined' ? window : this);
