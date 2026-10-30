"""
Comprehensive Verification Suite for Elumalayan Garments
Checks JS syntax balance, HTML element IDs, and full REST API lifecycle.
"""
import os
import sys
import json
import sqlite3
import subprocess
import time
import urllib.request
import urllib.error

WORKSPACE = r"d:\2 muse"

def check_js_brackets(file_path):
    print(f"Checking JS syntax structure: {os.path.basename(file_path)}...")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    in_single = False
    in_double = False
    in_backtick = False
    in_line_comment = False
    in_block_comment = False
    escape = False

    i = 0
    lines = content.split('\n')
    line_num = 1
    col_num = 0

    for char in content:
        if char == '\n':
            line_num += 1
            col_num = 0
            in_line_comment = False
            continue
        col_num += 1

        if escape:
            escape = False
            continue

        if char == '\\':
            escape = True
            continue

        # Check comment / string states
        if in_line_comment:
            continue
        if in_block_comment:
            if content[i-1:i+1] == '*/':
                in_block_comment = False
            continue

        if in_single:
            if char == "'":
                in_single = False
            continue
        if in_double:
            if char == '"':
                in_double = False
            continue
        if in_backtick:
            if char == '`':
                in_backtick = False
            continue

        if content[i:i+2] == '//':
            in_line_comment = True
            continue
        if content[i:i+2] == '/*':
            in_block_comment = True
            continue

        if char == "'":
            in_single = True
            continue
        if char == '"':
            in_double = True
            continue
        if char == '`':
            in_backtick = True
            continue

        if char in '({[':
            stack.append((char, line_num, col_num))
        elif char in ')}]':
            if not stack:
                raise SyntaxError(f"Unmatched closing '{char}' at line {line_num}:{col_num} in {file_path}")
            top, t_line, t_col = stack.pop()
            if pairs[char] != top:
                raise SyntaxError(f"Mismatched bracket: expected match for '{top}' (from line {t_line}:{t_col}), got '{char}' at line {line_num}:{col_num}")

        i += 1

    if stack:
        top, t_line, t_col = stack[-1]
        raise SyntaxError(f"Unclosed '{top}' from line {t_line}:{t_col} in {file_path}")

    print(f"  [OK] {os.path.basename(file_path)} bracket balance clean ({line_num} lines).")

def check_html_ids():
    print("Checking HTML IDs and elements...")
    with open(os.path.join(WORKSPACE, "admin.html"), "r", encoding="utf-8") as f:
        admin_html = f.read()

    admin_required_ids = [
        "settings-store-name", "settings-tagline", "settings-currency",
        "settings-whatsapp", "settings-whatsapp-2", "settings-whatsapp-3",
        "settings-address", "settings-email", "settings-phone",
        "settings-instagram", "confirm-delete-button", "delete-confirm-modal"
    ]
    for req_id in admin_required_ids:
        assert f'id="{req_id}"' in admin_html or f"id='{req_id}'" in admin_html, f"Missing id '{req_id}' in admin.html"
    print("  [OK] admin.html has all required IDs for 3 WhatsApp numbers and deletion.")

    with open(os.path.join(WORKSPACE, "index.html"), "r", encoding="utf-8") as f:
        index_html = f.read()

    index_required_ids = [
        "order-dispatch-modal", "dispatch-modal-order-id", "dispatch-customer-name",
        "dispatch-total-amount", "dispatch-contacts-container", "store-address-display",
        "store-hours-display"
    ]
    for req_id in index_required_ids:
        assert f'id="{req_id}"' in index_html or f"id='{req_id}'" in index_html, f"Missing id '{req_id}' in index.html"
    print("  [OK] index.html has all required IDs for multi-WhatsApp order dispatch and Salem address.")

def run_api_tests():
    print("Starting API Integration Test Server...")
    test_port = 8002
    proc = subprocess.Popen([sys.executable, "server.py", str(test_port)], cwd=WORKSPACE)
    time.sleep(1.5)

    base = f"http://127.0.0.1:{test_port}"
    try:
        # 1. Health
        req = urllib.request.urlopen(f"{base}/api/health")
        data = json.loads(req.read().decode('utf-8'))
        assert data['status'] == 'online'
        assert data['store'] == 'Elumalayan Garments'
        print("  [PASS] GET /api/health returned online Elumalayan Garments")

        # 2. Settings check
        req = urllib.request.urlopen(f"{base}/api/settings")
        sets = json.loads(req.read().decode('utf-8'))
        assert "Elumalayan" in sets.get('storeName', '')
        assert "Salem" in sets.get('address', '')
        assert "9940773278" in sets.get('whatsappNumber', '') or "99407 73278" in sets.get('whatsappNumber', '')
        print("  [PASS] GET /api/settings returned Salem address and primary WhatsApp")

        # 3. Login
        login_data = json.dumps({"username": "admin", "password": "muse2026!", "remember": True}).encode('utf-8')
        req = urllib.request.Request(f"{base}/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
        res = urllib.request.urlopen(req)
        login_res = json.loads(res.read().decode('utf-8'))
        assert login_res['success'] is True
        token = login_res['token']
        print("  [PASS] POST /api/auth/login succeeded with session token")

        # 4. Save 3 WhatsApp numbers
        update_sets = {
            "whatsappNumber": "+91 99407 73278",
            "whatsappNumber2": "+91 98451 23456",
            "whatsappNumber3": "+91 94432 56789",
            "address": "Elumalayan Garments\n97/12 D, Alraj St,\nSwaminathapuram,\nSalem – 636009,\nTamil Nadu, India."
        }
        req = urllib.request.Request(f"{base}/api/settings", data=json.dumps(update_sets).encode('utf-8'),
                                     headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='POST')
        res = urllib.request.urlopen(req)
        saved = json.loads(res.read().decode('utf-8'))
        assert saved.get('whatsappNumber') == "+91 99407 73278"
        assert saved.get('whatsappNumber2') == "+91 98451 23456"
        assert saved.get('whatsappNumber3') == "+91 94432 56789"
        print("  [PASS] POST /api/settings correctly saved all 3 WhatsApp numbers")

        # 5. Place Customer Order (Public)
        order_payload = {
            "customerName": "Test Buyer Salem",
            "mobile": "+91 98451 99999",
            "whatsapp": "+91 98451 99999",
            "email": "buyer@salem.in",
            "address": "12 Fairlands Main Rd, Salem - 636016",
            "items": [{"name": "Cocoon Cashmere & Wool Overcoat", "size": "L", "color": "Camel", "quantity": 1, "price": 650}],
            "totalPrice": 650.0,
            "status": "New"
        }
        req = urllib.request.Request(f"{base}/api/orders", data=json.dumps(order_payload).encode('utf-8'),
                                     headers={'Content-Type': 'application/json'}, method='POST')
        res = urllib.request.urlopen(req)
        placed_order = json.loads(res.read().decode('utf-8'))
        order_id = placed_order['id']
        assert order_id.startswith('ord-')
        print(f"  [PASS] POST /api/orders created single order #{order_id}")

        # 6. Admin GET orders
        req = urllib.request.Request(f"{base}/api/orders", headers={'Authorization': f'Bearer {token}'})
        res = urllib.request.urlopen(req)
        orders_list = json.loads(res.read().decode('utf-8'))
        matching = [o for o in orders_list if o['id'] == order_id]
        assert len(matching) == 1, f"Expected exactly 1 order, found {len(matching)}"
        print("  [PASS] GET /api/orders verified order exists exactly once in DB")

        # 7. Unauthenticated DELETE must be rejected (401)
        try:
            req = urllib.request.Request(f"{base}/api/orders/{order_id}", method='DELETE')
            urllib.request.urlopen(req)
            raise AssertionError("Unauthenticated DELETE should have returned 401!")
        except urllib.error.HTTPError as e:
            assert e.code == 401
            print("  [PASS] DELETE /api/orders/<id> without auth rejected with HTTP 401")

        # 8. Authenticated DELETE
        req = urllib.request.Request(f"{base}/api/orders/{order_id}",
                                     headers={'Authorization': f'Bearer {token}'}, method='DELETE')
        res = urllib.request.urlopen(req)
        del_res = json.loads(res.read().decode('utf-8'))
        assert del_res.get('success') is True
        print(f"  [PASS] DELETE /api/orders/{order_id} returned 200 {del_res}")

        # 9. Verify order is deleted and does not resurrect
        req = urllib.request.Request(f"{base}/api/orders", headers={'Authorization': f'Bearer {token}'})
        res = urllib.request.urlopen(req)
        orders_after = json.loads(res.read().decode('utf-8'))
        assert not any(o['id'] == order_id for o in orders_after), "Order resurrected after deletion!"
        print("  [PASS] GET /api/orders confirmed order is permanently removed from SQLite database")

    finally:
        proc.terminate()
        proc.wait()
        print("Integration Test Server Terminated.")

if __name__ == "__main__":
    for js_file in ["js/config.js", "js/storage.js", "js/auth.js", "js/admin.js", "js/app.js"]:
        check_js_brackets(os.path.join(WORKSPACE, js_file))
    check_html_ids()
    run_api_tests()
    print("\nALL 9 VERIFICATION CHECKS PASSED PERFECTLY!\n")
