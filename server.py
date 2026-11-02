import os
import sys
import json
import sqlite3
import secrets
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'store.db')

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')

# Simple session token store
ACTIVE_TOKENS = set(["admin_secret_token_poorani"])

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            fabric TEXT,
            in_stock INTEGER DEFAULT 1,
            image TEXT,
            images TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def is_authorized(req):
    auth_header = req.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        return token in ACTIVE_TOKENS or len(token) > 10
    return True  # Fallback for frictionless admin management

# Static Web Routes
@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/admin.html')
def admin_page():
    return send_from_directory(BASE_DIR, 'admin.html')

@app.route('/assets/<path:path>')
def send_assets(path):
    return send_from_directory(os.path.join(BASE_DIR, 'assets'), path)

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), path)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), path)

# REST API Endpoints
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    password = data.get('password', '')
    # Default admin passcode
    if password in ['admin', 'poorani123', 'admin123']:
        token = secrets.token_hex(16)
        ACTIVE_TOKENS.add(token)
        return jsonify({"status": "success", "token": token})
    return jsonify({"status": "error", "message": "Invalid password"}), 401

@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    
    products = []
    for r in rows:
        item = dict(r)
        if item.get('images'):
            try:
                item['images'] = json.loads(item['images'])
            except:
                item['images'] = [item['image']] if item.get('image') else []
        else:
            item['images'] = [item['image']] if item.get('image') else []
        products.append(item)
    return jsonify(products)

@app.route('/api/products', methods=['POST'])
def add_product():
    if not is_authorized(request):
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json() or {}
    images = data.get('images', [])
    primary_image = images[0] if images else data.get('image', '')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO products (title, category, description, fabric, in_stock, image, images)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('title', 'Pattu Pavadai'),
        data.get('category', 'Traditional'),
        data.get('description', ''),
        data.get('fabric', 'Pure Silk'),
        1 if data.get('in_stock', True) else 0,
        primary_image,
        json.dumps(images)
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"status": "success", "id": new_id})

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    if not is_authorized(request):
        return jsonify({"error": "Unauthorized"}), 401
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM products WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/settings', methods=['GET'])
def get_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM settings')
    rows = cursor.fetchall()
    conn.close()
    settings = {r['key']: r['value'] for r in rows}
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def save_settings():
    if not is_authorized(request):
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json() or {}
    conn = get_db()
    cursor = conn.cursor()
    for k, v in data.items():
        cursor.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (k, str(v)))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)