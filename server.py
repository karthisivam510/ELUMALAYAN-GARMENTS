#!/usr/bin/env python3
"""
ELUMALAYAN GARMENTS - Local Development & Production Server (v3.0)
==================================================================
A zero-dependency Python server with built-in SQLite persistence,
multi-WhatsApp support, REST API endpoints, and admin session security.

Usage:
    python server.py [port]
"""

import sys
import os
import json
import sqlite3
import hashlib
import secrets
import time
import datetime
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'store.db')

DEFAULT_ADMIN_USER = 'admin'
# SHA-256 of 'muse2026!'
DEFAULT_ADMIN_HASH = '28eeb3756a9cb9c99341aa4eec16602a5c35acf53a03fd26c2be3a6ebb140fc2'

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Products Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            compare_price REAL,
            image TEXT,
            secondary_image TEXT,
            description TEXT,
            details TEXT,
            sizes TEXT,
            colors TEXT,
            is_available INTEGER DEFAULT 1,
            badge TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            images TEXT DEFAULT '[]'
        )
    ''')

    # Safe migration: ensure existing products table has sort_order, updated_at, and images
    cursor.execute('PRAGMA table_info(products)')
    existing_p_cols = [c['name'] for c in cursor.fetchall()]
    if 'sort_order' not in existing_p_cols:
        cursor.execute('ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0')
    if 'updated_at' not in existing_p_cols:
        cursor.execute('ALTER TABLE products ADD COLUMN updated_at TEXT')
    if 'images' not in existing_p_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'")

    # Populate images for any existing products that lack it
    cursor.execute("SELECT id, image, secondary_image, images FROM products")
    for row in cursor.fetchall():
        current_images = row['images']
        if not current_images or current_images == '[]' or current_images == 'null':
            imgs = []
            if row['image']:
                imgs.append(row['image'])
            if row['secondary_image'] and row['secondary_image'] != row['image']:
                imgs.append(row['secondary_image'])
            cursor.execute("UPDATE products SET images = ? WHERE id = ?", (json.dumps(imgs), row['id']))

    # 2. Categories Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL,
            subtitle TEXT,
            image TEXT,
            enabled INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 1,
            created_at TEXT
        )
    ''')

    # 3. Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            mobile TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            email TEXT,
            address TEXT,
            items TEXT NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'New',
            created_at TEXT,
            updated_at TEXT
        )
    ''')

    # 4. Settings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')

    # 5. Admin Sessions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            expires_at REAL NOT NULL,
            created_at TEXT
        )
    ''')

    # 6. Auth Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS auth_users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'Administrator'
        )
    ''')

    # Seed Default Admin User if missing
    cursor.execute('SELECT username FROM auth_users WHERE username = ?', (DEFAULT_ADMIN_USER,))
    if not cursor.fetchone():
        cursor.execute('INSERT INTO auth_users (username, password_hash, role) VALUES (?, ?, ?)',
                       (DEFAULT_ADMIN_USER, DEFAULT_ADMIN_HASH, 'Administrator'))

    # Check initialization flag
    cursor.execute("SELECT value FROM settings WHERE key = 'db_initialized'")
    is_initialized = cursor.fetchone()

    if not is_initialized:
        # Default Store Settings for Elumalayan Garments
        default_settings = {
            'storeName': 'Elumalayan Garments',
            'tagline': 'Exquisite Indian Apparel, Modern Silhouettes & Traditional Elegance',
            'established': '2024',
            'currencySymbol': '₹',
            'currencyCode': 'INR',
            'taxIncluded': '1',
            'freeShippingThreshold': '1500',
            'whatsappNumber': '+91 99407 73278',
            'whatsappNumber2': '',
            'whatsappNumber3': '',
            'address': "Elumalayan Garments\n97/12 D, Alraj St,\nSwaminathapuram,\nSalem – 636009,\nTamil Nadu, India.",
            'openingHours': 'Mon – Sat: 09:30 – 21:00 | Sun: 10:00 – 20:00',
            'supportPhone': '+91 99407 73278',
            'supportEmail': 'contact@elumalayangarments.com',
            'instagramHandle': 'elumalayan.garments',
            'instagramUrl': 'https://instagram.com',
            'announcementText': 'Elumalayan Garments — Direct Delivery Across India & Custom Orders via WhatsApp',
            'showAnnouncement': '1',
            'db_initialized': '1'
        }
        for k, v in default_settings.items():
            cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (k, v))

        # Seed 4 Signature Tamil Ethnic Categories
        default_categories = [
            ("cat-traditional", "Traditional Pattu Pavadai", "traditional-pattu-pavadai",
             "Handwoven pure silk pattu pavadai with rich zari borders & traditional motifs",
             "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85", 1, 1),
            ("cat-festive", "Festive & Wedding Specials", "festive-wedding",
             "Royal bridal & grand festive lehengas crafted for memorable celebrations",
             "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85", 1, 2),
            ("cat-aari", "Aari Work & Designer Pavadai", "aari-work-designer",
             "Exquisite hand-embroidered aari, zardozi & stone embellishments",
             "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85", 1, 3),
            ("cat-daily", "Little Princess Daily Ethnic Wear", "daily-ethnic",
             "Comfortable, featherlight cotton-silk festive wear for young princesses",
             "https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85", 1, 4)
        ]
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        for cat in default_categories:
            cursor.execute('''
                INSERT OR IGNORE INTO categories (id, name, slug, subtitle, image, enabled, sort_order, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (*cat, now_iso))

        # Seed initial sample products
        sample_products = [
            ("prod-102", "Salem Pure Kanchipuram Silk Pattu Pavadai", "Traditional Pattu Pavadai", 1850.0, 2400.0,
             "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
             "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85",
             "Handcrafted pure Kanchipuram mulberry silk pattu pavadai with rich golden zari borders and contrast pleating.",
             "100% Pure Mulberry Silk; Real Zari Weave; Salem Direct Manufacturer; Dry clean only.",
             json.dumps(["2-3 Y", "4-5 Y", "6-8 Y", "9-11 Y"]), json.dumps([{"name": "Traditional Red", "hex": "#8B0000"}, {"name": "Mustard Gold", "hex": "#D4AF37"}]), 1, "Bestseller", 1, now_iso),
            ("prod-107", "Royal Magenta Handloom Pattu Pavadai", "Traditional Pattu Pavadai", 2150.0, None,
             "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85",
             "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
             "Traditional magenta and green silk pavadai with temple border detailing crafted for auspicious celebrations.",
             "Handloom Pure Silk; Rich Pallu / Daavani finish; Handcrafted in Salem.",
             json.dumps(["1-2 Y", "3-4 Y", "5-6 Y", "7-8 Y"]), json.dumps([{"name": "Magenta & Parrot Green", "hex": "#C71585"}]), 1, "New Arrival", 2, now_iso),
            ("prod-101", "Grand Temple Border Wedding Pavadai", "Festive & Wedding Specials", 2800.0, 3500.0,
             "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
             "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
             "Regal wedding festive pavadai set with broad temple borders and zari butta embroidery.",
             "Pure Raw Silk with Brocade; Double Zari Border; Matching Blouse Material included.",
             json.dumps(["2-4 Y", "5-7 Y", "8-10 Y", "11-13 Y"]), json.dumps([{"name": "Temple Gold & Maroon", "hex": "#800000"}]), 1, "Wedding Special", 1, now_iso),
            ("prod-105", "Peacock Blue Festive Brocade Pattu Set", "Festive & Wedding Specials", 2250.0, None,
             "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
             "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
             "Vibrant peacock blue brocade pavadai with antique zari border designed for festivals and family celebrations.",
             "Brocade Silk; Comfortable Inner Cotton Lining; Salem Craftsmanship.",
             json.dumps(["1-2 Y", "3-5 Y", "6-8 Y"]), json.dumps([{"name": "Peacock Blue", "hex": "#005f73"}]), 1, None, 2, now_iso),
            ("prod-103", "Intricate Hand-Stitched Aari Work Designer Pavadai", "Aari Work & Designer Pavadai", 3200.0, None,
             "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
             "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85",
             "Bespoke designer pattu pavadai adorned with intricate Maggam & Aari stone embroidery, pearls, and cut-work.",
             "Hand Embroidered Aari Work; Raw Silk Base; Soft Butter Crepe Lining; Custom Stitching Available.",
             json.dumps(["2-3 Y", "4-5 Y", "6-8 Y", "9-11 Y"]), json.dumps([{"name": "Royal Emerald & Rani Pink", "hex": "#097969"}]), 1, "Designer Exclusive", 1, now_iso),
            ("prod-104", "Little Princess Floral Cotton Silk Pavadai", "Little Princess Daily Ethnic Wear", 950.0, 1200.0,
             "https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85",
             "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85",
             "Soft, breathable featherlight cotton-silk ethnic wear designed with vibrant floral motifs for playful comfort.",
             "Cotton-Silk Blend; Hypoallergenic Soft Inner Lining; Easy Care Hand Wash.",
             json.dumps(["0-1 Y", "1-2 Y", "2-3 Y", "4-5 Y"]), json.dumps([{"name": "Pastel Pink & Yellow", "hex": "#FFB6C1"}]), 1, "Daily Essential", 1, now_iso)
        ]
        for p in sample_products:
            cursor.execute('''
                INSERT OR IGNORE INTO products
                (id, name, category, price, compare_price, image, secondary_image, description, details, sizes, colors, is_available, badge, sort_order, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', p)

        # Seed sample orders
        sample_orders = [
            ("ord-8042", "Kavitha Sundaram", "+91 98451 23456", "+91 98451 23456", "kavitha.s@example.in",
             "14/2 Cherry Road, Hasthampatti, Salem – 636007, Tamil Nadu",
             json.dumps([
                 {"name": "Double-Breasted Italian Wool Blazer", "size": "M", "color": "Onyx Black", "quantity": 1, "price": 380},
                 {"name": "Fine-Gauge Mongolian Cashmere Knit", "size": "S", "color": "Ivory", "quantity": 1, "price": 290}
             ]),
             670.0, "Confirmed", "2026-03-30T14:20:00Z"),
            ("ord-8040", "Anand Natarajan", "+91 99407 12345", "+91 99407 12345", "anand@chennaicorp.com",
             "42 Gandhi Road, Fairlands, Salem – 636016, Tamil Nadu",
             json.dumps([
                 {"name": "Cocoon Cashmere & Wool Overcoat", "size": "L", "color": "Camel", "quantity": 1, "price": 650}
             ]),
             650.0, "New", "2026-03-30T10:15:00Z"),
            ("ord-8038", "Priya Venkatesh", "+91 94432 56789", "+91 94432 56789", "priya.v@textile.in",
             "88 Junction Main Road, Salem – 636005, Tamil Nadu",
             json.dumps([
                 {"name": "Silk Charmeuse Bias Evening Dress", "size": "S", "color": "Champagne", "quantity": 1, "price": 420}
             ]),
             420.0, "Shipped", "2026-03-29T18:40:00Z")
        ]
        for o in sample_orders:
            cursor.execute('''
                INSERT OR IGNORE INTO orders
                (id, customer_name, mobile, whatsapp, email, address, items, total_price, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', o)

    # -------------------------------------------------------------
    # Traditional Tamil Ethnic Categories Migration & Sync
    # Migrates any legacy Western categories ("Outerwear & Coats", etc.)
    # to the 4 Signature Collections of Elumalayan Garments:
    # 1. Traditional Pattu Pavadai
    # 2. Festive & Wedding Specials
    # 3. Aari Work & Designer Pavadai
    # 4. Little Princess Daily Ethnic Wear
    # -------------------------------------------------------------
    cursor.execute("SELECT id, name FROM categories")
    existing_cats = {r['name']: r['id'] for r in cursor.fetchall()}
    
    legacy_keys = ["Outerwear & Coats", "Tailoring & Suits", "Dresses & Eveningwear", "Knitwear & Essentials"]
    has_legacy = any(k in existing_cats for k in legacy_keys)
    
    traditional_categories = [
        ("cat-traditional", "Traditional Pattu Pavadai", "traditional-pattu-pavadai",
         "Handwoven pure silk pattu pavadai with rich zari borders & traditional motifs",
         "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85", 1, 1),
        ("cat-festive", "Festive & Wedding Specials", "festive-wedding",
         "Royal bridal & grand festive lehengas crafted for memorable celebrations",
         "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85", 1, 2),
        ("cat-aari", "Aari Work & Designer Pavadai", "aari-work-designer",
         "Exquisite hand-embroidered aari, zardozi & stone embellishments",
         "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85", 1, 3),
        ("cat-daily", "Little Princess Daily Ethnic Wear", "daily-ethnic",
         "Comfortable, featherlight cotton-silk festive wear for young princesses",
         "https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85", 1, 4)
    ]

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    if has_legacy or len(existing_cats) == 0:
        for lk in legacy_keys:
            cursor.execute("DELETE FROM categories WHERE name = ?", (lk,))
        
        for cat in traditional_categories:
            cursor.execute('''
                INSERT OR REPLACE INTO categories (id, name, slug, subtitle, image, enabled, sort_order, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (*cat, now_iso))
        
        cursor.execute("UPDATE products SET category = 'Traditional Pattu Pavadai' WHERE category = 'Outerwear & Coats'")
        cursor.execute("UPDATE products SET category = 'Festive & Wedding Specials' WHERE category = 'Tailoring & Suits'")
        cursor.execute("UPDATE products SET category = 'Aari Work & Designer Pavadai' WHERE category = 'Dresses & Eveningwear'")
        cursor.execute("UPDATE products SET category = 'Little Princess Daily Ethnic Wear' WHERE category = 'Knitwear & Essentials'")
        
        cursor.execute("""
            UPDATE products SET 
                name = 'Salem Pure Kanchipuram Silk Pattu Pavadai',
                description = 'Handcrafted pure Kanchipuram mulberry silk pattu pavadai with rich golden zari borders and contrast pleating.',
                details = '100% Pure Mulberry Silk; Real Zari Weave; Salem Direct Manufacturer; Dry clean only.',
                image = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85'
            WHERE id = 'prod-102'
        """)
        cursor.execute("""
            UPDATE products SET 
                name = 'Royal Magenta Handloom Pattu Pavadai',
                description = 'Traditional magenta and green silk pavadai with temple border detailing crafted for auspicious celebrations.',
                details = 'Handloom Pure Silk; Rich Pallu / Daavani finish; Handcrafted in Salem.',
                image = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85'
            WHERE id = 'prod-107'
        """)
        cursor.execute("""
            UPDATE products SET 
                name = 'Grand Temple Border Wedding Pavadai',
                description = 'Regal wedding festive pavadai set with broad temple borders and zari butta embroidery.',
                details = 'Pure Raw Silk with Brocade; Double Zari Border; Matching Blouse Material included.',
                image = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85'
            WHERE id = 'prod-101'
        """)
        cursor.execute("""
            UPDATE products SET 
                name = 'Peacock Blue Festive Brocade Pattu Set',
                description = 'Vibrant peacock blue brocade pavadai with antique zari border designed for festivals and family celebrations.',
                details = 'Brocade Silk; Comfortable Inner Cotton Lining; Salem Craftsmanship.',
                image = 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85'
            WHERE id = 'prod-105'
        """)
        cursor.execute("""
            UPDATE products SET 
                name = 'Intricate Hand-Stitched Aari Work Designer Pavadai',
                description = 'Bespoke designer pattu pavadai adorned with intricate Maggam & Aari stone embroidery, pearls, and cut-work.',
                details = 'Hand Embroidered Aari Work; Raw Silk Base; Soft Butter Crepe Lining; Custom Stitching Available.',
                image = 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85'
            WHERE id = 'prod-103'
        """)
        cursor.execute("""
            UPDATE products SET 
                name = 'Little Princess Floral Cotton Silk Pavadai',
                description = 'Soft, breathable featherlight cotton-silk ethnic wear designed with vibrant floral motifs for playful comfort.',
                details = 'Cotton-Silk Blend; Hypoallergenic Soft Inner Lining; Easy Care Hand Wash.',
                image = 'https://images.unsplash.com/photo-1607823477965-095b5e32d677?auto=format&fit=crop&w=1000&q=85'
            WHERE id = 'prod-104'
        """)
        conn.commit()

    # Ensure festival theme configuration exists in settings table
    festival_defaults = {
        'festivalAutoMode': '1',
        'festivalActiveOverride': '',
        'festivalOverrideUntil': '',
        'festivalCustomBanner': '',
        'festivalCustomDates': '{}'
    }
    for k, v in festival_defaults.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()
    conn.close()

class AtelierRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable aggressive caching for real-time development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0:
                return {}
            print(f"[Server Debug] Received POST payload: {content_length} bytes")
            # Safely read the full payload in chunks to prevent premature truncation or socket timeouts
            chunks = []
            bytes_read = 0
            while bytes_read < content_length:
                to_read = min(content_length - bytes_read, 65536)
                chunk = self.rfile.read(to_read)
                if not chunk:
                    break
                chunks.append(chunk)
                bytes_read += len(chunk)
            raw_data = b"".join(chunks).decode('utf-8', errors='replace')
            try:
                return json.loads(raw_data)
            except json.JSONDecodeError as err:
                print(f"[Server Debug] JSONDecodeError: {err} (received {len(raw_data)} bytes)")
                return {}
        except Exception as e:
            print(f"[Server Debug] Exception reading request body: {e}")
            return {}

    def get_auth_token(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:].strip()
        x_token = self.headers.get('X-Admin-Token', '')
        if x_token:
            return x_token.strip()
        return None

    def is_authenticated(self):
        token = self.get_auth_token()
        if not token:
            return False
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT username, expires_at FROM admin_sessions WHERE token = ?', (token,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return False
        if row['expires_at'] < time.time():
            # Session expired
            return False
        return True

    # -------------------------------------------------------------
    # GET REQUEST ROUTER
    # -------------------------------------------------------------
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. Health Check
        if path == '/api/health':
            return self.send_json({
                'status': 'online',
                'store': 'Elumalayan Garments',
                'version': '3.0',
                'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
            })

        # 2. Get Public Settings
        if path == '/api/settings':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT key, value FROM settings')
            rows = cursor.fetchall()
            conn.close()
            settings = {r['key']: r['value'] for r in rows}
            return self.send_json(settings)

        # 3. Get Products (Public)
        if path == '/api/products':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM products ORDER BY sort_order ASC, created_at DESC')
            rows = cursor.fetchall()
            conn.close()
            products = []
            for r in rows:
                p = dict(r)
                p['sizes'] = json.loads(p['sizes']) if p['sizes'] else []
                p['colors'] = json.loads(p['colors']) if p['colors'] else []
                p['isAvailable'] = bool(p['is_available'])
                p['comparePrice'] = p['compare_price']
                del p['is_available']
                del p['compare_price']

                # Images array parsing & legacy fallback
                imgs = []
                if p.get('images'):
                    try:
                        imgs = json.loads(p['images']) if isinstance(p['images'], str) else p['images']
                    except Exception:
                        imgs = []
                if not imgs:
                    if p.get('image'):
                        imgs.append(p['image'])
                    if p.get('secondary_image') and p['secondary_image'] != p.get('image'):
                        imgs.append(p['secondary_image'])
                p['images'] = imgs
                p['image'] = imgs[0] if imgs else (p.get('image') or '')
                p['secondaryImage'] = imgs[1] if len(imgs) > 1 else (p.get('secondary_image') or '')
                if 'secondary_image' in p:
                    del p['secondary_image']
                products.append(p)
            return self.send_json(products)

        # 4. Get Categories (Public)
        if path == '/api/categories':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM categories ORDER BY sort_order ASC')
            rows = cursor.fetchall()
            conn.close()
            categories = []
            for r in rows:
                c = dict(r)
                c['enabled'] = bool(c['enabled'])
                categories.append(c)
            return self.send_json(categories)

        # 5. Get Orders (ADMIN ONLY - Sensitive customer data protection)
        if path == '/api/orders':
            if not self.is_authenticated():
                return self.send_json({
                    'success': False,
                    'error': 'Unauthorized: Administrator authentication required to view customer orders.'
                }, status=401)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM orders ORDER BY created_at DESC')
            rows = cursor.fetchall()
            conn.close()
            orders = []
            for r in rows:
                o = dict(r)
                o['customerName'] = o['customer_name']
                o['totalPrice'] = o['total_price']
                o['createdAt'] = o['created_at']
                o['updatedAt'] = o.get('updated_at')
                try:
                    o['items'] = json.loads(o['items']) if o['items'] else []
                except Exception:
                    o['items'] = []
                del o['customer_name']
                del o['total_price']
                del o['created_at']
                orders.append(o)
            return self.send_json(orders)

        # 6. Database Full Backup (ADMIN ONLY)
        if path == '/api/backup':
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized'}, status=401)
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM products')
            prods = [dict(r) for r in c.fetchall()]
            c.execute('SELECT * FROM categories')
            cats = [dict(r) for r in c.fetchall()]
            c.execute('SELECT * FROM orders')
            ords = [dict(r) for r in c.fetchall()]
            c.execute('SELECT * FROM settings')
            sets = {r['key']: r['value'] for r in c.fetchall()}
            conn.close()
            return self.send_json({
                'exportedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'products': prods,
                'categories': cats,
                'orders': ords,
                'settings': sets
            })

        # Static assets (HTML, CSS, JS, etc.)
        return super().do_GET()

    # -------------------------------------------------------------
    # POST REQUEST ROUTER
    # -------------------------------------------------------------
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        # 1. Admin Authentication Login
        if path == '/api/auth/login':
            username = (body.get('username') or '').strip().lower()
            password = body.get('password') or ''
            remember = bool(body.get('remember', False))

            pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT username, password_hash, role FROM auth_users WHERE LOWER(username) = ?', (username,))
            user = cursor.fetchone()

            if not user or user['password_hash'] != pwd_hash:
                conn.close()
                return self.send_json({'success': False, 'message': 'Invalid username or password.'}, status=401)

            # Generate cryptographically secure session token
            token = 'eluma_sec_' + secrets.token_hex(20)
            ttl = (30 * 86400) if remember else (12 * 3600)
            expires_at = time.time() + ttl
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

            cursor.execute('INSERT INTO admin_sessions (token, username, expires_at, created_at) VALUES (?, ?, ?, ?)',
                           (token, user['username'], expires_at, now_iso))
            conn.commit()
            conn.close()

            return self.send_json({
                'success': True,
                'token': token,
                'user': {
                    'username': user['username'],
                    'role': user['role'],
                    'expiresAt': int(expires_at * 1000)
                }
            })

        # 2. Verify Session
        if path == '/api/auth/verify':
            is_valid = self.is_authenticated()
            return self.send_json({'success': True, 'valid': is_valid}, status=200 if is_valid else 401)

        # 3. Logout
        if path == '/api/auth/logout':
            token = self.get_auth_token()
            if token:
                conn = get_db()
                c = conn.cursor()
                c.execute('DELETE FROM admin_sessions WHERE token = ?', (token,))
                conn.commit()
                conn.close()
            return self.send_json({'success': True, 'message': 'Logged out successfully.'})

        # 4. Change Admin Password
        if path == '/api/auth/change-password':
            if not self.is_authenticated():
                return self.send_json({'success': False, 'message': 'Unauthorized'}, status=401)
            old_pass = body.get('oldPassword') or ''
            new_pass = body.get('newPassword') or ''
            if len(new_pass) < 6:
                return self.send_json({'success': False, 'message': 'Password must be at least 6 characters.'}, status=400)
            old_hash = hashlib.sha256(old_pass.encode('utf-8')).hexdigest()
            new_hash = hashlib.sha256(new_pass.encode('utf-8')).hexdigest()
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT username FROM auth_users WHERE password_hash = ?', (old_hash,))
            if not c.fetchone():
                conn.close()
                return self.send_json({'success': False, 'message': 'Current password is incorrect.'}, status=400)
            c.execute('UPDATE auth_users SET password_hash = ?', (new_hash,))
            conn.commit()
            conn.close()
            return self.send_json({'success': True, 'message': 'Password successfully changed.'})

        # 5. Place Customer Order (PUBLIC - Saves order once into database)
        if path == '/api/orders':
            customer_name = (body.get('customerName') or body.get('customer_name') or '').strip()
            mobile = (body.get('mobile') or '').strip()
            whatsapp = (body.get('whatsapp') or mobile).strip()
            email = (body.get('email') or '').strip()
            address = (body.get('address') or '').strip()
            items = body.get('items') or []
            total_price = float(body.get('totalPrice') or body.get('total_price') or 0.0)

            if not customer_name:
                customer_name = 'Direct WhatsApp Guest'
            if not mobile and not whatsapp:
                mobile = 'Via WhatsApp Chat'
                whatsapp = 'Via WhatsApp Chat'

            order_id = body.get('id')
            if not order_id or not str(order_id).startswith('ord-'):
                order_id = f"ord-{int(time.time() * 1000) % 1000000}"

            created_at = body.get('createdAt') or datetime.datetime.now(datetime.timezone.utc).isoformat()
            items_str = json.dumps(items)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO orders 
                (id, customer_name, mobile, whatsapp, email, address, items, total_price, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (order_id, customer_name, mobile, whatsapp, email, address, items_str, total_price, 'New', created_at, created_at))
            conn.commit()
            conn.close()

            order_obj = {
                'id': order_id,
                'customerName': customer_name,
                'mobile': mobile,
                'whatsapp': whatsapp,
                'email': email,
                'address': address,
                'items': items,
                'totalPrice': total_price,
                'status': 'New',
                'createdAt': created_at
            }
            return self.send_json({
                'success': True,
                'order': order_obj,
                **order_obj
            }, status=201)

        # 6. Update Store Settings (ADMIN ONLY with validation)
        if path == '/api/settings':
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized: Admin authentication required.'}, status=401)
            
            ALLOWED_SETTINGS_KEYS = {
                'storeName', 'brandName', 'subtitle', 'tagline', 'subBadge', 'established',
                'currencySymbol', 'currencyCode', 'taxIncluded', 'freeShippingThreshold',
                'whatsappNumber', 'whatsappNumber2', 'whatsappNumber3', 'whatsappDefaultMessage',
                'instagramHandle', 'instagramUrl', 'supportEmail', 'supportPhone', 'address', 'openingHours',
                'announcementText', 'showAnnouncement',
                'festivalAutoMode', 'festivalActiveOverride', 'festivalOverrideUntil',
                'festivalCustomBanner', 'festivalCustomDates',
                'brandLogo', 'favicon', 'categoryBanners', 'site_settings'
            }

            conn = get_db()
            cursor = conn.cursor()
            for k, v in body.items():
                k_str = str(k).strip()
                if k_str in ALLOWED_SETTINGS_KEYS:
                    v_str = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
                    if len(v_str) > 2500000:
                        v_str = v_str[:2500000]
                    cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (k_str, v_str))
            conn.commit()
            cursor.execute('SELECT key, value FROM settings')
            updated = {r['key']: r['value'] for r in cursor.fetchall()}
            conn.close()
            return self.send_json({
                'success': True,
                'settings': updated,
                **updated
            })

        # 7. Add Product (ADMIN ONLY)
        if path == '/api/products':
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized'}, status=401)
            name = (body.get('name') or 'Untitled Garment').strip()
            category = body.get('category') or 'Traditional Pattu Pavadai'
            price = float(body.get('price') or 0.0)
            compare_price = float(body['comparePrice']) if body.get('comparePrice') else None

            # Multi-image handling (up to 10 images)
            images_input = body.get('images')
            if isinstance(images_input, str):
                try:
                    images_list = json.loads(images_input)
                except Exception:
                    images_list = [images_input] if images_input else []
            elif isinstance(images_input, list):
                images_list = images_input
            else:
                images_list = []

            if not images_list and body.get('image'):
                images_list.append(body.get('image'))
            if len(images_list) == 1 and body.get('secondaryImage') and body.get('secondaryImage') != body.get('image'):
                images_list.append(body.get('secondaryImage'))

            # Limit to maximum 10 images safely
            images_list = [img for img in images_list if img][:10]

            image = images_list[0] if images_list else (body.get('image') or '')
            secondary_image = images_list[1] if len(images_list) > 1 else (body.get('secondaryImage') or image)
            images_json = json.dumps(images_list)

            desc = body.get('description') or ''
            details = body.get('details') or ''
            sizes = json.dumps(body.get('sizes') or ['M'])
            colors = json.dumps(body.get('colors') or [{"name": "Default", "hex": "#111111"}])
            is_avail = 1 if body.get('isAvailable', True) else 0
            badge = body.get('badge')
            prod_id = body.get('id') or f"prod-{int(time.time()*1000)%1000000}"
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO products 
                (id, name, category, price, compare_price, image, secondary_image, description, details, sizes, colors, is_available, badge, sort_order, created_at, updated_at, images)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (prod_id, name, category, price, compare_price, image, secondary_image, desc, details, sizes, colors, is_avail, badge, int(time.time()), now_iso, now_iso, images_json))
            conn.commit()
            conn.close()
            return self.send_json({
                'status': 'success',
                'message': 'Product saved',
                'id': prod_id,
                'success': True
            }, status=200)

        # 8. Restore Database from Backup (ADMIN ONLY)
        if path == '/api/restore':
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized'}, status=401)
            prods = body.get('products') or []
            ords = body.get('orders') or []
            sets = body.get('settings') or {}
            conn = get_db()
            c = conn.cursor()
            if sets:
                for k, v in sets.items():
                    c.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (str(k), str(v)))
            if prods:
                c.execute('DELETE FROM products')
                for p in prods:
                    imgs_str = json.dumps(p.get('images')) if isinstance(p.get('images'), list) else (p.get('images') or '[]')
                    c.execute('''
                        INSERT OR REPLACE INTO products
                        (id, name, category, price, compare_price, image, secondary_image, description, details, sizes, colors, is_available, badge, sort_order, created_at, images)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (p['id'], p['name'], p['category'], p['price'], p.get('compare_price'), p.get('image'), p.get('secondary_image'), p.get('description'), p.get('details'), p.get('sizes'), p.get('colors'), p.get('is_available', 1), p.get('badge'), p.get('sort_order', 0), p.get('created_at'), imgs_str))
            if ords:
                c.execute('DELETE FROM orders')
                for o in ords:
                    c.execute('''
                        INSERT OR REPLACE INTO orders
                        (id, customer_name, mobile, whatsapp, email, address, items, total_price, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (o['id'], o['customer_name'], o['mobile'], o['whatsapp'], o.get('email'), o.get('address'), o['items'], o['total_price'], o.get('status', 'New'), o.get('created_at')))
            conn.commit()
            conn.close()
            return self.send_json({'success': True, 'message': 'Database restored successfully.'})

        return self.send_json({'error': 'Not Found'}, status=404)

    # -------------------------------------------------------------
    # PUT REQUEST ROUTER
    # -------------------------------------------------------------
    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        # 1. Update Order Status (ADMIN ONLY)
        if path.startswith('/api/orders/') and path.endswith('/status'):
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized'}, status=401)
            parts = path.split('/')
            order_id = parts[3]
            new_status = (body.get('status') or 'New').strip()

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM orders WHERE id = ?', (order_id,))
            if not cursor.fetchone():
                conn.close()
                return self.send_json({'success': False, 'error': f'Order #{order_id} not found.'}, status=404)

            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', (new_status, now_iso, order_id))
            conn.commit()
            conn.close()
            return self.send_json({'success': True, 'id': order_id, 'status': new_status})

        # 2. Update Product (ADMIN ONLY)
        if path.startswith('/api/products/'):
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized'}, status=401)
            prod_id = path[len('/api/products/'):]
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM products WHERE id = ?', (prod_id,))
            existing = cursor.fetchone()
            if not existing:
                conn.close()
                return self.send_json({'success': False, 'error': 'Product not found'}, status=404)

            name = body.get('name', existing['name'])
            category = body.get('category', existing['category'])
            price = float(body.get('price', existing['price']))
            compare_price = float(body['comparePrice']) if 'comparePrice' in body and body['comparePrice'] else existing['compare_price']

            # Multi-image handling (up to 10 images)
            if 'images' in body:
                images_input = body['images']
                if isinstance(images_input, str):
                    try:
                        images_list = json.loads(images_input)
                    except Exception:
                        images_list = [images_input] if images_input else []
                elif isinstance(images_input, list):
                    images_list = images_input
                else:
                    images_list = []
                images_list = [img for img in images_list if img][:10]
                image = images_list[0] if images_list else (body.get('image', existing['image']))
                secondary_image = images_list[1] if len(images_list) > 1 else (body.get('secondaryImage', existing['secondary_image']) or image)
                images_json = json.dumps(images_list)
            else:
                image = body.get('image', existing['image'])
                secondary_image = body.get('secondaryImage', existing['secondary_image'])
                try:
                    images_list = json.loads(existing['images']) if existing['images'] else []
                except Exception:
                    images_list = []
                if not images_list:
                    if image: images_list.append(image)
                    if secondary_image and secondary_image != image: images_list.append(secondary_image)
                elif image and (not images_list or images_list[0] != image):
                    images_list = [image] + [img for img in images_list if img != image]
                images_list = [img for img in images_list if img][:10]
                images_json = json.dumps(images_list)

            desc = body.get('description', existing['description'])
            details = body.get('details', existing['details'])
            sizes = json.dumps(body.get('sizes')) if 'sizes' in body else existing['sizes']
            colors = json.dumps(body.get('colors')) if 'colors' in body else existing['colors']
            is_avail = (1 if body['isAvailable'] else 0) if 'isAvailable' in body else existing['is_available']
            badge = body.get('badge', existing['badge'])
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

            cursor.execute('''
                UPDATE products SET
                name=?, category=?, price=?, compare_price=?, image=?, secondary_image=?,
                description=?, details=?, sizes=?, colors=?, is_available=?, badge=?, updated_at=?, images=?
                WHERE id=?
            ''', (name, category, price, compare_price, image, secondary_image, desc, details, sizes, colors, is_avail, badge, now_iso, images_json, prod_id))
            conn.commit()
            conn.close()
            return self.send_json({
                'status': 'success',
                'message': 'Product updated',
                'id': prod_id,
                'success': True
            }, status=200)

        # 3. Update Category (ADMIN ONLY)
        if path.startswith('/api/categories/'):
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized'}, status=401)
            cat_id = path[len('/api/categories/'):]
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM categories WHERE id = ?', (cat_id,))
            existing = cursor.fetchone()
            if not existing:
                conn.close()
                return self.send_json({'success': False, 'error': 'Category not found'}, status=404)

            name = body.get('name', existing['name'])
            subtitle = body.get('subtitle', existing['subtitle'])
            image = body.get('image', existing['image'])
            enabled = (1 if body['enabled'] else 0) if 'enabled' in body else existing['enabled']
            sort_order = int(body.get('sort_order', existing['sort_order']))

            cursor.execute('''
                UPDATE categories SET name=?, subtitle=?, image=?, enabled=?, sort_order=? WHERE id=?
            ''', (name, subtitle, image, enabled, sort_order, cat_id))
            conn.commit()
            conn.close()
            return self.send_json({'success': True, 'id': cat_id})

        return self.send_json({'error': 'Not Found'}, status=404)

    # -------------------------------------------------------------
    # DELETE REQUEST ROUTER (ORDER & PRODUCT DELETION)
    # -------------------------------------------------------------
    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. DELETE CUSTOMER ORDER (ADMIN ONLY)
        # Fixes the core order deletion bug by providing authoritative,
        # authenticated SQLite database removal with clear success/error verification.
        if path.startswith('/api/orders/'):
            if not self.is_authenticated():
                return self.send_json({
                    'success': False,
                    'error': 'Unauthorized: Administrator authentication required to delete orders.'
                }, status=401)

            order_id = path[len('/api/orders/'):].strip()
            if not order_id:
                return self.send_json({'success': False, 'error': 'Invalid or missing Order ID.'}, status=400)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT id, customer_name FROM orders WHERE id = ?', (order_id,))
            order_row = cursor.fetchone()

            if not order_row:
                conn.close()
                return self.send_json({
                    'success': False,
                    'error': f'Order #{order_id} does not exist or has already been deleted.'
                }, status=404)

            # Permanently delete the order record from SQLite
            cursor.execute('DELETE FROM orders WHERE id = ?', (order_id,))
            conn.commit()
            conn.close()

            return self.send_json({
                'success': True,
                'message': f'Order #{order_id} for {order_row["customer_name"]} permanently deleted.',
                'deletedId': order_id
            }, status=200)

        # 2. DELETE PRODUCT (ADMIN ONLY)
        if path.startswith('/api/products/'):
            if not self.is_authenticated():
                return self.send_json({'success': False, 'error': 'Unauthorized'}, status=401)
            prod_id = path[len('/api/products/'):].strip()
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM products WHERE id = ?', (prod_id,))
            conn.commit()
            conn.close()
            return self.send_json({'success': True, 'deletedId': prod_id})

        return self.send_json({'error': 'Not Found'}, status=404)

def run_server():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    init_db()
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, AtelierRequestHandler)

    url = f"http://localhost:{PORT}"
    print("=" * 70)
    print("  * ELUMALAYAN GARMENTS -- LUXURY APPAREL & COMMERCE ENGINE *")
    print("=" * 70)
    print(f"  * Public Storefront:     {url}")
    print(f"  * Private Admin Panel:   {url}/admin.html")
    print(f"  * Default Credentials:   admin / muse2026!")
    print(f"  * Store Address:         Salem – 636009, Tamil Nadu, India")
    print(f"  * WhatsApp Orders:       +91 99407 73278 (Multi-WhatsApp Active)")
    print(f"  * SQLite Database:       {DB_FILE}")
    print("=" * 70)
    print("  Server is active. Press CTRL+C to terminate.")
    print("=" * 70)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server gracefully...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()

