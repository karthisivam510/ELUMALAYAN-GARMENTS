import os
import sys
import json
import subprocess
import time
import urllib.request

WORKSPACE = r"d:\2 muse"

def test_persistence_across_restart():
    port = 8003
    base = f"http://127.0.0.1:{port}"

    print("Phase 1: Starting server...")
    proc1 = subprocess.Popen([sys.executable, "server.py", str(port)], cwd=WORKSPACE)
    time.sleep(1.2)

    try:
        # Login
        login_data = json.dumps({"username": "admin", "password": "muse2026!"}).encode('utf-8')
        req = urllib.request.Request(f"{base}/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
        token = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))['token']

        # Save settings with 3 numbers and Salem address
        settings_payload = {
            "storeName": "Elumalayan Garments",
            "whatsappNumber": "+91 99407 73278",
            "whatsappNumber2": "+91 98451 11111",
            "whatsappNumber3": "+91 94432 22222",
            "address": "Elumalayan Garments\n97/12 D, Alraj St,\nSwaminathapuram,\nSalem – 636009,\nTamil Nadu, India."
        }
        req = urllib.request.Request(f"{base}/api/settings", data=json.dumps(settings_payload).encode('utf-8'),
                                     headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='POST')
        urllib.request.urlopen(req)

        # Place an order
        order_payload = {
            "customerName": "Persistence Test Client",
            "mobile": "+91 99407 33333",
            "items": [{"name": "Cocoon Cashmere & Wool Overcoat", "quantity": 1, "price": 650}],
            "totalPrice": 650.0
        }
        req = urllib.request.Request(f"{base}/api/orders", data=json.dumps(order_payload).encode('utf-8'),
                                     headers={'Content-Type': 'application/json'}, method='POST')
        order_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        saved_order_id = order_res['id']

        print(f"Created order {saved_order_id} and saved settings.")
    finally:
        print("Shutting down server...")
        proc1.terminate()
        proc1.wait()

    time.sleep(1)

    print("Phase 2: Restarting server on same port...")
    proc2 = subprocess.Popen([sys.executable, "server.py", str(port)], cwd=WORKSPACE)
    time.sleep(1.2)

    try:
        # Check settings survived restart
        req = urllib.request.urlopen(f"{base}/api/settings")
        restarted_settings = json.loads(req.read().decode('utf-8'))
        assert restarted_settings['storeName'] == "Elumalayan Garments"
        assert restarted_settings['whatsappNumber'] == "+91 99407 73278"
        assert restarted_settings['whatsappNumber2'] == "+91 98451 11111"
        assert restarted_settings['whatsappNumber3'] == "+91 94432 22222"
        assert "Salem – 636009" in restarted_settings['address']
        print("  [PASS] All 3 WhatsApp numbers and Salem address persisted across restart!")

        # Login again to check orders
        login_data = json.dumps({"username": "admin", "password": "muse2026!"}).encode('utf-8')
        req = urllib.request.Request(f"{base}/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
        new_token = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))['token']

        # Verify order survived
        req = urllib.request.Request(f"{base}/api/orders", headers={'Authorization': f'Bearer {new_token}'})
        restarted_orders = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        matching = [o for o in restarted_orders if o['id'] == saved_order_id]
        assert len(matching) == 1
        print(f"  [PASS] Order {saved_order_id} survived restart in SQLite database.")

        # Now delete this test order
        req = urllib.request.Request(f"{base}/api/orders/{saved_order_id}",
                                     headers={'Authorization': f'Bearer {new_token}'}, method='DELETE')
        del_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert del_res['success'] is True
        print(f"  [PASS] Deleted order {saved_order_id}.")

    finally:
        print("Shutting down server...")
        proc2.terminate()
        proc2.wait()

    print("\nPhase 3: Restarting once more to verify deleted order STAYS deleted...")
    proc3 = subprocess.Popen([sys.executable, "server.py", str(port)], cwd=WORKSPACE)
    time.sleep(1.2)
    try:
        login_data = json.dumps({"username": "admin", "password": "muse2026!"}).encode('utf-8')
        req = urllib.request.Request(f"{base}/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
        final_token = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))['token']

        req = urllib.request.Request(f"{base}/api/orders", headers={'Authorization': f'Bearer {final_token}'})
        final_orders = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert not any(o['id'] == saved_order_id for o in final_orders)
        print("  [PASS] Deleted order did NOT resurrect after restart! Permanent deletion verified.")
    finally:
        proc3.terminate()
        proc3.wait()

    print("\nPERSISTENCE & PERMANENT DELETION TEST SUITE 100% SUCCESSFUL!\n")

if __name__ == "__main__":
    test_persistence_across_restart()
