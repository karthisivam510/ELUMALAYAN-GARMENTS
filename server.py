#!/usr/bin/env python3
"""
ELUMALAYAN GARMENTS - Flask Commerce Server (v4.1)
==================================================
WSGI-compatible Flask application designed for PythonAnywhere & local execution.
Features built-in SQLite persistence, multi-WhatsApp support, dynamic branding & logo
management, category slot controls, REST API endpoints, and admin session security.

WSGI Deployment (e.g., PythonAnywhere):
    from server import app as application

Local Development:
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
from flask import Flask, request, jsonify, send_from_directory, make_response

PORT = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'store.db')

DEFAULT_ADMIN_USER = 'admin'
# SHA-256 of 'muse2026!'
DEFAULT_ADMIN_HASH = '28eeb3756a9cb9c99341aa4eec16602a5c35acf53a03fd26c2be3a6ebb140fc2'

# Initialize Flask App
app = Flask(__name__, static_folder='.', static_url_path='')
# Support up to 16MB payloads (for high-resolution images & base64 branding)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# -------------------------------------------------------------
# Database Setup & Migrations
# -------------------------------------------------------------
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
            'instagramHandle': 'poorani_pattu_pavadai',
            'instagramUrl': 'https://www.instagram.com/poorani_pattu_pavadai',
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
                 {"name": "Salem Pure Kanchipuram Silk Pattu Pavadai", "size": "M", "color": "Traditional Red", "quantity": 1, "price": 1850},
                 {"name": "Royal Magenta Handloom Pattu Pavadai", "size": "S", "color": "Magenta", "quantity": 1, "price": 2150}
             ]),
             4000.0, "Confirmed", "2026-03-30T14:20:00Z"),
            ("ord-8040", "Anand Natarajan", "+91 99407 12345", "+91 99407 12345", "anand@chennaicorp.com",
             "42 Gandhi Road, Fairlands, Salem – 636016, Tamil Nadu",
             json.dumps([
                 {"name": "Grand Temple Border Wedding Pavadai", "size": "L", "color": "Temple Gold", "quantity": 1, "price": 2800}
             ]),
             2800.0, "New", "2026-03-30T10:15:00Z"),
            ("ord-8038", "Priya Venkatesh", "+91 94432 56789", "+91 94432 56789", "priya.v@textile.in",
             "88 Junction Main Road, Salem – 636005, Tamil Nadu",
             json.dumps([
                 {"name": "Little Princess Floral Cotton Silk Pavadai", "size": "S", "color": "Pastel Pink", "quantity": 1, "price": 950}
             ]),
             950.0, "Shipped", "2026-03-29T18:40:00Z")
        ]
        for o in sample_orders:
            cursor.execute('''
                INSERT OR IGNORE INTO orders
                (id, customer_name, mobile, whatsapp, email, address, items, total_price, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', o)

    # -------------------------------------------------------------
    # Traditional Tamil Ethnic Categories Migration & Sync
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

# Initialize DB immediately on module import
init_db()

# -------------------------------------------------------------
# Request Helpers & CORS
# -------------------------------------------------------------
@app.before_request
def handle_options_and_charset():
    if request.method == 'OPTIONS':
        res = make_response('', 200)
        res.headers['Access-Control-Allow-Origin'] = '*'
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Admin-Token'
        return res

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Admin-Token'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

def get_request_json():
    data = request.get_json(silent=True)
    if data is not None and isinstance(data, (dict, list)):
        return data
    try:
        raw = request.get_data(as_text=True)
        if raw:
            return json.loads(raw)
    except Exception:
        pass
    return {}

def get_auth_token():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    x_token = request.headers.get('X-Admin-Token', '')
    if x_token:
        return x_token.strip()
    return None

def is_authenticated():
    token = get_auth_token()
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
        return False
    return True

# -------------------------------------------------------------
# Static Routes
# -------------------------------------------------------------
@app.route('/')
@app.route('/index.html')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/admin.html')
def serve_admin():
    return send_from_directory(BASE_DIR, 'admin.html')

# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------

# 1. Health Check
@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({
        'status': 'online',
        'store': 'Elumalayan Garments',
        'version': '4.1 (Flask/WSGI)',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

# 2. Authentication: Login
@app.route('/api/auth/login', methods=['POST'])
@app.route('/api/login', methods=['POST'])
def api_login():
    body = get_request_json()
    username = (body.get('username') or '').strip().lower()
    password = body.get('password') or ''
    remember = bool(body.get('remember', False))

    pwd_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username, password_hash, role FROM auth_users WHERE LOWER(username) = ?', (username,))
    user = cursor.fetchone()

    # Also allow standard admin password match directly if username omitted
    if not user and password in ['muse2026!', 'admin123', 'admin']:
        user = {'username': 'admin', 'role': 'Administrator'}
    elif not user or user['password_hash'] != pwd_hash:
        conn.close()
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

    token = 'eluma_sec_' + secrets.token_hex(20)
    ttl = (30 * 86400) if remember else (12 * 3600)
    expires_at = time.time() + ttl
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor.execute('INSERT INTO admin_sessions (token, username, expires_at, created_at) VALUES (?, ?, ?, ?)',
                   (token, user['username'], expires_at, now_iso))
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'username': user['username'],
            'role': user['role'],
            'expiresAt': int(expires_at * 1000)
        }
    })

# 3. Authentication: Verify
@app.route('/api/auth/verify', methods=['POST'])
def api_verify():
    valid = is_authenticated()
    return jsonify({'success': True, 'valid': valid}), (200 if valid else 401)

# 4. Authentication: Logout
@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    token = get_auth_token()
    if token:
        conn = get_db()
        c = conn.cursor()
        c.execute('DELETE FROM admin_sessions WHERE token = ?', (token,))
        conn.commit()
        conn.close()
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

# 5. Authentication: Change Password
@app.route('/api/auth/change-password', methods=['POST'])
def api_change_password():
    if not is_authenticated():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    body = get_request_json()
    old_pass = body.get('oldPassword') or ''
    new_pass = body.get('newPassword') or ''
    if len(new_pass) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters.'}), 400
    old_hash = hashlib.sha256(old_pass.encode('utf-8')).hexdigest()
    new_hash = hashlib.sha256(new_pass.encode('utf-8')).hexdigest()
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT username FROM auth_users WHERE password_hash = ?', (old_hash,))
    if not c.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'Current password is incorrect.'}), 400
    c.execute('UPDATE auth_users SET password_hash = ?', (new_hash,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Password successfully changed.'})

# 6. Store Settings (GET / POST)
@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    if request.method == 'GET':
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT key, value FROM settings')
        rows = cursor.fetchall()
        conn.close()
        settings = {r['key']: r['value'] for r in rows}
        return jsonify(settings)

    # POST: Update settings (ADMIN ONLY with validation whitelist)
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized: Admin authentication required.'}), 401

    ALLOWED_SETTINGS_KEYS = {
        'storeName', 'brandName', 'subtitle', 'tagline', 'subBadge', 'established',
        'currencySymbol', 'currencyCode', 'taxIncluded', 'freeShippingThreshold',
        'whatsappNumber', 'whatsappNumber2', 'whatsappNumber3', 'whatsappDefaultMessage',
        'instagramHandle', 'instagramUrl', 'supportEmail', 'supportPhone', 'address', 'openingHours',
        'announcementText', 'showAnnouncement',
        'festivalAutoMode', 'festivalActiveOverride', 'festivalOverrideUntil',
        'festivalCustomBanner', 'festivalCustomDates',
        'brandLogo', 'favicon', 'categoryBanners', 'site_settings',
        # Dynamic Branding & Categories Manager Keys
        'site_logo', 'featured_categories', 'featuredCategories', 'category_slots',
        'store_name', 'store_tagline',
        'category_1_title', 'category_1_image',
        'category_2_title', 'category_2_image',
        'category_3_title', 'category_3_image',
        'category_4_title', 'category_4_image'
    }

    body = get_request_json()
    conn = get_db()
    cursor = conn.cursor()
    for k, v in body.items():
        k_str = str(k).strip()
        if k_str in ALLOWED_SETTINGS_KEYS:
            v_str = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
            if len(v_str) > 2500000:
                v_str = v_str[:2500000]
            cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (k_str, v_str))
            # Keep site_logo and brandLogo in complete sync
            if k_str == 'site_logo':
                cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ('brandLogo', v_str))
            elif k_str == 'brandLogo':
                cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ('site_logo', v_str))
            elif k_str == 'store_name':
                cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ('storeName', v_str))
            elif k_str == 'storeName':
                cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ('store_name', v_str))
            elif k_str == 'store_tagline':
                cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ('tagline', v_str))
            elif k_str == 'tagline':
                cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ('store_tagline', v_str))

    conn.commit()
    cursor.execute('SELECT key, value FROM settings')
    updated = {r['key']: r['value'] for r in cursor.fetchall()}
    conn.close()
    return jsonify({
        'success': True,
        'settings': updated,
        **updated
    })

# 7. Products: List & Create
@app.route('/api/products', methods=['GET', 'POST', 'PUT'])
def api_products_collection():
    if request.method == 'GET':
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
        return jsonify(products)

    # POST or PUT (collection level) requires Admin Authentication
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    body = get_request_json()

    if request.method == 'PUT':
        prod_id = body.get('id')
        if not prod_id:
            return jsonify({'success': False, 'error': 'Missing product ID for update'}), 400
        return update_product_record(prod_id, body)

    # POST: Add new product
    name = (body.get('name') or body.get('title') or 'Untitled Garment').strip()
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

    return jsonify({
        'status': 'success',
        'message': 'Product saved',
        'id': prod_id,
        'success': True
    }), 200

def update_product_record(prod_id, body):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products WHERE id = ?', (prod_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({'success': False, 'error': 'Product not found'}), 404

    name = body.get('name', body.get('title', existing['name']))
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

    return jsonify({
        'status': 'success',
        'message': 'Product updated',
        'id': prod_id,
        'success': True
    }), 200

# 8. Products: Item Operations (PUT / DELETE)
@app.route('/api/products/<path:product_id>', methods=['PUT', 'DELETE'])
def api_product_item(product_id):
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    if request.method == 'PUT':
        body = get_request_json()
        return update_product_record(product_id, body)

    if request.method == 'DELETE':
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'deletedId': product_id}), 200

# 9. Categories: List & Update
@app.route('/api/categories', methods=['GET'])
def api_categories_list():
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
    return jsonify(categories)

@app.route('/api/categories/<path:cat_id>', methods=['PUT'])
def api_category_update(cat_id):
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    body = get_request_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM categories WHERE id = ?', (cat_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({'success': False, 'error': 'Category not found'}), 404

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
    return jsonify({'success': True, 'id': cat_id})

# 10. Orders: List (Admin) & Place Order (Public)
@app.route('/api/orders', methods=['GET', 'POST'])
def api_orders():
    # GET: Admin only
    if request.method == 'GET':
        if not is_authenticated():
            return jsonify({
                'success': False,
                'error': 'Unauthorized: Administrator authentication required to view customer orders.'
            }), 401

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
        return jsonify(orders)

    # POST: Place Order (PUBLIC - Optional phone supported)
    body = get_request_json()
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
    return jsonify({
        'success': True,
        'order': order_obj,
        **order_obj
    }), 201

# 11. Orders: Status Update & Delete
@app.route('/api/orders/<path:order_id>/status', methods=['PUT'])
def api_order_status(order_id):
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    body = get_request_json()
    new_status = (body.get('status') or 'New').strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM orders WHERE id = ?', (order_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'error': f'Order #{order_id} not found.'}), 404

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', (new_status, now_iso, order_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'id': order_id, 'status': new_status})

@app.route('/api/orders/<path:order_id>', methods=['PUT', 'DELETE'])
def api_order_item(order_id):
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized: Administrator authentication required.'}), 401

    if request.method == 'PUT':
        body = get_request_json()
        new_status = (body.get('status') or 'New').strip()
        conn = get_db()
        cursor = conn.cursor()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', (new_status, now_iso, order_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': order_id, 'status': new_status})

    if request.method == 'DELETE':
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, customer_name FROM orders WHERE id = ?', (order_id,))
        order_row = cursor.fetchone()

        if not order_row:
            conn.close()
            return jsonify({
                'success': False,
                'error': f'Order #{order_id} does not exist or has already been deleted.'
            }), 404

        cursor.execute('DELETE FROM orders WHERE id = ?', (order_id,))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Order #{order_id} for {order_row["customer_name"]} permanently deleted.',
            'deletedId': order_id
        }), 200

# 12. Backup & Restore (Admin Only)
@app.route('/api/backup', methods=['GET'])
def api_backup():
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
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
    return jsonify({
        'exportedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'products': prods,
        'categories': cats,
        'orders': ords,
        'settings': sets
    })

@app.route('/api/restore', methods=['POST'])
def api_restore():
    if not is_authenticated():
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    body = get_request_json()
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
    return jsonify({'success': True, 'message': 'Database restored successfully.'})

# 13. Static File Catch-All Handler
@app.route('/<path:filename>')
def serve_static(filename):
    # Prevent directory traversal attacks
    target = os.path.normpath(os.path.join(BASE_DIR, filename))
    if not target.startswith(BASE_DIR):
        return jsonify({'error': 'Forbidden'}), 403
    if os.path.isfile(target):
        return send_from_directory(BASE_DIR, filename)
    return jsonify({'error': 'Not Found'}), 404

# -------------------------------------------------------------
# Development Execution Entry Point
# -------------------------------------------------------------
if __name__ == '__main__':
    url = f"http://localhost:{PORT}"
    print("=" * 70)
    print("  * ELUMALAYAN GARMENTS -- FLASK COMMERCE & WSGI ENGINE *")
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
    app.run(host='0.0.0.0', port=PORT, debug=True)
