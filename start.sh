#!/usr/bin/env bash
echo "======================================================="
echo "        MUSE ATELIER - PREMIUM CLOTHING STORE"
echo "======================================================="
echo ""
echo "Launching server on http://localhost:8000 ..."
echo "Public Storefront:  http://localhost:8000"
echo "Private Admin:      http://localhost:8000/admin.html"
echo "Admin Credentials:  admin / muse2026!"
echo ""
echo "Press Ctrl+C to stop the server."
echo "======================================================="
echo ""

python3 server.py 8000 || python server.py 8000
